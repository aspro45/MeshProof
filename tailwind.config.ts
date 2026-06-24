import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05070A",
        panel: "#0E131A",
        panel2: "#151B24",
        text: "#E6EDF3",
        muted: "#8B9AA8",
        primary: "#38BDF8",
        verified: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        line: "#263241",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "Cascadia Code", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { DEFAULT: "6px", md: "6px", lg: "8px" },
      boxShadow: { panel: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 2px 10px rgba(0,0,0,0.5)", pop: "0 16px 44px -16px rgba(0,0,0,0.8)" },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(5px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        scan: { from: { transform: "translateY(-100%)" }, to: { transform: "translateY(100%)" } },
      },
      animation: { fadeUp: "fadeUp 0.25s ease-out", pulse2: "pulse2 1.6s ease-in-out infinite", scan: "scan 2.4s linear infinite" },
    },
  },
  plugins: [],
};
export default config;
