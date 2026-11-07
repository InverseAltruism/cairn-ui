// Every job of every workflow names a fixed runner image, as the other Cairn repos do. GitHub moved ubuntu-latest to
// 26.04, where playwright-core 1.60.0 cannot install its Chromium (cairn-wallet's CI, 2026-11-07); a moving image
// changes the toolchain under a job without a commit.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT } from "./helpers/page.mjs";

const DIR = join(ROOT, ".github", "workflows");
const files = readdirSync(DIR).filter((f) => /\.ya?ml$/.test(f)).sort();
const text = (f) => readFileSync(join(DIR, f), "utf8");
const images = (t) => [...t.matchAll(/^[ \t]*runs-on:[ \t]*(\S*)/gm)].map((m) => m[1]);
const fixed = (t) => images(t).every((img) => img !== "" && !/latest/.test(img));

test("the workflows are exactly ci.yml, and its two jobs each name a runner", () => {
  assert.deepEqual(files, ["ci.yml"]);
  assert.equal(images(text("ci.yml")).length, 2);
});

test("every job names a fixed image, not a -latest one", () => {
  for (const f of files) assert.ok(fixed(text(f)), `${f}: ${images(text(f)).join(", ")}`);
});

test("the rule refuses a job moved back to ubuntu-latest (negative control)", () => {
  const ci = text("ci.yml");
  const mutated = ci.replace(/^( {4}runs-on: *)\S+/m, "$1ubuntu-latest");
  assert.notEqual(mutated, ci, "the mutation applied");
  assert.equal(fixed(mutated), false);
});
