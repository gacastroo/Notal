/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  "#FFFCF7",
          100: "#FDF8F3",
          200: "#FFF8EF",
          300: "#FAEEDA",
        },
        warm: {
          100: "#E8DDD0",
          200: "#EF9F27",
          300: "#BA7517",
          400: "#854F0B",
          500: "#633806",
          600: "#412402",
        },
      },
    },
  },
  plugins: [],
}