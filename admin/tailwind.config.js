/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fintrack': {
          'green': '#0F9D68',
          'dark-green': '#087A50',
          'light-green': '#E8F7F0',
          'navy': '#171717',
          'background': '#F5F6F7',
          'border': '#E5E7EB',
          'income': '#16A34A',
          'expense': '#DC2626',
          'warning': '#F59E0B',
          'secondary': '#6B7280',
        }
      }
    },
  },
  plugins: [],
}