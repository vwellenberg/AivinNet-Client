import Vibrant from "node-vibrant";
import listToRgbString from "./listToRgbString";

interface SwatchLite {
  rgb: number[];
  hsl: number[]; // [h, s, l] each 0..1
  pop: number;
}

const SWATCH_NAMES = [
  "Vibrant",
  "DarkVibrant",
  "LightVibrant",
  "Muted",
  "DarkMuted",
  "LightMuted",
];

function collectSwatches(palette: any): SwatchLite[] {
  const out: SwatchLite[] = [];
  for (const name of SWATCH_NAMES) {
    const sw = palette[name];
    if (sw) {
      out.push({ rgb: sw.getRgb(), hsl: sw.getHsl(), pop: sw.getPopulation() });
    }
  }
  return out;
}

/**
 * How "colourful" a swatch is. Saturation dominates so we never pick a grey,
 * with a mild boost for swatches that actually cover a lot of the image.
 */
function vividness(s: SwatchLite): number {
  const sat = s.hsl[1];
  const popWeight = 0.6 + 0.4 * Math.min(1, s.pop / 8000);
  return sat * popWeight;
}

/**
 * Assigns `colors.bg`, `colors.bg2` and `colors.btn` on the store.
 *
 * Background used to be node-vibrant's `DarkMuted` swatch — which is by
 * definition dark AND desaturated, i.e. grey. We now pick the most vivid
 * swatch as the primary and a second, hue-distinct swatch so the page
 * gradient can run between two real colours instead of fading one grey.
 *
 * @param store - The store object to assign the color values to.
 * @param img_url - The URL of the image to extract colors from.
 * @param btn_only - If true, only assign the `colors.btn` property.
 */
export default (store: any, img_url: string, btn_only: boolean = false) => {
  const vibrant = new Vibrant(img_url);

  vibrant.getPalette().then((palette) => {
    const swatches = collectSwatches(palette);

    // Button: a bright, punchy colour.
    store.colors.btn =
      listToRgbString(
        palette.LightVibrant?.getRgb() ||
          palette.Vibrant?.getRgb() ||
          palette.DarkVibrant?.getRgb()
      ) || "";

    if (btn_only) return;

    if (!swatches.length) {
      store.colors.bg = "";
      store.colors.bg2 = "";
      return;
    }

    const byVividness = [...swatches].sort((a, b) => vividness(b) - vividness(a));
    const primary = byVividness[0];

    // Secondary: most vivid swatch whose hue differs enough from the primary
    // (so the gradient shows two colours, not two shades of one). Fall back to
    // the next vivid swatch, then to the primary itself.
    const hueDelta = (a: number, b: number) => {
      const d = Math.abs(a - b);
      return Math.min(d, 1 - d); // hue wraps at 1.0
    };
    const secondary =
      byVividness.find(
        (s) => s !== primary && hueDelta(s.hsl[0], primary.hsl[0]) > 0.06
      ) ||
      byVividness[1] ||
      primary;

    store.colors.bg = listToRgbString(primary.rgb) || "";
    store.colors.bg2 = listToRgbString(secondary.rgb) || store.colors.bg;
  });
};
