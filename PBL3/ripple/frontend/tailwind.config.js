export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // important!
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
          from: { transform: "scale(0.5,0.5)", opacity: "0.5" },
          to: { transform: "scale(2.5,2.5)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
