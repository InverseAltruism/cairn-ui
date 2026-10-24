import assert from "node:assert/strict";
import { test } from "node:test";
import { SCALE } from "../src/palette.mjs";
import { fakePage } from "./helpers/page.mjs";

/** A page after theme-init.js, with theme.js loaded. */
function page(opts = {}) {
  const p = fakePage(opts);
  p.run("theme-init.js");
  p.run("theme.js");
  return { ...p, T: p.window.CairnTheme };
}

test("the reveal grows from the given point, applies inside the transition and stores the choice", async () => {
  const p = page({ systemDark: false });
  await p.T.set("dark", { x: 250, y: 200 });
  assert.equal(p.attrs.get("data-theme"), "dark");
  assert.equal(p.attrs.get("data-theme-choice"), "dark");
  assert.equal(p.root.style.colorScheme, "dark");
  assert.equal(p.store.get("cairn-theme"), "dark");
  assert.deepEqual(p.log.events.map((e) => [e.type, e.detail.mode, e.inUpdate]), [["cairn:theme", "dark", true]]);
  assert.equal(p.animations.length, 1);
  const { keyframes, options } = p.animations[0];
  assert.equal(options.pseudoElement, "::view-transition-new(root)");
  assert.equal(keyframes.clipPath[0], "circle(0px at 25% 25%)");
  assert.equal(keyframes.clipPath[1], `circle(${Math.hypot(750, 600)}px at 25% 25%)`);
  assert.equal(p.props.get("--ui-reveal-x"), "25%");
  assert.equal([...p.classes].length, 0, "the switch classes are removed when it finishes");
});

test("the reveal timing is the design tokens' (--ui-dur-4, --ui-ease)", async () => {
  const p = page({ systemDark: false });
  assert.equal(`${p.T.REVEAL_MS}ms`, SCALE["dur-4"]);
  assert.equal(p.T.EASE, SCALE.ease);
  await p.T.set("dark");
  assert.equal(p.animations[0].options.duration, p.T.REVEAL_MS);
  assert.equal(p.animations[0].options.easing, SCALE.ease);
});

test("reduced motion crossfades instead of revealing", async () => {
  const p = page({ systemDark: false, reduced: true });
  await p.T.set("dark");
  assert.equal(p.animations.length, 1);
  assert.deepEqual([...p.animations[0].keyframes.opacity], [0, 1]);
  assert.equal(p.animations[0].options.duration, p.T.FADE_MS);
  assert.equal(p.animations[0].keyframes.clipPath, undefined);
  assert.equal(p.attrs.get("data-theme"), "dark");
});

test("without view transitions the theme swaps at once and the switch ends on the next frame", async () => {
  const p = page({ systemDark: false, vt: "none" });
  const done = p.T.set("dark");
  assert.equal(p.attrs.get("data-theme"), "dark", "applied before the frame");
  assert.ok(p.classes.has("ui-theme-switching"), "transitions held until the frame");
  p.flushRaf();
  await done;
  assert.equal(p.classes.has("ui-theme-switching"), false);
  assert.equal(p.animations.length, 0);
});

test("a refused transition still switches, without an animation", async () => {
  const p = page({ systemDark: false, vt: "throws" });
  await p.T.set("dark");
  assert.equal(p.attrs.get("data-theme"), "dark");
  assert.equal(p.animations.length, 0);
  assert.equal([...p.classes].length, 0);
});

test("a skipped transition still switches and settles", async () => {
  const p = page({ systemDark: false, vt: "skip" });
  await p.T.set("dark");
  assert.equal(p.attrs.get("data-theme"), "dark");
  assert.equal([...p.classes].length, 0);
  await p.T.set("light");
  assert.equal(p.attrs.get("data-theme"), "light", "the next switch is not blocked");
});

test("a second call while a switch runs returns that switch and changes nothing", async () => {
  const p = page({ systemDark: false });
  const first = p.T.set("dark");
  const second = p.T.set("light");
  assert.equal(second, first);
  await first;
  assert.equal(p.attrs.get("data-theme"), "dark");
  assert.equal(p.store.get("cairn-theme"), "dark");
  assert.equal(p.log.vtCalls, 1);
});

test("a choice that keeps the mode applies without a transition; system clears the stored choice", async () => {
  const p = page({ stored: "light", systemDark: false });
  await p.T.set("system");
  assert.equal(p.log.vtCalls, 0);
  assert.equal(p.store.has("cairn-theme"), false);
  assert.equal(p.attrs.get("data-theme-choice"), "system");
  assert.equal(p.attrs.get("data-theme"), "light");
});

test("blocked storage does not stop a switch", async () => {
  const p = page({ storageThrows: true, systemDark: false });
  await p.T.set("dark");
  assert.equal(p.attrs.get("data-theme"), "dark");
});

test("toggle reveals from the centre of the pressed element", async () => {
  const p = page({ systemDark: false });
  await p.T.toggle({ getBoundingClientRect: () => ({ left: 900, top: 10, width: 40, height: 40 }) });
  assert.equal(p.attrs.get("data-theme"), "dark");
  assert.equal(p.props.get("--ui-reveal-x"), "92%");
  assert.equal(p.props.get("--ui-reveal-y"), "3.75%");
});

test("sync follows the system only while the choice is system, and follows other tabs", () => {
  const p = page({ systemDark: false });
  p.T.startSync();
  p.T.startSync();
  p.systemChange(true);
  assert.equal(p.attrs.get("data-theme"), "dark");
  assert.equal(p.log.events.length, 1, "one listener however often startSync runs");
  p.storageEvent("cairn-theme", "light");
  assert.equal(p.attrs.get("data-theme"), "light");
  assert.equal(p.attrs.get("data-theme-choice"), "light");
  p.systemChange(false);
  p.systemChange(true);
  assert.equal(p.attrs.get("data-theme"), "light", "an explicit choice ignores the system");
  p.storageEvent("other-key", "dark");
  assert.equal(p.attrs.get("data-theme"), "light");
});

test("onChange reports each applied theme until unsubscribed", async () => {
  const p = page({ systemDark: false });
  const seen = [];
  const off = p.T.onChange((s) => seen.push(`${s.mode}/${s.choice}`));
  await p.T.set("dark");
  off();
  await p.T.set("light");
  assert.deepEqual(seen, ["dark/dark"]);
});

test("loading theme.js twice keeps the first instance", () => {
  const p = page({});
  const first = p.T;
  p.run("theme.js");
  assert.equal(p.window.CairnTheme, first);
});

test("the reveal radius reaches the farthest corner", () => {
  const p = page({});
  assert.equal(p.T.revealRadius(0, 0, 1000, 800), Math.hypot(1000, 800));
  assert.equal(p.T.revealRadius(50, 50, 1000, 800), Math.hypot(500, 400));
  assert.equal(p.T.toggleLabel("dark"), "Switch to light theme");
  assert.match(p.T.iconSvg("m1"), /mask id="m1"/);
});
