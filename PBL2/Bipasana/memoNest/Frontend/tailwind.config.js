/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        'color-glow': '0 10px 15px rgba(93, 63, 211, 0.4)',
      }
    },
  },
  plugins: [],
}

