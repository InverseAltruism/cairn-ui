# Changelog

## 0.1.0 (2026-10-24)

First version.

- Tokens for the Stone palette in light and dark, the type scale, spacing, radii, motion and z-index, generated from
  `src/palette.mjs` into `tokens.css` as `--ui-*` properties.
- Geist and Geist Mono from the official v1.7.2 release, subset to Latin with every OpenType feature kept; a script
  rebuilds them byte for byte and CI checks it.
- `theme-init.js` (the theme before the first paint) and `theme.js` with `theme.css` (`window.CairnTheme`: the circle
  reveal from the pressed control, a crossfade under reduced motion, sync with the system and other tabs).
