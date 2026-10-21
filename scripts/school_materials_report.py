"""Write data/school-materials/REPORT.md: schema, counts, legacy collisions, expired-table hints."""
import json, re, sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from school_materials_common import DATA, MANIFESTS, CACHE, load

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
        garbled = [n for n in old_pdfs if n.startswith("_-") or re.fullmatch(r"[-_.]+pdf", n)]
        old_m = legacy / "MANIFEST.json"
        old_entries = load(old_m).get("files", []) if old_m.exists() else []
        paths = Counter(e.get("localPath") for e in old_entries)
        out += ["", "## Legacy extracurricular (backup branch)",
                f"- PDFs in git: {len(old_pdfs)}; manifest entries: {len(old_entries)}",
                f"- localPath collisions (several URLs -> one file): {sum(v - 1 for v in paths.values() if v > 1)}",
                f"- garbled-looking names: {len(garbled)}"]
    (DATA / "REPORT.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out[:80]))


if __name__ == "__main__":
    main()
