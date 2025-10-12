/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        shopify: {
          green: "#95BF47",
          dark: "#1A1A1A",
          gray: "#F6F6F7",
        },
      },
    },
  },
  plugins: [],
};
