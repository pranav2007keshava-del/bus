"use client";

import { useState } from "react";

export default function AttendanceLog({ log }) {
  const [localLog, setLocalLog] = useState(log);

  // Sync when parent passes new log (on Pusher events, parent updates)
  // We use the prop directly for render — local state only for clear button
  const displayLog = log;

  const locBadge = (location) => {
    if (location === "PESCE")
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6c63ff]/15 text-[#a89cff] border border-[#6c63ff]/40">
          PESCE
        </span>
      );
    if (location === "Home")
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ff6584]/12 text-[#ff8fab] border border-[#ff6584]/30">
          Home
        </span>
      );
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#7a7f9a]/10 text-[#7a7f9a] border border-border">
        {location}
      </span>
    );
  };

  const formatTimestamp = (ts) => {
    try {
      return new Date(ts).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#7a7f9a]">
          Attendance Log
        </h2>
        <span className="text-xs text-[#7a7f9a] bg-surface2 border border-border px-3 py-1 rounded-full">
          {displayLog.length} records
        </span>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-surface2">
              {["#", "Name", "Location", "Time", "Card UID", "Timestamp"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7a7f9a] border-b border-border"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayLog.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#7a7f9a] italic">
                  Waiting for card scan…
                </td>
              </tr>
            ) : (
              displayLog.map((record, idx) => (
                <tr
                  key={record.id}
                  className={`border-b border-border last:border-b-0 hover:bg-surface2 transition-colors ${
                    idx === 0 ? "row-enter" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-[#7a7f9a] text-xs">{displayLog.length - idx}</td>
                  <td className="px-4 py-3 font-semibold">{record.name}</td>
                  <td className="px-4 py-3">{locBadge(record.location)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {record.time} {record.ampm}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#7a7f9a] tracking-wider">
                    {record.uid}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#7a7f9a]">
                    {formatTimestamp(record.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
