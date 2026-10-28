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
        cinema: {
          dark: '#0B0F19',
          card: '#121826',
          border: '#1F293D',
          accent: '#E50914',
          accentHover: '#B80710',
          gold: '#F59E0B',
          silver: '#94A3B8',
          platinum: '#38BDF8',
        },
      },
    },
  },
  plugins: [],
}
