#!/usr/bin/env python3
"""Download and index official EDSOO extracurricular programme PDFs."""
from __future__ import annotations
import concurrent.futures, hashlib, html, json, re, sys, time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PAGE = "https://edsoo.ru/rabochie-programmy-vd/"
OUT = ROOT / "downloads/federal-extracurricular-programs"
ITEMS_PATH = ROOT / "apps/web/src/data/official-russian-school-material-items.json"
MANIFEST_PATH = OUT / "MANIFEST.json"
MAX_FILES = 100
MAX_FILE_BYTES = 30 * 1024 * 1024
TIMEOUT = 18
WORKERS = 8

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.active = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.active = {"href": attrs["href"], "text": ""}
    def handle_data(self, data):
        if self.active is not None:
            self.active["text"] += data
    def handle_endtag(self, tag):
        if tag == "a" and self.active is not None:
            self.links.append(self.active)
            self.active = None

def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def fetch(url):
    req = Request(url, headers={"User-Agent": "svetlana-tutor-education-catalog/1.0"})
    with urlopen(req, timeout=TIMEOUT) as response:
        data = response.read(MAX_FILE_BYTES + 1)
        if len(data) > MAX_FILE_BYTES:
            raise ValueError(f"file exceeds {MAX_FILE_BYTES} bytes")
        return data, response.headers.get("Content-Type", "")

def safe_name(url):
    name = unquote(Path(urlparse(url).path).name)
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip(".-")
    return name[:160] or "programme.pdf"

def subject_guess(title, filename):
    text = (title + " " + filename).lower()
    tests = [
        (("математ", "чисел"), "mathematics"),
        (("информат", "python", "алгоритм", "искусственн"), "informatics"),
        (("физик",), "physics"), (("хими", "кристалл", "нанохими"), "chemistry"),
        (("биолог", "растени", "эколог"), "biology"),
        (("русск", "текст", "литератур", "словес"), "russian-language"),
        (("истори", "родин", "россия", "отечеств"), "history"),
        (("финансов", "эконом"), "economics"),
        (("профориентац", "горизонт"), "career-guidance"),
        (("музык", "театр", "художеств", "искусств"), "arts"),
    ]
    for words, subject in tests:
        if any(word in text for word in words):
            return subject
    return "all-school-subjects"

def download_one(url, checked_at):
    filename = safe_name(url)
    path = OUT / filename
    title = re.sub(r"[-_]+", " ", Path(filename).stem).strip()
    record_id = "edsoo-vd-" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]
    record = {
        "id": record_id, "sourceId": "edsoo-extracurricular-programs",
        "title": title, "gradeRange": [1, 11],
        "subject": subject_guess(title, filename),
        "topic": "Федеральная рабочая программа внеурочной деятельности; точный класс и предмет требуют проверки по PDF",
        "kind": ["official-extracurricular-program", "federal-working-program"],
        "url": url, "checkedAt": checked_at,
        "accessStatus": "PUBLIC_OFFICIAL_PDF",
        "rightsStatus": "OFFICIAL_SOURCE; redistribution terms not independently established",
        "contentStoredLocally": False, "localPath": str(path.relative_to(ROOT)),
        "metadataCompleteness": "TITLE_FROM_FILENAME; gradeRange_is_catalog_scope_not_verified_document_scope"
    }
    try:
        if path.exists():
            data = path.read_bytes()
        else:
            data, content_type = fetch(url)
            if not data.startswith(b"%PDF-"):
                raise ValueError(f"not a PDF (content-type={content_type})")
            path.write_bytes(data)
        if not data.startswith(b"%PDF-"):
            raise ValueError("local file lacks PDF signature")
        sha = hashlib.sha256(data).hexdigest()
        record.update({"contentStoredLocally": True, "fileSizeBytes": len(data), "sha256": sha,
                       "downloadStatus": "LOCAL_PDF_SIGNATURE_AND_HASH_VERIFIED"})
        status = "VERIFIED"
        print("OK " + filename)
    except Exception as exc:
        record["downloadStatus"] = "DOWNLOAD_FAILED"
        record["downloadError"] = str(exc)[:500]
        status = "FAILED"
        print("FAILED " + filename + ": " + str(exc)[:180])
    entry = {
        "id": record_id, "url": url, "localPath": record["localPath"],
        "status": status, "sha256": record.get("sha256"),
        "fileSizeBytes": record.get("fileSizeBytes"), "error": record.get("downloadError")
    }
    return record, entry

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    page_bytes, _ = fetch(PAGE)
    parser = LinkParser()
    parser.feed(page_bytes.decode("utf-8", errors="replace"))
    urls = []
    for link in parser.links:
        url = urljoin(PAGE, html.unescape(link["href"].strip()))
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.netloc.lower() not in {"edsoo.ru", "www.edsoo.ru"}:
            continue
        if not parsed.path.lower().endswith(".pdf"):
            continue
        if url not in urls:
            urls.append(url)
    urls = urls[:MAX_FILES]
    if not urls:
        raise RuntimeError("No direct EDSOO PDF links discovered; refusing to publish an empty catalogue.")
    checked_at = time.strftime("%Y-%m-%d", time.gmtime())
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        results = list(pool.map(lambda url: download_one(url, checked_at), urls))
    items = read_json(ITEMS_PATH)
    existing = {x["id"]: x for x in items.get("items", [])}
    manifest = {
        "name": "EDSOO federal extracurricular working programmes",
        "sourcePage": PAGE, "checkedAt": checked_at,
        "attempted": len(urls), "verifiedLocalPdfCount": 0, "failedCount": 0, "files": []
    }
    for record, entry in results:
        if entry["status"] == "VERIFIED":
            manifest["verifiedLocalPdfCount"] += 1
        else:
            manifest["failedCount"] += 1
        manifest["files"].append(entry)
        existing[record["id"]] = {**existing.get(record["id"], {}), **record}
    items["items"] = list(existing.values())
    items["schemaVersion"] = max(int(items.get("schemaVersion", 1)), 7)
    items["lastVerified"] = checked_at
    items["extracurricularPdfCount"] = manifest["verifiedLocalPdfCount"]
    items["extracurricularPdfFailureCount"] = manifest["failedCount"]
    write_json(ITEMS_PATH, items)
    write_json(MANIFEST_PATH, manifest)
    lines = [
        "# Федеральные рабочие программы внеурочной деятельности", "",
        f"Источник: {PAGE}", f"Проверено: {checked_at}",
        f"PDF со проверенной сигнатурой: {manifest['verifiedLocalPdfCount']} из {manifest['attempted']}; ошибок: {manifest['failedCount']}.", "",
        "Точный класс и предмет требуют проверки по PDF. Ссылка на официальный источник сохранена в MANIFEST.json.",
        "Локальное наличие не означает автоматически разрешение на повторное распространение.", "",
        "| Файл | Статус | SHA-256 |", "|---|---|---|"
    ]
    for f in manifest["files"]:
        lines.append(f"| {Path(f['localPath']).name} | {f['status']} | {f.get('sha256') or '—'} |")
    (OUT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"attempted": manifest["attempted"], "verified": manifest["verifiedLocalPdfCount"], "failed": manifest["failedCount"]}, ensure_ascii=False))
    if manifest["verifiedLocalPdfCount"] == 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
