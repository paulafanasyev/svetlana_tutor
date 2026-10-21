#!/usr/bin/env python3
"""Download EDSOO extracurricular programme PDFs into the release cache (not git).

Asset names are built from a stable id (sha1 of the source URL), so Cyrillic
file names can no longer collapse into the same ASCII name and overwrite each other.
"""
from __future__ import annotations
import concurrent.futures, hashlib, html, re, sys, time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote, quote
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent))
from school_materials_common import DATA, MANIFESTS, RELEASE_DIR, load, save, release_fields, drop_local

PAGE = "https://edsoo.ru/rabochie-programmy-vd/"
ITEMS_PATH = DATA / "official-russian-school-material-items.json"
MANIFEST_PATH = MANIFESTS / "federal-extracurricular-programs.json"
MAX_FILES = 150
MAX_FILE_BYTES = 30 * 1024 * 1024
TIMEOUT = 30
WORKERS = 6


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.active = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.active = {"href": attrs["href"], "text": ""}
    def handle_data(self, data):
        if self.active is not None:
            self.active["text"] += data
    def handle_endtag(self, tag):
        if tag == "a" and self.active is not None:
            self.links.append(self.active); self.active = None


def fetch(url):
    url = quote(url, safe=":/?&=#%+-._~")
    req = Request(url, headers={"User-Agent": "svetlana-tutor-education-catalog/1.0"})
    last = None
    for attempt in range(3):
        try:
            with urlopen(req, timeout=TIMEOUT) as response:
                data = response.read(MAX_FILE_BYTES + 1)
                if len(data) > MAX_FILE_BYTES:
                    raise ValueError(f"file exceeds {MAX_FILE_BYTES} bytes")
                return data, response.headers.get("Content-Type", "")
        except Exception as exc:
            last = exc
            time.sleep(2 * (attempt + 1))
    raise last


def record_id(url):
    return "edsoo-vd-" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def title_of(url, link_text):
    text = re.sub(r"\s+", " ", link_text or "").strip()
    if len(text) >= 8 and not text.lower().startswith(("скачать", "pdf", "открыть")):
        return text
    stem = Path(unquote(urlparse(url).path)).stem
    return re.sub(r"[-_]+", " ", stem).strip() or stem


def download_one(url, link_text, checked_at):
    rid = record_id(url)
    name = f"vd-{rid.removeprefix('edsoo-vd-')}.pdf"
    path = RELEASE_DIR / name
    record = {"id": rid, "sourceId": "edsoo-extracurricular-programs", "title": title_of(url, link_text),
              "sourceFileName": unquote(Path(urlparse(url).path).name), "gradeRange": [1, 11],
              "topic": "Федеральная рабочая программа внеурочной деятельности; класс и предмет требуют проверки по PDF",
              "kind": ["official-extracurricular-program", "federal-working-program"],
              "url": url, "checkedAt": checked_at, "provenance": "corpus",
              "rightsStatus": "OFFICIAL_SOURCE; redistribution terms not independently established",
              "metadataCompleteness": "gradeRange_is_catalog_scope_not_verified_document_scope"}
    try:
        if path.exists() and path.read_bytes().startswith(b"%PDF-"):
            data = path.read_bytes()
        else:
            data, ctype = fetch(url)
            if not data.startswith(b"%PDF-"):
                raise ValueError(f"not a PDF (content-type={ctype})")
            path.write_bytes(data)
        sha = hashlib.sha256(data).hexdigest()
        record.update(release_fields(name, len(data), sha))
        record["downloadStatus"] = "PDF_SIGNATURE_AND_HASH_VERIFIED"
        print("OK " + name + " <- " + record["sourceFileName"])
    except Exception as exc:
        record.update({"downloadStatus": "DOWNLOAD_FAILED", "downloadError": str(exc)[:500],
                       "storedInRelease": False, "contentStoredLocally": False})
        print("FAILED " + record["sourceFileName"] + ": " + str(exc)[:180])
    return record


def main():
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    page, _ = fetch(PAGE)
    parser = LinkParser(); parser.feed(page.decode("utf-8", errors="replace"))
    links, seen = [], set()
    for link in parser.links:
        url = urljoin(PAGE, html.unescape(link["href"].strip()))
        p = urlparse(url)
        if p.scheme != "https" or p.netloc.lower() not in {"edsoo.ru", "www.edsoo.ru"}:
            continue
        if not p.path.lower().endswith(".pdf") or url in seen:
            continue
        seen.add(url); links.append((url, link["text"]))
    links = links[:MAX_FILES]
    if not links:
        raise RuntimeError("No direct EDSOO PDF links discovered; refusing to publish an empty catalogue.")
    checked_at = time.strftime("%Y-%m-%d", time.gmtime())
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        records = list(pool.map(lambda x: download_one(x[0], x[1], checked_at), links))
    by_sha = {}
    for r in records:
        if r.get("sha256"):
            if r["sha256"] in by_sha:
                r["duplicateOf"] = by_sha[r["sha256"]]
            else:
                by_sha[r["sha256"]] = r["id"]
    items = load(ITEMS_PATH)
    ids = {r["id"] for r in records}
    # Drop stale records from the old ASCII-name scheme that the current page no longer lists.
    kept = [x for x in items.get("items", [])
            if not (x.get("sourceId") == "edsoo-extracurricular-programs" and x.get("id") not in ids)]
    removed = len(items.get("items", [])) - len(kept)
    existing = {x["id"]: x for x in kept}
    for r in records:
        merged = {**existing.get(r["id"], {}), **r}
        drop_local(merged)
        if r["downloadStatus"] != "PDF_SIGNATURE_AND_HASH_VERIFIED":
            for key in ("releaseAsset", "releaseUrl", "releaseTag", "sha256", "fileSizeBytes"):
                merged.pop(key, None)
        existing[r["id"]] = merged
    items["items"] = list(existing.values())
    ok = sum(1 for r in records if r["downloadStatus"] == "PDF_SIGNATURE_AND_HASH_VERIFIED")
    items["extracurricularPdfCount"] = ok
    items["extracurricularPdfFailureCount"] = len(records) - ok
    save(ITEMS_PATH, items)
    save(MANIFEST_PATH, {"sourcePage": PAGE, "checkedAt": checked_at, "provenance": "corpus",
                         "linksFound": len(links), "verified": ok, "failed": len(records) - ok,
                         "duplicatesBySha256": sum(1 for r in records if r.get("duplicateOf")),
                         "staleItemsRemoved": removed,
                         "files": [{"id": r["id"], "title": r["title"], "sourceUrl": r["url"],
                                    "sourceFileName": r["sourceFileName"], "releaseAsset": r.get("releaseAsset"),
                                    "sha256": r.get("sha256"), "fileSizeBytes": r.get("fileSizeBytes"),
                                    "status": r["downloadStatus"], "duplicateOf": r.get("duplicateOf"),
                                    "error": r.get("downloadError")} for r in records]})
    print(f"SUMMARY links={len(links)} verified={ok} failed={len(records) - ok} stale_removed={removed}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
