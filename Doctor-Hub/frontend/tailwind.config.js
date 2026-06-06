/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 10px 40px -10px rgb(15 118 110 / 0.15)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 50%, #ECFEFF 100%)',
        'auth-gradient': 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #14B8A6 100%)',
      },
    },
  },
  plugins: [],
}
