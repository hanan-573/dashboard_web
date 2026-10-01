/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./app.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec2ff',
          400: '#5aa2ff',
          500: '#2f81f7',
          600: '#1a63d6',
          700: '#1650ad',
          800: '#16448c',
          900: '#173c74'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
