/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        shopify: {
          green: "#96bf47",
          "green-light": "#7ba05b",
          "green-dark": "#5a8a3a",
          "green-darker": "#4a7c59",
          "green-darkest": "#3d6b47",
          dark: "#1A1A1A",
          gray: "#F6F6F7",
          "gray-light": "#f8fafc",
          "gray-medium": "#f1f5f9",
          "gray-dark": "#e2e8f0",
        },
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        accent: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
      },
      boxShadow: {
        shopify: "0 4px 20px rgba(150, 191, 71, 0.15)",
        "shopify-lg": "0 8px 32px rgba(150, 191, 71, 0.2)",
        "shopify-xl": "0 20px 60px rgba(150, 191, 71, 0.25)",
      },
      animation: {
        "slide-in": "messageSlideIn 0.3s ease-out",
        "pulse-soft": "pulse 2s infinite",
        "bounce-soft": "bounce 1s infinite",
      },
    },
  },
  plugins: [],
};
