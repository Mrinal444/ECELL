/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          canvas: "#FBF9F5",
          ink: "#0D1520",
          navy: "#132338",
          surface: "#FFFFFF",
          card: "#F4EFEA",
          border: "#E2DCD5",
          muted: "#64748B",
          copper: {
            DEFAULT: "#B45309",
            light: "#D97706",
            dark: "#92400E",
            faint: "#FEF3C7",
          },
          emerald: {
            DEFAULT: "#059669",
            faint: "#ECFDF5",
          },
          ruby: {
            DEFAULT: "#DC2626",
            faint: "#FEF2F2",
          }
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
