import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT, source } from "./helpers/page.mjs";

const prov = JSON.parse(source("fonts/PROVENANCE.json"));
const bytes = (f) => readFileSync(join(ROOT, "fonts", f));

test("each font file is the one PROVENANCE.json records", () => {
  for (const [file, rec] of Object.entries(prov.files)) {
    const b = bytes(file);
    assert.equal(createHash("sha256").update(b).digest("hex"), rec.sha256, file);
    if (rec.bytes !== undefined) assert.equal(b.length, rec.bytes, file);
  }
});

test("the fonts are WOFF2 under the SIL Open Font License", () => {
  for (const file of ["Geist-Latin.woff2", "GeistMono-Latin.woff2"]) assert.equal(bytes(file).subarray(0, 4).toString("latin1"), "wOF2", file);
  assert.match(source("fonts/OFL.txt"), /SIL OPEN FONT LICENSE Version 1\.1/);
});

test("fonts.css points at the recorded files and nothing else", () => {
  const urls = [...source("fonts.css").matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.deepEqual(urls, ["fonts/Geist-Latin.woff2", "fonts/GeistMono-Latin.woff2"]);
  for (const u of urls) assert.ok(prov.files[u.replace("fonts/", "")], u);
});

test("the subset script and the record agree on the source and the tool", () => {
  const script = source("scripts/subset-fonts.sh");
  assert.ok(script.includes(prov.source.zipSha256));
  assert.ok(script.includes(prov.source.release));
  assert.ok(script.includes(`UNICODES="${prov.unicodes}"`));
  assert.ok(script.includes(`fontTools.version == "${prov.tool.fonttools}"`));
});
