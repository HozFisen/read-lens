/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pastel-pink': '#FFB3D9',
        'pastel-blue': '#B3E5FF',
        'pastel-yellow': '#FFF4B3',
        'pastel-green': '#B3FFD9',
        'pastel-purple': '#E5B3FF',
        'pastel-orange': '#FFD9B3',
      }
    },
  },
  plugins: [],
}