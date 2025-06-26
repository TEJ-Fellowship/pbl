// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#22c55e", // green-500
          DEFAULT: "#16a34a", // green-600
          dark: "#15803d", // green-700
        },
        secondary: {
          light: "#34d399", // emerald-400 (lighter teal-green)
          DEFAULT: "#059669", // emerald-600 (teal-green)
          dark: "#047857", // emerald-700
        },
        background: {
          light: "#e7f5ed", // light green
          DEFAULT: "#ffffff", // white
          middleDark: "#0F0F23", //slate-900
          humbleDark: "#1D2638", //slate-800
          politeDark: "#253143", //slate-700
          dark: "#1f2937", // gray-800
        },
        text: {
          spotlight: "#f3f4f6", //gray-100
          light: "#6b7280", // gray-500
          DEFAULT: "#374151", // gray-700
          dark: "#111827", // gray-900
        },
        status: {
          success: {
            bg: "#dcfce7", // green-100
            text: "#166534", // green-800
            border: "#bbf7d0", // green-200
            dark: {
              bg: "#166534", // green-800
              text: "#dcfce7", // green-100
              border: "#bbf7d0", // green-200
            },
          },
          warning: {
            bg: "#fef9c3", // yellow-100
            text: "#854d0e", // yellow-800
            border: "#fef08a", // yellow-200
            dark: {
              bg: "#854d0e", // yellow-800
              text: "#fef9c3", // yellow-100
              border: "#fef08a", // yellow-200
            },
          },
          error: {
            bg: "#fee2e2", // red-100
            text: "#991b1b", // red-800
            border: "#fecaca", // red-200
            dark: {
              bg: "#991b1b", // red-800
              text: "#fee2e2", // red-100
              border: "#fecaca", // red-200
            },
          },
        },
        border: {
          DEFAULT: "#f3f4f6", // gray-100
          dark: "#374151", // gray-700
          green: "#bbf7d0", // green-200
        },
      },
      boxShadow: {
        custom:
          "rgba(50, 50, 93, 0.25) 0px 8px 10px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px",
      },
    },
  },
  plugins: [],
};
