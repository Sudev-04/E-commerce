import type { Config } from "tailwindcss";

// Northlane theme: near-black ink on warm white, a single bronze accent,
// square corners throughout. Red is kept for price reductions only.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F6F5F2",
          100: "#ECEAE5",
          200: "#DAD6CF",
          300: "#B5AFA6",
          400: "#857F76",
          500: "#57524B",
          600: "#1F1D1A",
          700: "#141311",
          800: "#0A0A09",
          900: "#000000",
        },
        accent: {
          50: "#FAF6F0",
          100: "#F2E9DB",
          200: "#E5D4BC",
          300: "#D2B893",
          400: "#BF9C6E",
          500: "#A47E4F",
          600: "#87643B",
          700: "#6C4F2F",
          800: "#553E26",
        },
        ink: "#1F1D1A",
        surface: "#FBFAF8",
        sale: "#A8321F",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
      },
      letterSpacing: {
        label: "0.16em",
      },
    },
  },
  plugins: [],
};
export default config;
