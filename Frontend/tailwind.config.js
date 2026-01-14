/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "neo-white": "#fdfdfd",
        "neo-black": "#000000",
      },
      boxShadow: {
        neo: "4px 4px 0px 0px rgba(0,0,0,1)",
      },
    },
  },
  plugins: [],
};
