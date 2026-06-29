/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        surface: {
          950: '#0a0e17',
          900: '#0f1520',
          800: '#151c2c',
          700: '#1c2538',
          600: '#243047',
        },
      },
    },
  },
  plugins: [],
}
