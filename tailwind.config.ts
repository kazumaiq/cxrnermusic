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
        // Core CXRNER Vivid Midnight Identity
        deepBlack: "#0B0718",
        cosmicBlack: "#120C28",
        darkViolet: "#1D143D",
        electricPurple: "#8B5CF6",
        neonViolet: "#C084FC",
        chromeSilver: "#E6E1FA",

        // Semantic & Legacy Compatibility Tokens
        void: "#0B0718",
        night: "#120C28",
        surface: "#171131",
        elevated: "#201744",
        borderDark: "#2C2058",
        borderLight: "#43317D",
        textPrimary: "#FFFFFF",
        textSecondary: "#E6E1FA",
        textMuted: "#C2BAE8",
        accentSilver: "#E6E1FA",
        accentWine: "#3D0A14",
        neon: "#8B5CF6",
        neonSoft: "#C084FC",
        aqua: "#22D3EE",
        magenta: "#C084FC",
        whiteSoft: "#F7F5FF",
      },
      fontFamily: {
        heavy: ["var(--font-onest)", "var(--font-manrope)", "var(--font-inter)", "-apple-system", "sans-serif"],
        gothic: ["var(--font-onest)", "var(--font-manrope)", "sans-serif"],
        display: ["var(--font-onest)", "var(--font-manrope)", "-apple-system", "sans-serif"],
        unbounded: ["var(--font-onest)", "var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        body: ["var(--font-manrope)", "var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["var(--font-manrope)", "var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255, 255, 255, 0.12), 0 22px 54px rgba(7, 4, 18, 0.72)",
        glow: "0 0 32px rgba(139, 92, 246, 0.42)",
        glowAqua: "0 0 28px rgba(34, 211, 238, 0.28)",
        glowWhite: "0 0 32px rgba(255, 255, 255, 0.2)",
        insetDark: "inset 0 1px 0 rgba(255, 255, 255, 0.14)",
      },
      keyframes: {
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.78" },
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
