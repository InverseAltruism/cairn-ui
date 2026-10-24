#!/usr/bin/env node
// Writes tokens.css from src/palette.mjs. With --check it writes nothing and fails when the committed file differs.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tokensCss } from "../src/tokens-css.mjs";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "tokens.css");
const next = tokensCss();
if (process.argv.includes("--check")) {
  let cur = "";
  try {
    cur = readFileSync(out, "utf8");
  } catch {
    cur = "";
  }
  if (cur !== next) {
    console.error("tokens.css is stale: run node scripts/build.mjs");
    process.exit(1);
  }
  console.log("tokens.css: current");
} else {
  writeFileSync(out, next);
  console.log("tokens.css: written");
}
