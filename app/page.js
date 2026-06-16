import Dashboard from "@/components/Dashboard";

async function getInitialData() {
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

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

    return { attendanceLog, currentStatus };
  } catch {
    return {
      attendanceLog: [],
      currentStatus: {
        Pranav:   { inside: false, lastSeen: null, location: null },
        Chiranth: { inside: false, lastSeen: null, location: null },
      },
    };
  }
}

export default async function Home() {
  const initialData = await getInitialData();
  return <Dashboard initialData={initialData} />;
}
