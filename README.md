# cairn-ui

The design parts that the Cairn site (cairn-substrate.com, its explorer) and the Cairn wallet share: the colour and
type tokens for light and dark, the Geist fonts, the theme switch, and the identity avatar. Components (buttons, tables, sheets) are not
here: each surface keeps its own component layer on top of these tokens, and a component moves here only when two
repositories actually share it.

## Files

| File | What it is |
|---|---|
| `tokens.css` | Every token as a `--ui-*` custom property: colours for both themes, type scale, spacing, radii, motion, z-index. Generated from `src/palette.mjs`. |
| `fonts.css`, `fonts/` | Geist and Geist Mono, variable weight 100 to 900, subset to Latin (35,204 and 36,520 bytes). |
| `theme-init.js` | Sets the theme on `<html>` before the first paint. |
| `theme.js`, `theme.css` | The switch: `window.CairnTheme`, the circle reveal, the crossfade under reduced motion, the toggle icon. |
| `theme.d.ts` | Types for TypeScript consumers. |
| `avatar.js`, `avatar.css`, `avatar.d.ts` | The identity avatar: a circle with a soft conic gradient computed from a seed (a name or an address), the same wherever it is drawn. An ES module. |

## Using it

Copy the files listed in `package.json` `files` into the consumer at a pinned commit of this repository, record the
commit and each file's sha256 next to the copy, and let the consumer's CI check the hashes. Then, in each page:

```html
<head>
  <script src="/ui/theme-init.js"></script>          <!-- first, blocking: no flash of the wrong theme -->
  <link rel="stylesheet" href="/ui/tokens.css">
  <link rel="stylesheet" href="/ui/fonts.css">
  <link rel="stylesheet" href="/ui/theme.css">
  <script src="/ui/theme.js" defer></script>
</head>
```

All of it runs under `script-src 'self'` with no inline script; nothing loads from another origin.

Cascade layers. `tokens.css` declares everything inside `@layer tokens`. Name your own layers after it, in this order:
`@layer tokens, base, components, page;`.

Themes. Light is the default. `theme-init.js` sets `data-theme="light"` or `"dark"` and `data-theme-choice`
(`light`, `dark` or `system`) on `<html>`. Without the script, a dark system setting still applies the dark tokens.
`data-theme="dark"` or `"light"` on any element makes an island of that theme.

The switch:

```js
const T = window.CairnTheme;
T.startSync();                                   // follow the system while the choice is "system", and other tabs
button.innerHTML = T.iconSvg("theme-icon-1");    // sun in light mode, eclipsed into a moon in dark mode
button.addEventListener("click", () => T.toggle(button));   // the new theme grows from the button
T.set("system");                                 // or "light" / "dark"; stored under the key T.KEY
T.onChange(({ mode }) => chart.applyOptions(themeFor(mode)));   // redraw canvases inside the switch
```

`set` returns a promise that resolves when the new theme is on screen. A call while a switch runs returns that switch.
Without View Transitions the theme swaps at once; under `prefers-reduced-motion` it crossfades in 180 ms.

The identity avatar, in a page or a bundle (`avatar.css` linked after `tokens.css`):

```js
import { avatarHtml, avatarBackground, identitySeed } from "/ui/avatar.js";
row.innerHTML = avatarHtml("alice") + "<b>alice</b>.csd";          // <span class="ui-avatar" style="background:...">
el.classList.add("ui-avatar");
el.style.background = avatarBackground(identitySeed(primaryName, address));   // an account: its primary name, else its address
```

Its size is `--ui-avatar-size` (32 px by default). It carries no letter: the name is always printed beside it.

## Guarantees and their tests

- Every text colour reaches 4.5:1 on every ground in both themes, also on the state tints; control boundaries and focus
  rings reach 3:1 (`test/palette.test.mjs`).
- `tokens.css` is exactly the generator's output, and the dark values are the same under the system setting and under
  `data-theme="dark"` (`test/tokens.test.mjs`).
- The theme is set before the first paint from storage or the system, and blocked storage falls back to the system
  (`test/theme-init.test.mjs`).
- The switch's fallbacks, its one-at-a-time rule, its timing (the motion tokens) and the sync (`test/theme.test.mjs`).
- The avatar is built from numbers only, whatever the seed; the same seed gives the same avatar; every stop stays in the
  design's hue arc (blue, violet, pink, peach: no green or yellow, which mean up and caution), lightness and chroma; and
  identities differ (`test/avatar.test.mjs`).
- The fonts are the bytes their record names (`test/fonts.test.mjs`), and CI rebuilds them from the official release
  and compares byte for byte (`.github/workflows/ci.yml`, `fonts-reproduce`).

## Development

```bash
npm ci
npm run build          # tokens.css from src/palette.mjs
npm test
npm run lint
npm run check:tokens   # fails when tokens.css is stale
npm run check:dashes-paths
```

The fonts are rebuilt only with `scripts/subset-fonts.sh <release zip> <python>`, where the Python has exactly the
fontTools and Brotli versions the script checks; the output is byte-identical between runs.

## Licence and credits

Code: MIT (`LICENSE`), InverseAltruism. Fonts: SIL Open Font License 1.1, Copyright 2024 The Geist Project Authors
(`fonts/OFL.txt`); the files here are a subset of the official release.

The theme switch is ported from InverseAltruism's Keshi brand package. Its reveal takes three details from Magic UI's
AnimatedThemeToggler (MIT, https://magicui.design/docs/components/animated-theme-toggler): the centre as percentages of
the viewport, the new view's start pinned in CSS before the animation runs, and one switch at a time.
