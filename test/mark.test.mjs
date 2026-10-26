import assert from "node:assert/strict";
import { test } from "node:test";
import { source } from "./helpers/page.mjs";

// The site draws the mark through <use href="mark.svg#mark"> in a 300 330 590 530 viewBox and animates the parts by
// id (the first-visit intro, the landing's stones); the wallet builds its sprite and icons from the same parts.
const svg = source("mark.svg");

test("the mark carries the ids and the viewBox its consumers address", () => {
  assert.match(svg, /<svg [^>]*viewBox="300 330 590 530"/);
  for (const id of ["mark", "mark-prompt", "mark-cursor", "mark-stone-0", "mark-stone-1", "mark-stone-2", "mark-stone-3"]) {
    assert.equal(svg.split(`id="${id}"`).length - 1, 1, `exactly one #${id}`);
  }
  const stones = [...svg.matchAll(/<polygon id="mark-stone-\d" points="([^"]+)"/g)];
  assert.equal(stones.length, 4, "four stones, each a polygon");
  for (const [, pts] of stones) assert.ok(pts.trim().split(/\s+/).every((p) => /^\d+,\d+$/.test(p)), "points are x,y pairs");
});

test("the mark sets no paint, so it takes the colour of the element that uses it in either theme", () => {
  const body = svg.replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(body, /\b(fill|stroke|style|class)=/);
  assert.doesNotMatch(body, /<style/);
});
