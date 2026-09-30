/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f4f7ff',
          100: '#e8edff',
          200: '#ccd8ff',
          300: '#a4b8ff',
          400: '#7d90ff',
          500: '#5f6bff',
          600: '#4749f5',
          700: '#3a37e2',
          800: '#302db8',
          900: '#2b2c92',
        },
        surface: {
          0: 'hsl(var(--bg-0) / <alpha-value>)',
          1: 'hsl(var(--bg-1) / <alpha-value>)',
          2: 'hsl(var(--bg-2) / <alpha-value>)',
        },
        ink: {
          primary: 'hsl(var(--ink-1) / <alpha-value>)',
          secondary: 'hsl(var(--ink-2) / <alpha-value>)',
          tertiary: 'hsl(var(--ink-3) / <alpha-value>)',
        },
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(16 24 40 / 0.04), 0 12px 32px -12px rgb(71 73 245 / 0.18)',
        lift: '0 2px 4px rgb(16 24 40 / 0.04), 0 24px 56px -20px rgb(71 73 245 / 0.28)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        pop: { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'none' } },
        drift: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        sweep: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        rise: 'rise .5s cubic-bezier(.16,1,.3,1) both',
        pop: 'pop .42s cubic-bezier(.16,1,.3,1) both',
        drift: 'drift 6s ease-in-out infinite',
        sweep: 'sweep 1.6s linear infinite',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.16,1,.3,1)' },
    },
  },
  plugins: [],
}
