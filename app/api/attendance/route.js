import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import Pusher from "pusher";

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID,
  key:     process.env.PUSHER_KEY,
  secret:  process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS:  true,
});

// POST /api/attendance — called by the ESP32
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, location, time, ampm, uid } = body;

    if (!name || !location || !time) {
      return NextResponse.json(
        { error: "Missing required fields: name, location, time" },
        { status: 400 }
      );
    }

    const record = {
      id:        Date.now(),
      name,
      location,   // "PESCE" or "Home"
      time,       // "08:30:00"
      ampm:       ampm || "",
      uid:        uid  || "N/A",
      timestamp:  new Date().toISOString(),
    };

    // ── Persist in Vercel KV ────────────────────────────────────────────────
    // Push record to a list (newest first via lpush)
    await kv.lpush("attendance_log", JSON.stringify(record));
    // Trim to last 500 records
    await kv.ltrim("attendance_log", 0, 499);

    // Update current status hash
    const statusKey = `status:${name}`;
    await kv.hset(statusKey, {
      inside:   location === "PESCE" ? "1" : "0",
      lastSeen: `${time} ${ampm}`,
      location,
    });

    // ── Push live event to browsers via Pusher ──────────────────────────────
    await pusher.trigger("attendance", "new-record", { record });

    console.log(`[${new Date().toLocaleTimeString()}] ${name} → ${location} at ${time} ${ampm}`);
    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("POST /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/attendance — returns log + current status (used on page load)
export async function GET() {
  try {
    const rawList = await kv.lrange("attendance_log", 0, 99);
    const attendanceLog = rawList.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item
    );

    const names = ["Pranav", "Chiranth"];
    const currentStatus = {};
    for (const name of names) {
      const s = await kv.hgetall(`status:${name}`);
      currentStatus[name] = s
        ? { inside: s.inside === "1", lastSeen: s.lastSeen, location: s.location }
        : { inside: false, lastSeen: null, location: null };
    }

    return NextResponse.json({ attendanceLog, currentStatus });
  } catch (err) {
    console.error("GET /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
