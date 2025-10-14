export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'mailchimp': {
          'yellow': '#FFE01B',
          'yellow-dark': '#F4D03F',
          'yellow-light': '#FFF59D',
          'navy': '#243C5A',
          'gray': '#6C757D',
          'dark-gray': '#343A40',
          'blue': '#007C89',
          'green': '#00A86B',
          'red': '#E53E3E',
          'orange': '#FF8C00'
        }
      },
      fontFamily: {
        'mailchimp': ['Proxima Nova', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      }
    },
  },
  plugins: [],
};
