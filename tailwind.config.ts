import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        destaque: "var(--y)",
        th: "var(--th)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        bad: "var(--bad)"
      },
      fontFamily: {
        cond: ["'Barlow Condensed'", "sans-serif"],
        barlow: ["Barlow", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
