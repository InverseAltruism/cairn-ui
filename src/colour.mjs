// Colour arithmetic for the generator and the contrast tests (WCAG 2.x relative luminance).

/** "#RRGGBB" to [r, g, b] in 0..255. */
export function rgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a #RRGGBB colour: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance of an [r, g, b] triple. */
export function luminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio of two [r, g, b] triples, 1 to 21. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `top` at `alpha` over the opaque `ground`, as the browser composites it. */
export function over(top, alpha, ground) {
  return top.map((v, i) => Math.round(v * alpha + ground[i] * (1 - alpha)));
}

/** "rgba(r, g, b, a)" for CSS. */
export function rgba(hex, alpha) {
  return `rgba(${rgb(hex).join(", ")}, ${alpha})`;
}
