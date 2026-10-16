import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#08040f",
        nightSurface: "#0f081d",
        nightElevated: "#160c2b",
        panel: "rgba(18, 10, 32, 0.7)",
        neon: {
          DEFAULT: "#b44bff",
          soft: "#d28bff",
          glow: "#9326eb",
          dark: "#6812b3",
        },
        aqua: {
          DEFAULT: "#53f6ff",
          soft: "#9bf9ff",
          glow: "#00d5e8",
        },
        magenta: {
          DEFAULT: "#ff4bd6",
          soft: "#ff82e2",
          glow: "#e600b3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Orbitron", "sans-serif"],
        heading: ["var(--font-heading)", "Syne", "sans-serif"],
        body: ["var(--font-body)", "'Exo 2'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 30px -5px rgba(180, 75, 255, 0.5), 0 0 60px -10px rgba(83, 246, 255, 0.2)",
        glowStrong: "0 0 40px -2px rgba(180, 75, 255, 0.75), 0 0 90px rgba(255, 75, 214, 0.35)",
        glowAqua: "0 0 30px -5px rgba(83, 246, 255, 0.5), 0 0 60px -10px rgba(83, 246, 255, 0.2)",
        glowMagenta: "0 0 30px -5px rgba(255, 75, 214, 0.5), 0 0 60px -10px rgba(255, 75, 214, 0.2)",
        innerGlow: "inset 0 0 25px rgba(180, 75, 255, 0.25)",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(1200px circle at 20% 10%, rgba(180,75,255,0.22), transparent 60%), radial-gradient(1000px circle at 80% 20%, rgba(83,246,255,0.18), transparent 60%), radial-gradient(1200px circle at 50% 80%, rgba(255,75,214,0.14), transparent 70%)",
        grid: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
