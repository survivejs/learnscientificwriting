import presetAutoprefix from "https://esm.sh/@twind/preset-autoprefix@1.0.5";
import presetTailwind from "https://esm.sh/@twind/preset-tailwind@1.1.1";
import presetTypography from "https://esm.sh/@twind/preset-typography@1.0.5";
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
