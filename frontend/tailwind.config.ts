import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

// "Deep Indigo" palette: indigo for every main action, amber as a highlight
// accent, deep indigo-navy for the footer/text, red reserved for discounts.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.indigo, // primary-600 = #4F46E5
        accent: colors.amber, // accent-500 = #F59E0B
        ink: "#1E1B4B",
        surface: "#F8FAFC",
        sale: "#DC2626",
      },
    },
  },
  plugins: [],
};
export default config;
