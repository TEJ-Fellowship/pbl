export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // important!
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        background: 'var(--background-color)',
        accent: 'var(--accent-color)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
      },
    },
  },
  plugins: [],
}
