/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // enable dark mode via a class on <html> or <body>
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#6366f1", // indigo-500
          DEFAULT: "#4f46e5", // indigo-600
          dark: "#4338ca", // indigo-700
        },
        accent: {
          light: "#a78bfa", // purple-400
          DEFAULT: "#8b5cf6", // purple-500
          dark: "#7c3aed", // purple-600
        },
        neutral: {
          light: "#f3f4f6", // gray-100
          DEFAULT: "#9ca3af", // gray-400
          dark: "#1f2937", // gray-800
        },
      },
    },
  },
  plugins: [],
};
