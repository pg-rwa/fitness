/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#E8614D", light: "#FF8A78", dark: "#C04535" },
        sidebar: "#1E1E2E",
        card: "#2A2A3E",
      },
    },
  },
  plugins: [],
};
