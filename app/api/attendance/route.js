import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import Pusher from "pusher";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
      location,
      time,
      ampm:      ampm || "",
      uid:       uid  || "N/A",
      timestamp: new Date().toISOString(),
    };

    // Save to Upstash Redis
    await redis.lpush("attendance_log", JSON.stringify(record));
    await redis.ltrim("attendance_log", 0, 499);

    // Update current status
    await redis.hset(`status:${name}`, {
      inside:   location === "PESCE" ? "1" : "0",
      lastSeen: `${time} ${ampm}`,
      location,
    });

    // Push live event to browsers
    await pusher.trigger("attendance", "new-record", { record });

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("POST /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/attendance — initial page load data
export async function GET() {
  try {
    const rawList = await redis.lrange("attendance_log", 0, 99);
    const attendanceLog = rawList.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item
    );

    const names = ["Pranav", "Chiranth"];
    const currentStatus = {};
    for (const name of names) {
      const s = await redis.hgetall(`status:${name}`);
      currentStatus[name] = s
        ? { inside: s.inside === "1", lastSeen: s.lastSeen || null, location: s.location || null }
        : { inside: false, lastSeen: null, location: null };
    }

    return NextResponse.json({ attendanceLog, currentStatus });
  } catch (err) {
    console.error("GET /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
