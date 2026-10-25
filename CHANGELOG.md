# Changelog

## 0.3.0 (2026-10-25)

- The identity avatar (`avatar.js`, `avatar.css`, `avatar.d.ts`), the approved design's `.avatar`: a 32 px circle with a
  conic gradient from blue through violet and pink to peach, light and soft, edged by a hairline of the ink (8% black on
  light grounds, 8% white on dark ones). Each seed turns the gradient and picks its stretch of that hue arc; lightness
  and chroma stay in the design's band, and no stop is green or yellow. It replaces the site's and the wallet's two
  copies of the old dark linear gradient, which fell on olive greens for many names. It draws no letter. No existing
  file changes.

## 0.2.0 (2026-10-25)

- Five type steps between the scale's steps, named by their role in the approved design: `--ui-text-caption` (12px:
  subtitles, meta, action labels), `--ui-text-subhead` (15px: column and panel headings), `--ui-text-stat` (20px: stat
  values, detail titles), `--ui-text-title` (32px: page titles) and `--ui-text-figure` (40px: the one large figure of a
  view, such as a balance or a price). The consumers measured their pages against the design and found these sizes
  rounded to the nearest step; no existing token changes.

## 0.1.0 (2026-10-24)

First version.

- Tokens for the Stone palette in light and dark, the type scale, spacing, radii, motion and z-index, generated from
  `src/palette.mjs` into `tokens.css` as `--ui-*` properties.
- Geist and Geist Mono from the official v1.7.2 release, subset to Latin with every OpenType feature kept; a script
  rebuilds them byte for byte and CI checks it.
- `theme-init.js` (the theme before the first paint) and `theme.js` with `theme.css` (`window.CairnTheme`: the circle
  reveal from the pressed control, a crossfade under reduced motion, sync with the system and other tabs).
