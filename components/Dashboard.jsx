"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import LCDDisplay from "./LCDDisplay";
import StatusCards from "./StatusCards";
import AttendanceLog from "./AttendanceLog";

export default function Dashboard({ initialData }) {
  const [log, setLog]               = useState(initialData.attendanceLog || []);
  const [status, setStatus]         = useState(initialData.currentStatus);
  const [connected, setConnected]   = useState(false);
  const [lcdLines, setLcdLines]     = useState(["Scan Card", ""]);
  const [lcdFlash, setLcdFlash]     = useState(false);
  const lcdTimerRef                 = useRef(null);

  // ── LCD animation ──────────────────────────────────────────────────────────
  const triggerLCDFlash = useCallback(() => {
    setLcdFlash(false);
    requestAnimationFrame(() => setLcdFlash(true));
    setTimeout(() => setLcdFlash(false), 500);
  }, []);

  const animateLCD = useCallback((record) => {
    clearTimeout(lcdTimerRef.current);
    const line1 = `${record.name} Enterd`.substring(0, 16);
    const line2 = record.location === "PESCE" ? "PESCE" : "Home";

    setLcdLines([line1, line2]);
    triggerLCDFlash();

    // Screen 2 — time after 3 s
    lcdTimerRef.current = setTimeout(() => {
      setLcdLines([`Time:`, `${record.time} ${record.ampm}`]);
      triggerLCDFlash();

      // Back to idle after 4 s
      lcdTimerRef.current = setTimeout(() => {
        setLcdLines(["Scan Card", ""]);
        triggerLCDFlash();
      }, 4000);
    }, 3000);
  }, [triggerLCDFlash]);

  // ── Pusher subscription ───────────────────────────────────────────────────
  useEffect(() => {
    const pusherKey     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey) {
      console.warn("NEXT_PUBLIC_PUSHER_KEY not set — live updates disabled");
      return;
    }

    const pusher  = new Pusher(pusherKey, { cluster: pusherCluster });
    const channel = pusher.subscribe("attendance");

    pusher.connection.bind("connected",    () => setConnected(true));
    pusher.connection.bind("disconnected", () => setConnected(false));
    pusher.connection.bind("error",        () => setConnected(false));

    // New attendance event
    channel.bind("new-record", ({ record }) => {
      setLog((prev) => [record, ...prev].slice(0, 200));
      animateLCD(record);

      // Optimistically update status
      setStatus((prev) => ({
        ...prev,
        [record.name]: {
          inside:   record.location === "PESCE",
          lastSeen: `${record.time} ${record.ampm}`,
          location: record.location,
        },
      }));
    });

    // Unknown card event
    channel.bind("unknown-card", ({ record }) => {
      setLog((prev) => [record, ...prev].slice(0, 200));
      setLcdLines(["Unknown Card", ""]);
      triggerLCDFlash();
      setTimeout(() => {
        setLcdLines(["Scan Card", ""]);
        triggerLCDFlash();
      }, 2000);
    });

    return () => {
      pusher.unsubscribe("attendance");
      pusher.disconnect();
      clearTimeout(lcdTimerRef.current);
    };
  }, [animateLCD, triggerLCDFlash]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-surface border-b border-border sticky top-0 z-50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📡</span>
            <div>
              <h1 className="text-lg font-bold text-[#e6e9f4] leading-tight">
                RFID Attendance System
              </h1>
              <p className="text-xs text-[#7a7f9a]">PESCE — Real-time Tracking Dashboard</p>
            </div>
          </div>

          {/* Connection badge */}
          <div
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300 ${
              connected
                ? "border-[#43e97b] text-[#43e97b] bg-[#43e97b]/10"
                : "border-border text-[#7a7f9a] bg-surface2"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-[#43e97b] shadow-[0_0_8px_#43e97b] pulse-dot" : "bg-[#7a7f9a]"
              }`}
            />
            {connected ? "Live" : "Connecting…"}
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-12 flex-1">
        <LCDDisplay lines={lcdLines} flash={lcdFlash} />
        <StatusCards status={status} />
        <AttendanceLog log={log} />
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="text-center py-5 text-xs text-[#7a7f9a] border-t border-border">
        PESCE RFID Attendance &mdash; ESP32 + MFRC522 &mdash; Next.js + Pusher + Vercel KV
      </footer>
    </div>
  );
}
