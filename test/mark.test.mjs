import assert from "node:assert/strict";
import { test } from "node:test";
import { source } from "./helpers/page.mjs";

// The site draws the mark through <use href="mark.svg#mark"> in a 300 330 590 530 viewBox with fill: currentColor on
// its own <svg>, builds the first-visit intro from every element whose id starts with "mark-", and reads the stones'
// points for the landing's canvas; the wallet builds its sprite and its icons from the same parts. So the file holds
// exactly these elements and attributes, nothing that paints, and nothing outside the box.
const svg = source("mark.svg").replace(/<!--[\s\S]*?-->/g, "");
const ELEMENTS = new Set(["svg", "g", "path", "rect", "polygon"]);
const ATTRIBUTES = new Set(["xmlns", "viewBox", "id", "d", "x", "y", "width", "height", "points"]);
const IDS = ["mark", "mark-prompt", "mark-cursor", "mark-stone-0", "mark-stone-1", "mark-stone-2", "mark-stone-3"];
const tags = [...svg.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+\s*=\s*"[^"]*")*)\s*\/?>/g)].map(([, name, attrs]) => ({
  name,
  attrs: Object.fromEntries([...attrs.matchAll(/([^\s=]+)\s*=\s*"([^"]*)"/g)].map(([, k, v]) => [k, v])),
}));

test("the mark holds only its drawing elements and their geometry attributes (no paint, no transform, no style)", () => {
  assert.ok(tags.length >= 8, `read ${tags.length} elements`);
  assert.equal([...svg.matchAll(/<[a-zA-Z]/g)].length, tags.length, "every element is read");
  for (const t of tags) {
    assert.ok(ELEMENTS.has(t.name), `element <${t.name}>`);
    for (const k of Object.keys(t.attrs)) assert.ok(ATTRIBUTES.has(k), `attribute ${k} on <${t.name}>`);
  }
  assert.equal(tags[0].attrs.viewBox, "300 330 590 530");
});

test("the mark carries exactly the seven ids its consumers address, the stones as polygons", () => {
  const ids = tags.map((t) => t.attrs.id).filter(Boolean);
  assert.deepEqual([...ids].sort(), [...IDS].sort());
  assert.equal(tags.find((t) => t.attrs.id === "mark")?.name, "g");
  for (let i = 0; i < 4; i++) assert.equal(tags.find((t) => t.attrs.id === `mark-stone-${i}`)?.name, "polygon", `mark-stone-${i}`);
});

test("every coordinate lies inside the 300 330 590 530 box", () => {
  const inside = (x, y) => x >= 300 && x <= 890 && y >= 330 && y <= 860;
  const nums = (s) => (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  for (const t of tags) {
    const pts = t.attrs.points ? nums(t.attrs.points) : t.attrs.d ? nums(t.attrs.d) : [];
    for (let i = 0; i + 1 < pts.length; i += 2) assert.ok(inside(pts[i], pts[i + 1]), `${t.attrs.id}: ${pts[i]},${pts[i + 1]}`);
    if (t.name === "rect") {
      const [x, y, w, h] = ["x", "y", "width", "height"].map((k) => Number(t.attrs[k]));
      assert.ok(inside(x, y) && inside(x + w, y + h), `${t.attrs.id}: the rect`);
    }
  }
});
