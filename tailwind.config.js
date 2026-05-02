/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        green: {
          950: '#0a2318',
          900: '#0f3626',
          800: '#1a5c3a',
          700: '#2e7d52',
          600: '#3d9966',
          100: '#d4ede0',
          50:  '#f0f9f4',
        },
        gold: {
          500: '#c4a24d',
          400: '#d4b560',
          100: '#f5edd0',
        },
        cream: {
          100: '#f9f6ef',
          200: '#f1ece0',
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body:    ['var(--font-dm-sans)', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
