export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paypalBlue: "#0070BA",   // PayPal brand blue
        lightBlue: "#E6F1FB",    // soft background blue
        userGray: "#F4F4F4",     // user's message bubble
        botBlue: "#DCF0FF",      // bot's message bubble
        warning: "#FFCC00",      // optional (for alerts)
      },
    },
  },
  plugins: [],
};
