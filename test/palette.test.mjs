import assert from "node:assert/strict";
import { test } from "node:test";
import { contrast, over, rgb } from "../src/colour.mjs";
import { COLOURS, DECOR, GROUNDS, NON_TEXT, TEXT, TINT_ALPHA, TINTS } from "../src/palette.mjs";

const MODES = ["light", "dark"];

test("both modes define the same roles", () => {
  assert.deepEqual(Object.keys(COLOURS.light).sort(), Object.keys(COLOURS.dark).sort());
  const classified = new Set([...GROUNDS, ...TEXT, ...NON_TEXT, ...DECOR, "on-ink"]);
  for (const role of Object.keys(COLOURS.light)) assert.ok(classified.has(role), `${role} has no contrast class`);
});

test("every text role reaches 4.5:1 on every ground, in both modes", () => {
  for (const mode of MODES) {
    const c = COLOURS[mode];
    for (const fg of TEXT) {
      for (const bg of GROUNDS) {
        const r = contrast(rgb(c[fg]), rgb(c[bg]));
        assert.ok(r >= 4.5, `${mode} ${fg} on ${bg}: ${r.toFixed(2)}:1`);
      }
    }
  }
});

test("text on ink (a primary button) reaches 4.5:1", () => {
  for (const mode of MODES) {
    const r = contrast(rgb(COLOURS[mode]["on-ink"]), rgb(COLOURS[mode].ink));
    assert.ok(r >= 4.5, `${mode} on-ink on ink: ${r.toFixed(2)}:1`);
  }
});

test("control boundaries and focus rings reach 3:1 on bg and surface", () => {
  for (const mode of MODES) {
    const c = COLOURS[mode];
    for (const fg of NON_TEXT) {
      for (const bg of ["bg", "surface"]) {
        const r = contrast(rgb(c[fg]), rgb(c[bg]));
        assert.ok(r >= 3, `${mode} ${fg} on ${bg}: ${r.toFixed(2)}:1`);
      }
    }
  }
});

test("state text keeps 4.5:1 on its own tint over every ground", () => {
  for (const mode of MODES) {
    const c = COLOURS[mode];
    for (const role of TINTS) {
      for (const ground of GROUNDS) {
        const behind = over(rgb(c[role]), TINT_ALPHA, rgb(c[ground]));
        for (const fg of [role, "ink", "ink-2"]) {
          const r = contrast(rgb(c[fg]), behind);
          assert.ok(r >= 4.5, `${mode} ${fg} on ${role}-tint over ${ground}: ${r.toFixed(2)}:1`);
        }
      }
    }
  }
});

test("the contrast arithmetic matches known WCAG values", () => {
  assert.equal(contrast(rgb("#000000"), rgb("#FFFFFF")).toFixed(2), "21.00");
  assert.equal(contrast(rgb("#777777"), rgb("#FFFFFF")).toFixed(2), "4.48");
  assert.throws(() => rgb("#fff"), /not a #RRGGBB colour/);
});
