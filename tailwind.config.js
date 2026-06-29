/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B00',
          darkBg: '#0B0C0E',
          darkSurface: '#121318',
          darkCard: 'rgba(25, 27, 34, 0.7)',
          gold: '#FFC700',
          silver: '#A0AEC0',
          bronze: '#ED8936',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        orangeGlow: '0 0 15px rgba(255, 107, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
