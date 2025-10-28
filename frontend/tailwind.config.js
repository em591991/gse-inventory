/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0E6A37",
          50: "#E6F4ED",
          100: "#CCE9DB",
          200: "#99D3B7",
          300: "#66BD93",
          400: "#33A76F",
          500: "#0E6A37",
          600: "#0B552C",
          700: "#084021",
          800: "#062B16",
          900: "#03160B",
        },
        secondary: {
          DEFAULT: "#A8A9AD",
          50: "#F5F5F6",
          100: "#EBEBEC",
          200: "#D7D8D9",
          300: "#C3C4C6",
          400: "#AFB0B3",
          500: "#A8A9AD",
          600: "#86878A",
          700: "#656567",
          800: "#434445",
          900: "#222222",
        },
        // GSE Design System colors
        gseblue: "#0E6A37",      // Primary green (matching primary.DEFAULT)
        gselightblue: "#33A76F",  // Lighter green (matching primary.400)
        gsegray: "#F5F5F6",       // Light gray background
        gsedark: "#222222",       // Dark text color
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
