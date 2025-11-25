/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#b71ea0",
        "background-light": "#f8f6f8",
        "background-dark": "#000000",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1A1A1A",
        "text-light": "#1A1A1A",
        "text-dark": "#FFFFFF",
        "subtle-light": "#6C757D",
        "subtle-dark": "#A0A0A0",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
    },
  },

  plugins: [],
};
