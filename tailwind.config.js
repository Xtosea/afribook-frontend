/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // <-- include all React components
    "./public/index.html"         // <-- include index.html just in case
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}