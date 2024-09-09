/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors : {
        darkgreen: "#314D1B",
        lightgreen: "#FCFFF7",
      }
    },
  },
  plugins: [],
}