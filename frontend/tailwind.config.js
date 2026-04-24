/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      colors: {
        ink: "#172033",
        sand: "#f4efe7",
        clay: "#c56b4f",
        moss: "#4f6f52",
        ocean: "#2f6f8f",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 51, 0.10)",
      },
    },
  },
  plugins: [],
}
