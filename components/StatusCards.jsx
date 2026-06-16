"use client";

const PEOPLE = [
  { name: "Pranav",   color: "#6c63ff", letter: "P" },
  { name: "Chiranth", color: "#ff6584", letter: "C" },
];

export default function StatusCards({ status }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#7a7f9a] mb-5">
        Current Status
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {PEOPLE.map(({ name, color, letter }) => {
          const s = status?.[name] || { inside: false, lastSeen: null, location: null };
          return (
            <div
              key={name}
              className={`bg-surface rounded-2xl border p-6 flex items-start gap-4 transition-all duration-300 ${
                s.inside
                  ? "border-[#43e97b] shadow-card"
                  : "border-border"
              }`}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {letter}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold mb-1">{name}</h3>

                {/* Status badge */}
                <span
                  className={`inline-block text-[11px] font-bold uppercase tracking-wide px-3 py-0.5 rounded-full border ${
                    s.inside
                      ? "bg-[#43e97b]/15 text-[#43e97b] border-[#43e97b]"
                      : "bg-[#7a7f9a]/10 text-[#7a7f9a] border-border"
                  }`}
                >
                  {s.inside ? "Inside PESCE" : s.location === "Home" ? "At Home" : "Outside"}
                </span>

                {/* Meta */}
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-center text-sm">
                  <span className="text-[10px] uppercase tracking-wider text-[#7a7f9a]">Last Seen</span>
                  <span className="font-medium truncate">{s.lastSeen || "—"}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#7a7f9a]">Location</span>
                  <span className="font-medium truncate">{s.location || "—"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
