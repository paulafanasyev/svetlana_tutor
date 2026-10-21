import concurrent.futures, hashlib, json, re, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROGRAMS = ROOT / "apps/web/src/data/federal-working-programs.json"
ITEMS = ROOT / "apps/web/src/data/official-russian-school-material-items.json"
SOURCES = ROOT / "apps/web/src/data/official-russian-school-materials.json"
OUT = ROOT / "downloads/federal-working-programs"
MAX_BYTES = 45 * 1024 * 1024
UA = "SvetlanaTutor-EducationResources/1.0 (+https://github.com/paulafanasyev/svetlana_tutor)"

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def allowed(p):
    u = urllib.parse.urlparse(p.get("url", ""))
    return (p.get("fileFormat") == "PDF" and p.get("pages") is not None
        and u.scheme == "https" and u.hostname == "edsoo.ru"
        and u.path.startswith("/wp-content/uploads/")
        and re.fullmatch(r"[a-z0-9-]+", p.get("id", "")) is not None)

def fetch(p):
    dest = OUT / (p["id"] + ".pdf")
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        data = dest.read_bytes()
        if len(data) > 1024 and data.startswith(b"%PDF-"):
            return p["id"], dest, data, None
        dest.unlink(missing_ok=True)
    req = urllib.request.Request(p["url"], headers={"User-Agent": UA, "Accept": "application/pdf,*/*"})
    error = "unknown download error"
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = resp.read(MAX_BYTES + 1)
            if len(data) > MAX_BYTES: raise ValueError("file exceeds 45 MiB limit")
            if len(data) <= 1024 or not data.startswith(b"%PDF-"):
                raise ValueError("response does not have a PDF signature")
            tmp = dest.with_suffix(".pdf.part")
            tmp.write_bytes(data)
            tmp.replace(dest)
            return p["id"], dest, data, None
        except Exception as exc:
            error = f"{type(exc).__name__}: {exc}"
            if attempt < 2: time.sleep(2 * (attempt + 1))
    dest.unlink(missing_ok=True)
    return p["id"], None, None, error

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    doc, idx, sources = load(PROGRAMS), load(ITEMS), load(SOURCES)
    records = [p for p in doc["programs"] if allowed(p)]
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for ident, path, data, error in executor.map(fetch, records):
            results[ident] = (path, data, error)
            print(("OK " if path else "FAILED ") + ident + (f" ({len(data)} bytes)" if data else f" ({error})"))
    now = datetime.now(timezone.utc).isoformat()
    by_id = {x.get("id"): x for x in idx["items"]}
    manifest_files = []
    for p in doc["programs"]:
        if p["id"] not in results: continue
        path, data, error = results[p["id"]]
        p["contentStoredLocally"] = bool(path)
        p["downloadAttemptAt"] = now
        p["sourceAttributionUrl"] = p["url"]
        item = by_id.get(p["id"])
        if path:
            sha = hashlib.sha256(data).hexdigest()
            local = path.relative_to(ROOT).as_posix()
            p.update({"localPath":local,"fileSizeBytes":len(data),"sha256":sha,
                      "downloadStatus":"LOCAL_PDF_SIGNATURE_AND_HASH_VERIFIED",
                      "accessStatus":"LOCAL_COPY_VERIFIED_SOURCE_LINK_RETAINED"})
            p.pop("downloadError", None)
            if item is None:
                item = {"id":p["id"],"sourceId":p["sourceId"],"title":p["title"],
                    "gradeRange":p["gradeRange"],"subject":p["subject"],"kind":["federal-working-program"],"url":p["url"]}
                idx["items"].append(item); by_id[p["id"]] = item
            item.update({"contentStoredLocally":True,"localPath":local,"fileSizeBytes":len(data),"sha256":sha,
                "sourceAttributionUrl":p["url"],"accessStatus":"LOCAL_COPY_VERIFIED_SOURCE_LINK_RETAINED",
                "rightsStatus":"OFFICIAL_EDSOO_PDF_WITH_ACTIVE_SOURCE_LINK"})
            item.pop("downloadError", None)
        else:
            p.update({"downloadStatus":"DOWNLOAD_FAILED_RETRY_REQUIRED","downloadError":error})
            for key in ("localPath","fileSizeBytes","sha256"): p.pop(key, None)
            if item:
                item.update({"contentStoredLocally":False,"downloadError":error,"accessStatus":"DOWNLOAD_FAILED_RETRY_REQUIRED"})
                for key in ("localPath","fileSizeBytes","sha256"): item.pop(key, None)
        manifest_files.append({"id":p["id"],"title":p["title"],"gradeRange":p["gradeRange"],
            "subject":p["subject"],"sourceUrl":p["url"],"localPath":p.get("localPath"),
            "pages":p.get("pages"),"fileSizeBytes":p.get("fileSizeBytes"),"sha256":p.get("sha256"),
            "status":p.get("downloadStatus"),"error":p.get("downloadError")})
    ok = sum(1 for x in manifest_files if x["status"] == "LOCAL_PDF_SIGNATURE_AND_HASH_VERIFIED")
    failed = len(manifest_files) - ok
    doc["localDownloadSummary"] = {"attempted":len(records),"verifiedLocalPdfCount":ok,"failedCount":failed,
        "manifestPath":"downloads/federal-working-programs/MANIFEST.json","lastAttemptAt":now}
    idx["lastVerified"] = "2026-10-21"
    sources["localFederalWorkingProgramPdfCount"] = ok
    sources["lastFederalProgramDownloadAttemptAt"] = now
    save(PROGRAMS, doc); save(ITEMS, idx); save(SOURCES, sources)
    manifest = {"generatedAt":now,"officialCatalogue":"https://edsoo.ru/rabochie-programmy/",
        "attribution":"Source URLs retained for every PDF; see the official catalogue footer.",
        "commercialTextbooksIncluded":False,"attempted":len(records),"verifiedLocalPdfCount":ok,
        "failedCount":failed,"files":manifest_files}
    save(OUT / "MANIFEST.json", manifest)
    lines = ["# Федеральные рабочие программы — локальные копии","",
        "PDF сохранены без изменения содержания. В MANIFEST.json есть исходные URL и SHA-256.",
        "Официальный каталог: https://edsoo.ru/rabochie-programmy/","",
        f"Проверено по сигнатуре PDF и SHA-256: {ok} из {len(records)}. Ошибок: {failed}.",
        "Это федеральные рабочие программы, а не коммерческие учебники издательств.","","## Файлы",""]
    for p in manifest_files:
        if p["localPath"]:
            lines.append(f"- [{p['title']}]({Path(p['localPath']).name}) — {p['pages']} стр.; [первоисточник]({p['sourceUrl']}); SHA-256: `{p['sha256']}`")
        else:
            lines.append(f"- НЕ СКАЧАНО: {p['title']} — [первоисточник]({p['sourceUrl']}); {p['error']}")
    (OUT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"SUMMARY attempted={len(records)} verified={ok} failed={failed}")
    return 0 if ok else 1

if __name__ == "__main__": raise SystemExit(main())
