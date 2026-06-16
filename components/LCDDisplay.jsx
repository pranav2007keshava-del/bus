"use client";

// Simulates the physical 16×2 I2C LCD display
export default function LCDDisplay({ lines, flash }) {
  const pad = (str) => (str || "").substring(0, 16).padEnd(16, "\u00a0");

  return (
    <section className="flex flex-col items-center">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#7a7f9a] mb-5">
        LCD Display
      </h2>

      {/* Bezel */}
      <div className="bg-[#2b2b2b] rounded-2xl px-7 pt-6 pb-4 flex flex-col items-center gap-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)] w-full max-w-sm">

        {/* Screen */}
        <div
          className={`bg-lcdbg rounded-lg px-5 py-3 w-full border-2 border-[#1a3a0a] shadow-lcd ${
            flash ? "lcd-flash" : ""
          }`}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="font-mono text-2xl lcd-text tracking-widest leading-[1.9] whitespace-pre"
            >
              {pad(lines[i])}
            </div>
          ))}
        </div>

        {/* Label */}
        <p className="text-[10px] text-[#444] uppercase tracking-widest">16 × 2 LCD</p>
      </div>
    </section>
  );
}
