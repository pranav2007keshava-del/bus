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

// POST /api/unknown — called by the ESP32 when an unrecognised card is scanned
export async function POST(request) {
  try {
    const body = await request.json();
    const { uid } = body;

    const record = {
      id:        Date.now(),
      name:      "Unknown",
      location:  "—",
      time:      "—",
      ampm:      "",
      uid:       uid || "N/A",
      timestamp: new Date().toISOString(),
    };

    await kv.lpush("attendance_log", JSON.stringify(record));
    await kv.ltrim("attendance_log", 0, 499);

    await pusher.trigger("attendance", "unknown-card", { record });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/unknown error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
