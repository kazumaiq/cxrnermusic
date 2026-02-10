import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#0a0614",
        panel: "rgba(17, 8, 30, 0.6)",
        neon: "#b44bff",
        neonSoft: "#d28bff",
        aqua: "#53f6ff",
        magenta: "#ff4bd6",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(180,75,255,0.45), 0 0 60px rgba(83,246,255,0.15)",
        glowStrong: "0 0 30px rgba(180,75,255,0.65), 0 0 80px rgba(255,75,214,0.2)",
        innerGlow: "inset 0 0 30px rgba(180,75,255,0.2)",
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(1200px circle at 20% 10%, rgba(180,75,255,0.25), transparent 60%), radial-gradient(1000px circle at 80% 20%, rgba(83,246,255,0.2), transparent 60%), radial-gradient(1200px circle at 50% 80%, rgba(255,75,214,0.15), transparent 70%)",
        "grid": "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 6s ease infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
