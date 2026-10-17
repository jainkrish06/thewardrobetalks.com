/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: '#e5e7eb',
        input: '#f3f4f6',
        background: '#ffffff',
        foreground: '#111827',
      }
    },
  },
  plugins: [],
}
