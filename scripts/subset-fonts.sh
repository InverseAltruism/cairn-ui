#!/usr/bin/env bash
# Rebuilds fonts/*.woff2 and fonts/PROVENANCE.json from the official Geist release, byte for byte.
# Usage: scripts/subset-fonts.sh <geist-font-v1.7.2.zip> <python with fonttools 4.66.1 and brotli 1.2.0>
# The release zip is checked against its sha256 before anything is read from it.
set -euo pipefail

ZIP="${1:?release zip}"
PY="${2:?python with fonttools}"
ZIP_SHA256="7fc800d2ac6b92844895196e5041aca55d814c15db70c44f79b3b83ab82b04e2"
RELEASE_URL="https://github.com/vercel/geist-font/releases/download/v1.7.2/geist-font-v1.7.2.zip"
# Google Fonts' "latin" set (Latin-1, punctuation, the euro, the BOM, U+FFFD) plus the arrows, maths signs and shapes the
# designs use: arrows U+2190-2199, minus, infinity, approximately, not equal, less or equal, greater or equal, and the
# triangles, circle and square of U+25A0-25CF.
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+221E,U+2248,U+2260,U+2264-2265,U+25A0-25CF,U+FEFF,U+FFFD"

root="$(cd "$(dirname "$0")/.." && pwd)"
echo "${ZIP_SHA256}  ${ZIP}" | sha256sum -c --quiet
"$PY" -I -c 'import fontTools, brotli; assert fontTools.version == "4.66.1", fontTools.version; assert brotli.version == "1.2.0", brotli.version'

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
# zipfile, not unzip: unzip reads the brackets in "[wght]" as a glob.
"$PY" -I -c 'import os, sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
for m in sys.argv[3:]:
    open(os.path.join(sys.argv[2], os.path.basename(m)), "wb").write(z.read(m))' "$ZIP" "$work" \
  "geist-font/Geist/webfonts/Geist[wght].woff2" "geist-font/GeistMono/webfonts/GeistMono[wght].woff2" "geist-font/OFL.txt"

subset() {
  "$PY" -I -m fontTools.subset "$work/$1" --unicodes="$UNICODES" --layout-features='*' --flavor=woff2 \
    --output-file="$root/fonts/$2"
}
mkdir -p "$root/fonts"
subset "Geist[wght].woff2" "Geist-Latin.woff2"
subset "GeistMono[wght].woff2" "GeistMono-Latin.woff2"
cp "$work/OFL.txt" "$root/fonts/OFL.txt"

sha() { sha256sum "$1" | cut -d' ' -f1; }
size() { wc -c < "$1" | tr -d ' '; }
cat > "$root/fonts/PROVENANCE.json" <<JSON
{
  "source": {
    "release": "$RELEASE_URL",
    "zipSha256": "$ZIP_SHA256",
    "licence": "SIL Open Font License 1.1, Copyright 2024 The Geist Project Authors (fonts/OFL.txt)"
  },
  "tool": { "fonttools": "4.66.1", "brotli": "1.2.0" },
  "unicodes": "$UNICODES",
  "layoutFeatures": "all",
  "files": {
    "Geist-Latin.woff2": { "from": "geist-font/Geist/webfonts/Geist[wght].woff2", "fromSha256": "$(sha "$work/Geist[wght].woff2")", "sha256": "$(sha "$root/fonts/Geist-Latin.woff2")", "bytes": $(size "$root/fonts/Geist-Latin.woff2") },
    "GeistMono-Latin.woff2": { "from": "geist-font/GeistMono/webfonts/GeistMono[wght].woff2", "fromSha256": "$(sha "$work/GeistMono[wght].woff2")", "sha256": "$(sha "$root/fonts/GeistMono-Latin.woff2")", "bytes": $(size "$root/fonts/GeistMono-Latin.woff2") },
    "OFL.txt": { "from": "geist-font/OFL.txt", "sha256": "$(sha "$root/fonts/OFL.txt")" }
  }
}
JSON
echo "subset-fonts: $(size "$root/fonts/Geist-Latin.woff2") + $(size "$root/fonts/GeistMono-Latin.woff2") bytes"
