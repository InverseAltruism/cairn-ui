import assert from "node:assert/strict";
import { test } from "node:test";
import { COLOURS, PREFIX, SCALE } from "../src/palette.mjs";
import { tokensCss } from "../src/tokens-css.mjs";
import { source } from "./helpers/page.mjs";

const css = source("tokens.css");

test("tokens.css is what scripts/build.mjs generates from src/palette.mjs", () => {
  assert.equal(css, tokensCss(), "tokens.css is stale: run node scripts/build.mjs");
});

/** The declarations of the block whose selector line matches `re` (anchored at a line start), as name -> value. */
function block(re) {
  const m = re.exec(css);
  assert.ok(m, `missing block ${re}`);
  const open = css.indexOf("{", m.index + m[0].length - 1);
  const body = css.slice(open + 1, css.indexOf("}", open));
  return new Map(
    body
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => [d.slice(0, d.indexOf(":")).trim(), d.slice(d.indexOf(":") + 1).trim()]),
  );
}

const LIGHT = /^:root,\n\[data-theme="light"\] \{$/m;
const SYSTEM_DARK = /^@media \(prefers-color-scheme: dark\) \{\n {2}:root:not\(\[data-theme="light"\]\) \{$/m;
const FORCED_DARK = /^\[data-theme="dark"\] \{$/m;

test("the selectors make light the default, honour an explicit light choice and allow islands of either theme", () => {
  assert.match(css, /^@layer tokens \{$/m, "the tokens sit in the tokens layer");
  assert.match(css, LIGHT, "light applies to :root and to any light island");
  assert.match(css, SYSTEM_DARK, "the system's dark never overrides an explicit light choice");
  assert.match(css, FORCED_DARK, "dark applies to any element, not only :root");
});

test("the system-dark block and the data-theme dark block declare the same values", () => {
  const media = block(SYSTEM_DARK);
  const forced = block(FORCED_DARK);
  assert.deepEqual([...media.entries()], [...forced.entries()]);
  assert.equal(media.get("color-scheme"), "dark");
  assert.equal(media.get(`${PREFIX}bg`), COLOURS.dark.bg);
});

test("light is the default and every colour role is declared in it", () => {
  const light = block(LIGHT);
  assert.equal(light.get("color-scheme"), "light");
  for (const [role, hex] of Object.entries(COLOURS.light)) assert.equal(light.get(`${PREFIX}${role}`), hex, role);
});

test("every scale token is declared once on :root, prefixed", () => {
  const scale = block(/^:root \{$/m);
  for (const [name, value] of Object.entries(SCALE)) assert.equal(scale.get(`${PREFIX}${name}`), value, name);
  for (const name of Object.keys(SCALE)) {
    const n = css.split(`${PREFIX}${name}:`).length - 1;
    assert.equal(n, 1, `${name} declared ${n} times`);
  }
});
