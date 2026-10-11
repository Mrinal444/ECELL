import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F5F0",
        surface: "#FFFFFF",
        "surface-muted": "#EFECE6",
        "surface-dark": "#18181B",
        border: {
          light: "#E3DFD5",
          DEFAULT: "#D2CDC0",
          dark: "#2D2D2A",
        },
        ink: {
          DEFAULT: "#18181B",
          muted: "#66645E",
          faint: "#9C988F",
          inverse: "#F7F5F0",
        },
        signal: {
          red: "#DC2626",
          "red-bg": "#FEF2F2",
          "red-border": "#FECACA",
          amber: "#D97706",
          "amber-bg": "#FFFBEB",
          green: "#16A34A",
          "green-bg": "#F0FDF4",
          blue: "#2563EB",
          "blue-bg": "#EFF6FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "JetBrains Mono", "monospace"],
        grotesk: ["var(--font-grotesk)", "Arial Black", "Impact", "sans-serif"],
      },
      boxShadow: {
        sharp: "2px 2px 0px 0px rgba(24, 24, 27, 1)",
        "sharp-sm": "1px 1px 0px 0px rgba(24, 24, 27, 1)",
        "sharp-lg": "4px 4px 0px 0px rgba(24, 24, 27, 1)",
        "sharp-red": "2px 2px 0px 0px rgba(220, 38, 38, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
