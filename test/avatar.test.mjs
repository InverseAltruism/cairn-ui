import assert from "node:assert/strict";
import { test } from "node:test";
import { ARC, ARC_START, avatarBackground, avatarHtml, avatarSpec, identitySeed } from "../avatar.js";

// sRGB [r, g, b] to OKLCH [L, C, hue in degrees]
const lin = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
function oklch([r, g, b]) {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}
// degrees from the start of the arc, forward through 0
const alongArc = (hue) => (hue - ARC_START + 360) % 360;
const seeds = (n, prefix = "") => Array.from({ length: n }, (_, i) => `${prefix}${i.toString(36)}${"abcdefghij"[i % 10]}`);

const SHAPE = /^conic-gradient\(from (\d{1,3})deg, (rgb\(\d{1,3} \d{1,3} \d{1,3}\)), (rgb\(\d{1,3} \d{1,3} \d{1,3}\), ){3}(rgb\(\d{1,3} \d{1,3} \d{1,3}\))\)$/;

test("any seed gives a gradient of whole numbers in a fixed template, closed on its first stop", () => {
  const hostile = ["", "x", '<img src=x onerror="alert(1)">', "a'b\"c;}</style>", "url(javascript:1)", "‮\ud800", "0x" + "f".repeat(40), "é".repeat(5000)];
  for (const s of [...hostile, ...seeds(500)]) {
    const css = avatarBackground(s);
    const m = SHAPE.exec(css);
    assert.ok(m, `${JSON.stringify(s.slice(0, 20))}: ${css}`);
    assert.ok(Number(m[1]) < 360);
    assert.equal(m[2], m[4], "the last stop repeats the first, so the circle has no seam");
    for (const v of css.match(/\d+/g)) assert.ok(Number(v) <= 360);
  }
  for (const s of [undefined, null, 42, {}, [], Symbol("s"), () => "alice"]) assert.equal(avatarBackground(s), avatarBackground(""));
});

test("the same seed draws the same avatar, here and in every consumer that vendors this file", () => {
  assert.equal(avatarBackground("alice"), avatarBackground("alice"));
  assert.notEqual(avatarBackground("alice"), avatarBackground("bob"));
  const golden = {
    alice: "conic-gradient(from 35deg, rgb(255 169 121), rgb(243 123 181), rgb(188 117 235), rgb(140 121 253), rgb(255 169 121))",
    satoshi: "conic-gradient(from 28deg, rgb(254 184 105), rgb(241 122 184), rgb(169 118 244), rgb(81 126 255), rgb(254 184 105))",
    "0x7a3f9c217a3f9c217a3f9c217a3f9c217a3f9c21": "conic-gradient(from 105deg, rgb(166 118 245), rgb(202 117 226), rgb(255 134 156), rgb(255 177 113), rgb(166 118 245))",
  };
  for (const [seed, css] of Object.entries(golden)) assert.equal(avatarBackground(seed), css, seed);
});

test("every stop stays in the design's band: its hue arc, lightness and chroma, inside sRGB", () => {
  let lo = 1;
  let hi = 0;
  for (const s of seeds(5000)) {
    const { stops } = avatarSpec(s);
    assert.equal(stops.length, 4);
    for (const c of stops) {
      assert.ok(c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255), `${s}: ${c}`);
      const [L, C, hue] = oklch(c);
      assert.ok(alongArc(hue) <= ARC + 1.5 || alongArc(hue) >= 358.5, `${s}: hue ${hue.toFixed(1)} is outside the arc (no green, no yellow)`);
      assert.ok(L >= 0.6 && L <= 0.86, `${s}: lightness ${L.toFixed(3)}`);
      assert.ok(C >= 0.1 && C <= 0.21, `${s}: chroma ${C.toFixed(3)}`);
      lo = Math.min(lo, L);
      hi = Math.max(hi, L);
    }
  }
  // the band is light and soft: far from the dark ground, below the light ground (avatar.css adds the hairline there)
  assert.ok(lo > 0.6 && hi < 0.86, `${lo}..${hi}`);
});

test("identities differ: the start angle covers the circle, the stretch of the arc moves, and one changed letter moves both", () => {
  const all = seeds(3000).map(avatarSpec);
  const sectors = new Array(12).fill(0);
  for (const a of all) sectors[Math.floor(a.from / 30)]++;
  for (const n of sectors) assert.ok(n > all.length / 12 / 2, `start angles per 30 degrees: ${sectors}`);
  const coolest = all.map((a) => Math.min(...a.stops.map((c) => alongArc(oklch(c)[2]) % 359)));
  assert.ok(Math.max(...coolest) - Math.min(...coolest) > 40, "the arc's stretch moves between identities");
  let turned = 0;
  const base = seeds(1000, "name");
  for (const s of base) {
    const a = avatarSpec(s);
    const b = avatarSpec(`${s.slice(0, -1)}${s.at(-1) === "a" ? "b" : "a"}`);
    const d = Math.abs(a.from - b.from);
    if (Math.min(d, 360 - d) > 30) turned++;
  }
  assert.ok(turned > base.length * 0.75, `${turned} of ${base.length} one-letter changes turned the gradient more than 30 degrees`);
});

test("avatarHtml: a decorative span with the gradient inline; a class list that is not plain words throws", () => {
  const html = avatarHtml("alice", "cn-av  lg");
  assert.equal(html, `<span class="ui-avatar cn-av lg" style="background:${avatarBackground("alice")}" aria-hidden="true"></span>`);
  assert.equal(avatarHtml("alice"), `<span class="ui-avatar" style="background:${avatarBackground("alice")}" aria-hidden="true"></span>`);
  for (const bad of ['x" onclick="1', "a>b", "a;b", 5]) assert.throws(() => avatarHtml("alice", bad), TypeError);
});

test("identitySeed: the primary name when there is one, else the address in lower case", () => {
  assert.equal(identitySeed("alice", "0xAB"), "alice");
  assert.equal(identitySeed("  alice ", "0xAB"), "alice");
  assert.equal(identitySeed("", "0xAbCd"), "0xabcd");
  assert.equal(identitySeed(null, "0xAbCd"), "0xabcd");
  assert.equal(identitySeed(null, null), "");
  assert.equal(avatarBackground(identitySeed("alice", "0xAB")), avatarBackground("alice"), "an account with a primary name draws that name's avatar");
});
