#!/usr/bin/env bash
# One-time import from the backup branch: JSON indexes and docs only, never PDFs.
# PDFs from the backup branch are copied into the gitignored release cache.
set -euo pipefail
SRC="origin/feat/official-russian-school-materials"
DATA="data/school-materials"
CACHE=".cache/school-materials"
git fetch --no-tags origin feat/official-russian-school-materials
mkdir -p "$DATA" "$CACHE/release" "$CACHE/legacy"
if [ ! -f "$DATA/official-russian-school-material-items.json" ]; then
  for f in official-russian-school-materials.json official-russian-school-material-items.json \
           federal-working-programs.json official-extracurricular-programs.json \
           federal-textbook-list-2026-sections.json federal-textbook-bibliography-2026.json \
           federal-textbook-bibliography-2026-full-extraction.json \
           federal-textbooks-2026-primary-1-4.json federal-textbooks-2026-basic-5-9.json \
           federal-textbooks-2026-secondary-10-11.json edsoo-official-lesson-index.json \
           historical-school-textbooks-library.json original-school-practice-bank.json \
           school-curriculum-coverage.json fipi-exam-materials-2026-2027.json; do
    git show "$SRC:apps/web/src/data/$f" > "$DATA/$f"
  done
  mkdir -p docs/official-russian-school-materials
  for f in README.md FIPI-EXAM-MATERIALS.md; do
    git show "$SRC:docs/official-russian-school-materials/$f" > "docs/official-russian-school-materials/$f"
  done
fi
# Seed the cache with already-downloaded PDFs (names there are id-based and safe).
git archive "$SRC" downloads/federal-working-programs downloads/federal-textbook-list-2026 \
  downloads/federal-extracurricular-programs | tar -x -C "$CACHE/legacy"
for p in "$CACHE"/legacy/downloads/federal-working-programs/*.pdf; do
  [ -e "$p" ] || continue
  d="$CACHE/release/frp-$(basename "$p")"; [ -e "$d" ] || cp "$p" "$d"
done
fpu=$(ls "$CACHE"/legacy/downloads/federal-textbook-list-2026/*.pdf 2>/dev/null | grep -v -- '-ocr.pdf' | head -n1 || true)
if [ -n "$fpu" ] && [ ! -e "$CACHE/release/fpu-436-2026.pdf" ]; then cp "$fpu" "$CACHE/release/fpu-436-2026.pdf"; fi
# Extracurricular PDFs are NOT seeded: their ASCII names collided, so they are re-downloaded.
ls "$CACHE/release" | wc -l
