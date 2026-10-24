/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sportiq: {
          bg: '#0B1220',
          card: '#111C2E',
          cardHover: '#16243B',
          surface: '#0E1726',
          border: '#1E293B',
          borderLight: '#334155',
          primary: '#2563EB',
          primaryHover: '#1D4ED8',
          ai: '#06B6D4',
          aiHover: '#0891B2',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0b1220',
        },
        ai: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
