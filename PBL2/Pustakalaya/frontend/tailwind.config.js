/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      colors: {
      cream: '#FCF8F4',
      terracotta: '#A0522D',
      'active-bg': '#E8E4E0',
    },
    fontFamily: {
      serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
    },
  },
  },
  plugins: [],
}

