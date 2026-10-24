import assert from "node:assert/strict";
import { test } from "node:test";
import { COLOURS, PREFIX, SCALE } from "../src/palette.mjs";
import { tokensCss } from "../src/tokens-css.mjs";
import { source } from "./helpers/page.mjs";

const css = source("tokens.css");

test("tokens.css is what scripts/build.mjs generates from src/palette.mjs", () => {
  assert.equal(css, tokensCss(), "tokens.css is stale: run node scripts/build.mjs");
});

/** The declarations inside the block that starts at `head`, as name -> value. */
function block(head) {
  const at = css.indexOf(head);
  assert.ok(at >= 0, `missing block ${head}`);
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
  return new Map(
    body
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => [d.slice(0, d.indexOf(":")).trim(), d.slice(d.indexOf(":") + 1).trim()]),
  );
}

test("the system-dark block and the data-theme dark block declare the same values", () => {
  const media = block(':root:not([data-theme="light"])');
  const forced = block('[data-theme="dark"] {');
  assert.deepEqual([...media.entries()], [...forced.entries()]);
  assert.equal(media.get("color-scheme"), "dark");
  assert.equal(media.get(`${PREFIX}bg`), COLOURS.dark.bg);
});

test("light is the default and every colour role is declared in it", () => {
  const light = block(':root,\n[data-theme="light"]');
  assert.equal(light.get("color-scheme"), "light");
  for (const [role, hex] of Object.entries(COLOURS.light)) assert.equal(light.get(`${PREFIX}${role}`), hex, role);
});

test("every scale token is declared once on :root, prefixed", () => {
  const scale = block(":root {");
  for (const [name, value] of Object.entries(SCALE)) assert.equal(scale.get(`${PREFIX}${name}`), value, name);
  for (const name of Object.keys(SCALE)) {
    const n = css.split(`${PREFIX}${name}:`).length - 1;
    assert.equal(n, 1, `${name} declared ${n} times`);
  }
});
