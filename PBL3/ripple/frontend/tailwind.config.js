export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // enables dark mode via "class"
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color)",
        secondary: "var(--secondary-color)",
        background: "var(--background-color)",
        accent: "var(--accent-color)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
      },
      keyframes: {
        rippleEffect: {
          "0%": { transform: "scale(0.5)", opacity: "0.5" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
      },
      animation: {
        ripple: "rippleEffect 1.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
