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
        // Core CXRNER Cosmic Identity
        deepBlack: "#050407",
        cosmicBlack: "#090611",
        darkViolet: "#160B28",
        electricPurple: "#8737FF",
        neonViolet: "#B46BFF",
        chromeSilver: "#D9D9E2",

        // Semantic & Legacy Compatibility Tokens
        void: "#050407",
        night: "#090611",
        surface: "#0E0A18",
        elevated: "#160B28",
        borderDark: "#1F1733",
        borderLight: "#332552",
        textPrimary: "#FFFFFF",
        textSecondary: "#D9D9E2",
        textMuted: "#7E7991",
        accentSilver: "#D9D9E2",
        accentWine: "#3D0A14",
        neon: "#8737FF",
        neonSoft: "#B46BFF",
        aqua: "#D9D9E2",
        magenta: "#B46BFF",
        whiteSoft: "#F4F2FA",
      },
      fontFamily: {
        heavy: ["var(--font-unbounded)", "var(--font-inter)", "-apple-system", "sans-serif"],
        gothic: ["var(--font-unbounded)", "var(--font-inter)", "sans-serif"],
        display: ["var(--font-unbounded)", "var(--font-inter)", "-apple-system", "sans-serif"],
        unbounded: ["var(--font-unbounded)", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        body: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(217, 217, 226, 0.08), 0 24px 60px rgba(5, 4, 7, 0.9)",
        glow: "0 0 28px rgba(135, 55, 255, 0.35)",
        glowAqua: "0 0 28px rgba(217, 217, 226, 0.25)",
        glowWhite: "0 0 30px rgba(255, 255, 255, 0.16)",
        insetDark: "inset 0 0 28px rgba(5, 4, 7, 0.92)",
      },
      keyframes: {
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.75" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "spin-slow": "spinSlow 28s linear infinite",
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
        marquee: "marquee 36s linear infinite",
        fadeIn: "fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
