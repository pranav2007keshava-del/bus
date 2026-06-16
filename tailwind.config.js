/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Courier New'", "monospace"],
      },
      colors: {
        bg:       "#0f1117",
        surface:  "#1a1d27",
        surface2: "#22263a",
        border:   "#2e3250",
        accent:   "#6c63ff",
        accent2:  "#ff6584",
        ledgreen: "#a8e063",
        lcdbg:    "#1a2b0f",
      },
      boxShadow: {
        lcd: "0 0 20px rgba(168,224,99,0.35), inset 0 0 12px rgba(0,0,0,0.5)",
        card: "0 0 24px rgba(67,233,123,0.1)",
      },
    },
  },
  plugins: [],
};
