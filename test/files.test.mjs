import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT, source } from "./helpers/page.mjs";

const pkg = JSON.parse(source("package.json"));

test("every file a consumer vendors exists", () => {
  for (const f of pkg.files) assert.ok(existsSync(join(ROOT, f)), f);
});

test("theme.css styles the classes theme.js sets and the icon it draws", () => {
  const js = source("theme.js");
  const css = source("theme.css");
  for (const cls of ["ui-theme-switching", "ui-theme-reveal", "ui-theme-fade"]) {
    assert.ok(js.includes(`"${cls}"`), `theme.js sets ${cls}`);
    assert.ok(css.includes(`.${cls}`), `theme.css styles ${cls}`);
  }
  for (const cls of ["ui-theme-icon", "ui-theme-icon-sun", "ui-theme-icon-rays", "ui-theme-icon-bite"]) {
    assert.ok(js.includes(cls) && css.includes(`.${cls}`), cls);
  }
  for (const v of ["--ui-reveal-x", "--ui-reveal-y"]) assert.ok(js.includes(v) && css.includes(v), v);
});

test("the theme switch never removes the default animation of other view transitions", () => {
  const css = source("theme.css");
  const bare = /(^|[\s,}])::view-transition-(old|new)\(root\)/m;
  assert.equal(bare.test(css), false, "root snapshot rules must be scoped to .ui-theme-reveal or .ui-theme-fade");
});

test("the toggle icon follows the root's mode, as the toggle does, also inside an island", () => {
  const css = source("theme.css");
  const dark = [...css.matchAll(/^(.*)\.ui-theme-icon-(sun|bite|rays) \{$/gm)].map((m) => m[1]).filter((s) => s.includes("data-theme"));
  assert.equal(dark.length, 3);
  for (const sel of dark) assert.equal(sel, ':root[data-theme="dark"] ');
});

test("the shipped files stay small", () => {
  const limits = { "tokens.css": 8_000, "theme.js": 10_000, "theme-init.js": 2_000, "theme.css": 4_000, "fonts.css": 2_000, "avatar.js": 6_000, "avatar.css": 1_000, "mark.svg": 2_000, "csd-logo.jpg": 8_000 };
  for (const [f, max] of Object.entries(limits)) {
    const n = statSync(join(ROOT, f)).size;
    assert.ok(n <= max, `${f} is ${n} bytes (limit ${max})`);
  }
});
