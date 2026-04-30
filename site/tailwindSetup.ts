import typography from "@tailwindcss/typography";
import meta from "./meta.json" with { type: "json" };

export default {
  content: ["./site/**/*.{html,ts}", "./book/**/*.{md,tex}"],
  theme: {
    extend: {
      colors: meta.colors,
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Avenir Next", "Segoe UI", "Helvetica Neue", "sans-serif"],
        monospace: "monospace",
      },
    },
  },
  plugins: [typography],
};
