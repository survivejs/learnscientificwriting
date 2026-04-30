import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import presetTypography from "@twind/preset-typography";
import meta from "./meta.json" with { type: "json" };

export default {
  presets: [presetAutoprefix(), presetTailwind(), presetTypography()],
  theme: {
    extend: {
      colors: meta.colors,
      fontFamily: {
        // TODO: Update this
        // "primary": 'system-ui, "Eau"',
        "monospace": "monospace",
      },
    },
  },
  hash: false,
};
