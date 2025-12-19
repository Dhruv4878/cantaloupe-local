// tailwind.config.js
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        monument: ["Monument Extended", "sans-serif"],
        futura: ["Futura", "sans-serif"],
      },
      colors: {
        "brand-dark": "#070616",
        "brand-orange": "#FF6700",
        "brand-yellow": "#FDEC01",
        "brand-gray": "#B4B4B4",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #FDEC01, #FF6700)",
        "gradient-button": "linear-gradient(to right, #FCAC00, #FF6E00)",
      },
    },
  },
  plugins: [],
};
