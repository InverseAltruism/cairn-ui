import assert from "node:assert/strict";
import { test } from "node:test";
import { fakePage } from "./helpers/page.mjs";

function init(opts) {
  const page = fakePage(opts);
  page.run("theme-init.js");
  return page;
}

test("a stored choice wins over the system setting", () => {
  const dark = init({ stored: "dark", systemDark: false });
  assert.equal(dark.attrs.get("data-theme"), "dark");
  assert.equal(dark.attrs.get("data-theme-choice"), "dark");
  assert.equal(dark.root.style.colorScheme, "dark");
  const light = init({ stored: "light", systemDark: true });
  assert.equal(light.attrs.get("data-theme"), "light");
  assert.equal(light.root.style.colorScheme, "light");
});

test("nothing stored follows the system", () => {
  const page = init({ systemDark: true });
  assert.equal(page.attrs.get("data-theme"), "dark");
  assert.equal(page.attrs.get("data-theme-choice"), "system");
  assert.equal(init({ systemDark: false }).attrs.get("data-theme"), "light");
});

test("an unknown stored value follows the system", () => {
  const page = init({ stored: "sepia", systemDark: true });
  assert.equal(page.attrs.get("data-theme"), "dark");
  assert.equal(page.attrs.get("data-theme-choice"), "system");
});

test("blocked storage follows the system instead of throwing", () => {
  const page = init({ storageThrows: true, systemDark: true });
  assert.equal(page.attrs.get("data-theme"), "dark");
  assert.equal(page.attrs.get("data-theme-choice"), "system");
});

test("theme-init.js reads the key theme.js writes", () => {
  const writer = fakePage({});
  writer.run("theme.js");
  const page = fakePage({ systemDark: false });
  page.store.set(writer.window.CairnTheme.KEY, "dark");
  page.run("theme-init.js");
  assert.equal(page.attrs.get("data-theme"), "dark");
});
