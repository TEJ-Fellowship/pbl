/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        kaushan: ['"Kaushan Script"', 'cursive'],
        merriweather: ["Merriweather", 'serif']
      },
    },
  },
  plugins: [],
}

