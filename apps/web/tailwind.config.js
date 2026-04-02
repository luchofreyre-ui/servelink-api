/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.7rem", "1rem"],
        sm: ["0.8rem", "1.2rem"],
        base: ["0.9rem", "1.4rem"],
        lg: ["1rem", "1.5rem"],
        xl: ["1.15rem", "1.6rem"],
        "2xl": ["1.35rem", "1.75rem"],
        "3xl": ["1.6rem", "1.9rem"],
        "4xl": ["1.9rem", "2.2rem"],
        "5xl": ["2.2rem", "2.5rem"],
      },
    },
  },
  plugins: [],
};
