# cairn-ui

> Briefing for coding agents and contributors. `CLAUDE.md` is a symlink to this file. `README.md` is for consumers.

The shared design parts of the Cairn site and the Cairn wallet: tokens for light and dark, the Geist fonts, the theme
switch, the identity avatar, the logos. Public, MIT for the code and SIL OFL 1.1 for the fonts; the logos are under
neither (README, "Licence and credits"). Consumers copy a pinned commit and
check each file's sha256; nothing is published to npm (`"private": true`).

## Rules

- One source of values: every token lives in `src/palette.mjs`. `tokens.css` is generated (`npm run build`) and
  committed; never edit it by hand. Every token is `--ui-*`, so it cannot collide with a consumer's own properties.
- A colour change keeps `test/palette.test.mjs` green: text at 4.5:1 on every ground in both themes, also on the state
  tints; control boundaries and focus rings at 3:1. Do not weaken that test to pass a colour.
- Only what two or more repositories share belongs here. A component used by one surface stays in that surface.
- `avatar.js` is an ES module with no imports (the site imports it, the wallet bundles it); its output is numbers only.
- `theme-init.js` and `theme.js` are classic scripts with no imports: they run as they are in the site's pages
  (`script-src 'self'`) and in the extension. `theme.js` loads once (`window.CairnTheme` guard).
- The switch's timing is the motion tokens': `REVEAL_MS` and `EASE` in `theme.js` equal `--ui-dur-4` and `--ui-ease`,
  pinned by `test/theme.test.mjs`.
- `theme.css` scopes its root-snapshot rules to the switch's classes, so a page's own view transitions keep their
  animation (`test/files.test.mjs`).
- Fonts change only through `scripts/subset-fonts.sh`, from the release and tool versions it checks; CI's
  `fonts-reproduce` job rebuilds them and compares bytes. Never commit a font file from anywhere else.
- Dependencies: one dev dependency (Biome), exact-pinned, frozen install from the committed lockfile. New versions wait
  14 days after publication.
- Docs and comments: no em dashes (`npm run check:dashes-paths`), plain prose, comments state constraints only.

## Commands

```bash
npm ci
npm run build && npm run check:tokens
npm test
npm run lint
npm run check:dashes-paths
```

## Layout

| Path | Holds |
|---|---|
| `src/palette.mjs` | every value: colours per mode, contrast classes, tints, per-mode extras, the scale |
| `src/colour.mjs` | WCAG luminance, contrast, compositing |
| `src/tokens-css.mjs`, `scripts/build.mjs` | the generator and its writer/checker |
| `tokens.css`, `fonts.css`, `theme.css`, `theme-init.js`, `theme.js`, `theme.d.ts`, `fonts/` | what consumers copy (`package.json` `files`) |
| `avatar.js`, `avatar.css`, `avatar.d.ts` | the identity avatar (an ES module; the only colours outside the palette, in the design's hue arc, `test/avatar.test.mjs`) |
| `mark.svg`, `csd-logo.jpg` | the logos: the Cairn mark (its elements, attributes, part ids and box are the contract, `test/mark.test.mjs`; it sets no paint) and the CSD coin's logo (the owner's file as given) |
| `scripts/subset-fonts.sh` | the reproducible font subset |
| `test/` | `node --test`; `test/helpers/page.mjs` runs the real scripts in `node:vm` against stand-in browser globals |

## Consumers

- cairn (private): `public/ui/`, served to the site and, through the front door, to the explorer.
- cairn-wallet (public): copied into `dist/` by its build.

A change here reaches a consumer only when that consumer re-vendors a new commit in its own reviewed PR.
