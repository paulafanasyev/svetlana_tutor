"""Write data/school-materials/REPORT.md: schema, counts, legacy collisions, expired-table hints."""
import json, re, subprocess, sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from school_materials_common import DATA, MANIFESTS, CACHE, ROOT, load

EXPIRY = re.compile(r"[Дд]о\s*31\s*августа\s*20\d\d")


def strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from strings(v)


def main():
    out = ["# School materials: import report", ""]
    for path in sorted(DATA.glob("*.json")):
        obj = load(path)
        out.append(f"## {path.name} ({path.stat().st_size} bytes)")
        if isinstance(obj, dict):
            out.append("top-level: " + ", ".join(f"{k}:{type(v).__name__}{'[' + str(len(v)) + ']' if isinstance(v, (list, dict)) else ''}" for k, v in obj.items()))
            for k, v in obj.items():
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    keys = Counter(key for rec in v for key in rec)
                    out.append(f"- `{k}` record keys: " + ", ".join(f"{a}({b})" for a, b in keys.most_common(40)))
                    for field in ("extractionStatus", "status", "rightsStatus", "provenance", "downloadStatus"):
                        c = Counter(str(rec.get(field)) for rec in v if field in rec)
                        if c:
                            out.append(f"  - {field}: " + ", ".join(f"{a}={b}" for a, b in c.most_common(8)))
                    hits = sum(1 for rec in v if any(EXPIRY.search(s) for s in strings(rec)))
                    out.append(f"  - records mentioning «до 31 августа 20XX»: {hits}")
                    if path.name.startswith("federal-textbook"):
                        out.append("  - samples:")
                        for rec in v[:3] + v[len(v) // 2:len(v) // 2 + 2]:
                            out.append("    ```json\n    " + json.dumps(rec, ensure_ascii=False)[:900] + "\n    ```")
        out.append("")
    out.append("## Manifests")
    for path in sorted(MANIFESTS.glob("*.json")):
        m = load(path)
        out.append(f"- {path.name}: " + ", ".join(f"{k}={m[k]}" for k in m if isinstance(m[k], (int, str)) and k not in ("note", "title")))
    legacy = CACHE / "legacy/downloads/federal-extracurricular-programs"
    if legacy.exists():
        old_pdfs = sorted(p.name for p in legacy.glob("*.pdf"))
        garbled = [n for n in old_pdfs if re.fullmatch(r"[-_.]*(pdf)?", n.replace(".pdf", "") + "") or n.startswith("_-")]
        old_m = legacy / "MANIFEST.json"
        old_entries = load(old_m).get("files", []) if old_m.exists() else []
        paths = Counter(e.get("localPath") for e in old_entries)
        out += ["", "## Legacy extracurricular (backup branch)",
                f"- PDFs in git: {len(old_pdfs)}; manifest entries: {len(old_entries)}",
                f"- localPath collisions (several URLs -> one file): {sum(v - 1 for v in paths.values() if v > 1)}",
                f"- garbled-looking names: {len(garbled)}"]

    # Cross-check with apps/web/src/data/fpu_status.json (checked by hand on Consultant 21.10).
    status_path = ROOT / "apps/web/src/data/fpu_status.json"
    if status_path.exists():
        status = load(status_path)["items"]
        by_code = {}
        for name in ("federal-textbooks-2026-primary-1-4.json", "federal-textbooks-2026-basic-5-9.json",
                     "federal-textbooks-2026-secondary-10-11.json"):
            for rec in load(DATA / name)["records"]:
                by_code.setdefault(rec.get("sectionCode"), []).append(("garant", rec.get("listRow"), rec.get("title"), rec.get("allowedUseUntil")))
        for rec in load(DATA / "federal-textbook-bibliography-2026-full-extraction.json")["records"]:
            by_code.setdefault(rec.get("sectionCode"), []).append(("ocr", rec.get("federalListNumber"), rec.get("title"), None))
        # Position codes repeat across the tables of order No. 436 (e.g. 1.1.1.7.1.1 is Informatics No. 110
        # in one table and Okruzhayushchiy mir No. 199 in another), so only the pair number+code identifies a book.
        out += ["", "## Cross-check with fpu_status.json (pair: number + position code)",
                "| key | code | use_until | source | allowedUseUntil | title |", "|---|---|---|---|---|---|"]
        agree = disagree = absent = 0
        for key, st in status.items():
            head = key.split("|")[0]
            number = int(head) if head.isdigit() else None
            hits = [h for h in by_code.get(st["fpu_code"], []) if h[1] == number]
            # The hand-checked status catalogue represents unlimited approvals as
            # {"unlimited": true}; do not invent an expiry date or assume a missing
            # use_until field means a parsing failure.
            unlimited = st.get("unlimited") is True
            use_until = st.get("use_until")
            use_until_label = use_until or ("Бессрочно" if unlimited else "NOT_PROVEN")
            if not any(h[0] == "garant" for h in hits):
                absent += 1
            if not hits:
                out.append(f"| {key} | {st['fpu_code']} | {use_until_label} | — | — | NOT IN EXTRACT |")
            for src, row, title, until in hits:
                year_match = re.search(r"(20\d\d)", until or "")
                if src == "ocr" or not until:
                    ok = None
                elif unlimited:
                    ok = "бессрочно" in until.casefold()
                else:
                    ok = bool(year_match and use_until and year_match.group(1) == use_until[:4])
                agree += ok is True; disagree += ok is False
                flag = "" if ok is not False else " **MISMATCH**"
                out.append(f"| {key} | {st['fpu_code']} | {use_until_label} | {src} | {until or '—'}{flag} | {(title or '')[:70]} |")
        out.append(f"- agree={agree} disagree={disagree} not_in_garant_extract={absent}")
        reused = sum(1 for code, hs in by_code.items() if len({h[1] for h in hs if h[0] == "garant"}) > 1)
        out.append(f"- position codes used by more than one row in the garant extract: {reused}")
        years = Counter()
        for name in ("federal-textbooks-2026-primary-1-4.json", "federal-textbooks-2026-basic-5-9.json",
                     "federal-textbooks-2026-secondary-10-11.json"):
            for rec in load(DATA / name)["records"]:
                m = re.search(r"(20\d\d)", rec.get("allowedUseUntil") or "")
                years[(name.split("-2026-")[1].replace(".json", ""), m.group(1) if m else "none")] += 1
        out.append("- allowedUseUntil by stage/year: " + ", ".join(f"{a}:{b}={c}" for (a, b), c in sorted(years.items())))

    # Diagnostics for CI: run the invariant test here and save its output (Actions logs are not visible to the reviewer).
    diag = ["# School materials: checks", ""]
    odd = Counter()
    deadline_pattern = re.compile(
        r"^(?:До\s+\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+20\d{2}(?:\s+года)?|[Бб]ессрочно)$"
    )
    for name in ("federal-textbooks-2026-primary-1-4.json", "federal-textbooks-2026-basic-5-9.json",
                 "federal-textbooks-2026-secondary-10-11.json"):
        for rec in load(DATA / name)["records"]:
            v = rec.get("allowedUseUntil")
            if v is not None and not deadline_pattern.fullmatch(v.strip()):
                odd[v[:80]] += 1
    diag.append("- invalid allowedUseUntil date formats (manual review): " + (", ".join(f"«{a}»={b}" for a, b in odd.most_common(20)) or "none"))
    for name in ("official-russian-school-material-items.json", "federal-working-programs.json"):
        n = (DATA / name).read_text(encoding="utf-8").count('"localPath"')
        diag.append(f"- {name}: localPath occurrences = {n}")
    test_file = ROOT / "apps/web/src/data/schoolMaterials.test.js"
    if test_file.exists():
        try:
            run = subprocess.run(["node", "--test", str(test_file)], capture_output=True, text=True, timeout=300)
            text = (run.stdout + run.stderr).splitlines()
            fails = [i for i, line in enumerate(text) if line.startswith("not ok") or "AssertionError" in line or "Error" in line]
            keep = sorted({j for i in fails for j in range(max(0, i - 2), min(len(text), i + 25))})
            diag += ["", f"## node --test exit={run.returncode}", "```"] + [text[j][:300] for j in keep][:300] \
                    + [l for l in text if l.startswith("# ")] + ["```"]
        except Exception as exc:
            diag.append(f"- node --test could not run: {exc}")
    (DATA / "CHECKS.md").write_text("\n".join(diag) + "\n", encoding="utf-8")
    (DATA / "REPORT.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out[:80]))


if __name__ == "__main__":
    main()
