/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cosmos-dark": "#0A0A0F",
        "cosmos-secondary": "#14141E",
        "cosmos-border": "#2A2A3A",
      },
    },
  },
  plugins: [],
};
