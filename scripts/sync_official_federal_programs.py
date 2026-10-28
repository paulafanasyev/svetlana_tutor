"""Download EDSOO federal working programme PDFs into the release cache (not git)."""
import concurrent.futures, hashlib, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from school_materials_common import DATA, MANIFESTS, RELEASE_DIR, load, save, release_fields, drop_local

PROGRAMS = DATA / "federal-working-programs.json"
ITEMS = DATA / "official-russian-school-material-items.json"
SOURCES = DATA / "official-russian-school-materials.json"
MANIFEST = MANIFESTS / "federal-working-programs.json"
MAX_BYTES = 45 * 1024 * 1024
UA = "SvetlanaTutor-EducationResources/1.0 (+https://github.com/paulafanasyev/svetlana_tutor)"


def allowed(p):
    # Links whose redistribution terms are not established must never enter the
    # Release mirror workflow, even when they are official PDF URLs.
    if p.get("mirrorAllowed") is False:
        return False
    u = urllib.parse.urlparse(p.get("url", ""))
    return (p.get("fileFormat") == "PDF" and u.scheme == "https" and u.hostname == "edsoo.ru"
            and u.path.startswith("/wp-content/uploads/")
            and re.fullmatch(r"[a-z0-9-]+", p.get("id", "")) is not None)


def asset_name(p):
    return f"frp-{p['id']}.pdf"


def fetch(p):
    dest = RELEASE_DIR / asset_name(p)
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
            if len(data) > MAX_BYTES:
                raise ValueError("file exceeds 45 MiB limit")
            if len(data) <= 1024 or not data.startswith(b"%PDF-"):
                raise ValueError("response does not have a PDF signature")
            tmp = dest.with_suffix(".part")
            tmp.write_bytes(data)
            tmp.replace(dest)
            return p["id"], dest, data, None
        except Exception as exc:
            error = f"{type(exc).__name__}: {exc}"
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
    return p["id"], None, None, error


def main():
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    doc, idx, sources = load(PROGRAMS), load(ITEMS), load(SOURCES)
    records = [p for p in doc["programs"] if allowed(p)]
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        for ident, path, data, error in ex.map(fetch, records):
            results[ident] = (path, data, error)
            print(("OK " if path else "FAILED ") + ident + (f" ({len(data)} bytes)" if data else f" ({error})"))
    now = datetime.now(timezone.utc).isoformat()
    by_id = {x.get("id"): x for x in idx["items"]}
    files = []
    for p in doc["programs"]:
        if p["id"] not in results:
            continue
        path, data, error = results[p["id"]]
        item = by_id.get(p["id"])
        drop_local(p)
        if item:
            drop_local(item)
        p["sourceAttributionUrl"] = p["url"]
        p["downloadAttemptAt"] = now
        # EDSOO PDFs are a corpus copy, not a check against FOP ed. 10.11.2025.
        p["provenance"] = "corpus"
        if path:
            sha = hashlib.sha256(data).hexdigest()
            rel = release_fields(asset_name(p), len(data), sha)
            p.update(rel)
            p.update({"downloadStatus": "PDF_SIGNATURE_AND_HASH_VERIFIED"})
            p.pop("downloadError", None)
            if item is not None:
                item.update(rel)
                item.update({"provenance": "corpus", "sourceAttributionUrl": p["url"],
                             "accessStatus": "RELEASE_COPY_SOURCE_LINK_RETAINED"})
                item.pop("downloadError", None)
        else:
            p.update({"downloadStatus": "DOWNLOAD_FAILED_RETRY_REQUIRED", "downloadError": error,
                      "storedInRelease": False, "contentStoredLocally": False})
            for key in ("fileSizeBytes", "sha256", "releaseAsset", "releaseUrl", "releaseTag"):
                p.pop(key, None)
            if item is not None:
                item.update({"storedInRelease": False, "contentStoredLocally": False, "downloadError": error})
        files.append({"id": p["id"], "title": p["title"], "gradeRange": p.get("gradeRange"),
                      "subject": p.get("subject"), "sourceUrl": p["url"], "pages": p.get("pages"),
                      "releaseAsset": p.get("releaseAsset"), "fileSizeBytes": p.get("fileSizeBytes"),
                      "sha256": p.get("sha256"), "status": p["downloadStatus"], "error": p.get("downloadError")})
    ok = sum(1 for f in files if f["releaseAsset"])
    doc.pop("localDownloadSummary", None)
    doc["releaseSummary"] = {"attempted": len(records), "verified": ok, "failed": len(files) - ok,
                             "manifestPath": "data/school-materials/manifests/federal-working-programs.json",
                             "lastAttemptAt": now, "provenance": "corpus (EDSOO, not checked against FOP ed. 10.11.2025)"}
    sources.pop("localFederalWorkingProgramPdfCount", None)
    sources["federalWorkingProgramReleasePdfCount"] = ok
    sources["lastFederalProgramDownloadAttemptAt"] = now
    save(PROGRAMS, doc); save(ITEMS, idx); save(SOURCES, sources)
    save(MANIFEST, {"generatedAt": now, "officialCatalogue": "https://edsoo.ru/rabochie-programmy/",
                    "provenance": "corpus", "attempted": len(records), "verified": ok,
                    "failed": len(files) - ok, "files": files})
    print(f"SUMMARY attempted={len(records)} verified={ok} failed={len(files) - ok}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
