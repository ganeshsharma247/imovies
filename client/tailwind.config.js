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
          darker: '#060913',
          dark: '#0A0F1D',
          card: '#10172A',
          cardHover: '#162038',
          border: '#1B2640',
          borderGlow: '#28385E',
          accent: '#8B5CF6',
          accentHover: '#7C3AED',
          cyan: '#06B6D4',
          cyanHover: '#0891B2',
          gold: '#F59E0B',
          silver: '#94A3B8',
          platinum: '#38BDF8',
        },
      },
      boxShadow: {
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.45)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.45)',
        'screen-glow': '0 15px 45px -5px rgba(6, 182, 212, 0.35)',
      },
    },
  },
  plugins: [],
}
