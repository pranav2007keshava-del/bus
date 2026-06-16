import Dashboard from "@/components/Dashboard";

// Fetch initial data server-side so the page isn't blank on first load
async function getInitialData() {
  try {
    // During build/static generation this would fail, so we guard it
    const { kv } = await import("@vercel/kv");

    const rawList = await kv.lrange("attendance_log", 0, 99);
    const attendanceLog = rawList.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item
    );

    const names = ["Pranav", "Chiranth"];
    const currentStatus = {};
    for (const name of names) {
      const s = await kv.hgetall(`status:${name}`);
      currentStatus[name] = s
        ? { inside: s.inside === "1", lastSeen: s.lastSeen || null, location: s.location || null }
        : { inside: false, lastSeen: null, location: null };
    }

    return { attendanceLog, currentStatus };
  } catch {
    // KV not available (local dev without .env.local) — return empty state
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
