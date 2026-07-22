import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ShiftFlow huisstijl: donkerblauw, lichtblauw, wit
        navy: {
          DEFAULT: '#0A2540',
          900: '#061A2E',
          800: '#0A2540',
          700: '#123456',
          600: '#1B4B7A',
        },
        sky: {
          DEFAULT: '#38BDF8',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
