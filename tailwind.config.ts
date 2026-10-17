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
        void: "#030303",
        night: "#080808",
        surface: "#101010",
        elevated: "#181818",
        borderDark: "#222222",
        borderLight: "#333333",
        textPrimary: "#EAEAEA",
        textSecondary: "#A1A1A1",
        textMuted: "#666666",
        accentSilver: "#D4D4D8",
        accentWine: "#3D0A14",
      },
      fontFamily: {
        heavy: ["var(--font-oswald)", "var(--font-bebas)", "Impact", "sans-serif"],
        gothic: ["var(--font-oswald)", "var(--font-bebas)", "var(--font-unbounded)", "Impact", "sans-serif"],
        display: ["var(--font-oswald)", "var(--font-unbounded)", "var(--font-bebas)", "sans-serif"],
        unbounded: ["var(--font-unbounded)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 30px rgba(0, 0, 0, 0.8)",
        glowWhite: "0 0 30px rgba(255, 255, 255, 0.15)",
        insetDark: "inset 0 0 20px rgba(0, 0, 0, 0.9)",
      },
      keyframes: {
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "spin-slow": "spinSlow 24s linear infinite",
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
