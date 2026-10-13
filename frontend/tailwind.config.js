/** @type {import('tailwindcss').Config} */
// Brand colour is a single swappable ramp. Replace these hex values once the
// university's official colours are confirmed; nothing else needs to change.
export default {
  content: ["./index.html", "./src/**/*.ts"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80",
          500: "#22c55e", 600: "#16a34a", 700: "#166534", 800: "#14532d", 900: "#052e16",
        },
        gold: { 500: "#b45309" },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
