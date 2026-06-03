import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary:  v("--bg-primary"),
          surface:  v("--bg-surface"),
          elevated: v("--bg-elevated"),
          hover:    v("--bg-hover"),
        },
        border: {
          DEFAULT: v("--border"),
          hover:   v("--border-hover"),
        },
        text: {
          primary:   v("--text-primary"),
          secondary: v("--text-secondary"),
          muted:     v("--text-muted"),
        },
        saffron: {
          DEFAULT: "#FF6B1A",
          hover: "#FF823C",
          50: "#FFF5EE",
          100: "#FFE5D2",
          900: "#7A2700",
        },
        teal: {
          DEFAULT: "#00D4AA",
          hover: "#00E8BB",
          dim: "#00A88A",
        },
        purple: {
          DEFAULT: "#7C3AED",
          hover: "#8B4FED",
        },
        /* vertical accent colors */
        train: {
          DEFAULT: "#4F46E5",
          hover:   "#6366F1",
          dim:     "#3730A3",
        },
        flight: {
          DEFAULT: "#06B6D4",
          hover:   "#22D3EE",
          dim:     "#0891B2",
        },
        hotel: {
          DEFAULT: "#F59E0B",
          hover:   "#FBBF24",
          dim:     "#D97706",
        },
        danger: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
      },
      fontFamily: {
        display: ['"Clash Display"', "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 107, 26, 0.3)",
        "glow-teal": "0 0 20px rgba(0, 212, 170, 0.3)",
        "glow-purple": "0 0 20px rgba(124, 58, 237, 0.3)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.6)",
      },
      backgroundImage: {
        "gradient-saffron": "linear-gradient(135deg, #FF6B1A 0%, #FFB347 100%)",
        "gradient-purple": "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        "gradient-dark": "linear-gradient(180deg, #0A0E1A 0%, #111827 100%)",
        "hero-atmosphere":
          "radial-gradient(ellipse at top, rgba(255, 107, 26, 0.15) 0%, rgba(10, 14, 26, 0) 50%), radial-gradient(ellipse at bottom, rgba(124, 58, 237, 0.1) 0%, rgba(10, 14, 26, 0) 50%)",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      spacing: {
        "0.5": "2px",
        "18": "72px",
        "88": "352px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-glow": "pulseGlow 2s infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 107, 26, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(255, 107, 26, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
