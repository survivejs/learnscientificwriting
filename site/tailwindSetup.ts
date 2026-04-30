import typography from "@tailwindcss/typography";
import meta from "./meta.json" with { type: "json" };

export default {
  content: ["./site/**/*.{html,ts}", "./book/**/*.{md,tex}"],
  theme: {
    extend: {
      colors: meta.colors,
      fontFamily: {
        monospace: "monospace",
      },
    },
  },
  plugins: [typography],
};
