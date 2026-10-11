/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFCFB',
          100: '#FAF8F5',
          200: '#F4F0E8',
          300: '#EBE5D8',
          400: '#DCD2BF',
          500: '#C8BA9F',
          DEFAULT: '#FAF8F5',
        },
        ink: {
          50: '#8E8880',
          100: '#6E675E',
          200: '#534C44',
          300: '#3D3730',
          400: '#2C2722',
          500: '#1F1B17',
          DEFAULT: '#191613',
          900: '#12100E',
        },
        tealAccent: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          DEFAULT: '#0F766E',
        },
        amberAccent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          DEFAULT: '#B45309',
        },
        dangerRed: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          DEFAULT: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'paper-sm': '0 1px 2px 0 rgba(25, 22, 19, 0.05)',
        'paper': '0 2px 8px -2px rgba(25, 22, 19, 0.08), 0 1px 4px -1px rgba(25, 22, 19, 0.04)',
        'paper-lg': '0 12px 24px -6px rgba(25, 22, 19, 0.12), 0 4px 12px -2px rgba(25, 22, 19, 0.06)',
      }
    },
  },
  plugins: [],
}
