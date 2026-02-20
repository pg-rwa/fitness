/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#E8614D", light: "#FF8A78", dark: "#C04535" },
        accent: { DEFAULT: "#F59E0B", light: "#FCD34D" },
        dark: { DEFAULT: "#1E1E2E", card: "#2A2A3E", muted: "#6B7280" },
      },
    },
  },
  plugins: [],
};
