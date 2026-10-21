#!/usr/bin/env python3
"""Fetch the official 2026 federal textbook list (order No. 436) into the release cache.

OCR is optional (RUN_OCR=1). Without it the PDF is image-based and the text layer is
sparse; that is recorded honestly instead of failing or claiming a searchable copy.
"""
from __future__ import annotations
import hashlib, os, subprocess, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent))
from school_materials_common import DATA, MANIFESTS, RELEASE_DIR, load, save, release_fields, drop_local

LANDING = "https://minjust.consultant.ru/documents/60664"
DIRECT_PDF = "https://minjust.consultant.ru/files/60664"
OFFICIAL_NOTICE = "https://edu.gov.ru/press/11911/minprosveshcheniya-rossii-obnovilo-federalnyy-perechen-uchebnikov-dlya-vseh-urovney-shkolnogo-obrazovaniya"
PDF = RELEASE_DIR / "fpu-436-2026.pdf"
OCR_PDF = RELEASE_DIR / "fpu-436-2026-ocr.pdf"
TEXT = RELEASE_DIR / "fpu-436-2026.txt"
MANIFEST = MANIFESTS / "federal-textbook-list-2026.json"
MAX_BYTES = 30 * 1024 * 1024
MIN_CHARS = 100000


def get(url):
    req = Request(url, headers={"User-Agent": "svetlana-tutor-education-catalog/1.0"})
    with urlopen(req, timeout=90) as r:
        data = r.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("download exceeds size limit")
        return data, r.geturl()


def extract(path):
    from pypdf import PdfReader
    reader = PdfReader(str(path), strict=False)
    parts = [f"===== PDF PAGE {i} =====\n{(p.extract_text() or '').strip()}\n" for i, p in enumerate(reader.pages, 1)]
    return len(reader.pages), "\n".join(parts).strip() + "\n"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    url = DIRECT_PDF
    if not (PDF.exists() and PDF.read_bytes().startswith(b"%PDF-")):
        data, url = get(DIRECT_PDF)
        if not data.startswith(b"%PDF-"):
            raise RuntimeError("Direct order No. 436 endpoint did not return a PDF")
        PDF.write_bytes(data)
    pages, text = extract(PDF)
    ocr = None
    if os.environ.get("RUN_OCR") == "1":
        OCR_PDF.unlink(missing_ok=True)
        run = subprocess.run(["ocrmypdf", "--force-ocr", "--language", "rus+eng", "--jobs", "4",
                              "--output-type", "pdf", "--optimize", "0", str(PDF), str(OCR_PDF)],
                             capture_output=True, text=True)
        if run.returncode != 0:
            print("::warning::OCR failed: " + (run.stderr or run.stdout)[-500:].replace("\n", " "))
        else:
            _, text = extract(OCR_PDF)
            ocr = release_fields(OCR_PDF.name, OCR_PDF.stat().st_size, sha(OCR_PDF))
    TEXT.write_text(text, encoding="utf-8")
    searchable = len(text) >= MIN_CHARS
    if not searchable:
        print(f"::warning::Text layer is sparse ({len(text)} chars); the list is NOT searchable without OCR")
    now = time.strftime("%Y-%m-%d", time.gmtime())
    pdf_rel = release_fields(PDF.name, PDF.stat().st_size, sha(PDF))
    text_rel = release_fields(TEXT.name, TEXT.stat().st_size, sha(TEXT))
    status = ("OCR_TEXT_NEEDS_RECHECK" if ocr else "TEXT_LAYER") + ("" if searchable else "_SPARSE")
    manifest = {"title": "Приказ Минпросвещения России от 22.06.2026 № 436 — федеральный перечень учебников",
                "registration": "Зарегистрирован Минюстом России 22.07.2026 № 87563",
                "officialLandingPage": LANDING, "officialAnnouncement": OFFICIAL_NOTICE,
                "resolvedPdfUrl": url, "checkedAt": now, "pages": pages,
                "pdf": pdf_rel, "ocrPdf": ocr, "text": {**text_rel, "characters": len(text), "status": status},
                "note": "Source of truth for the app stays apps/web/src/data/fpu_status.json and textbooks_add.json. "
                        "OCR records are a draft and must be checked against the Consultant pages."}
    save(MANIFEST, manifest)
    items_path = DATA / "official-russian-school-material-items.json"
    items = load(items_path)
    item_id = "federal-textbook-list-2026-full-document"
    old = next((x for x in items.get("items", []) if x.get("id") == item_id), {})
    drop_local(old)
    item = {**old, "id": item_id, "sourceId": "federal-textbook-list-2026",
            "title": "Федеральный перечень учебников — приказ № 436 от 22.06.2026",
            "gradeRange": [1, 11], "subject": "all-school-subjects",
            "kind": ["official-textbook-list", "normative-document"], "url": LANDING,
            "checkedAt": now, "pageCount": pages, "textStatus": status, **pdf_rel,
            "downloadStatus": "PDF_SIGNATURE_AND_HASH_VERIFIED"}
    items["items"] = [x for x in items.get("items", []) if x.get("id") != item_id] + [item]
    save(items_path, items)
    catalog_path = DATA / "official-russian-school-materials.json"
    catalog = load(catalog_path)
    catalog.pop("federalTextbookListLocalCopy", None)
    catalog["federalTextbookListReleaseCopy"] = {"sourceUrl": LANDING, "pages": pages, "textStatus": status,
                                                 "extractedCharacters": len(text), **pdf_rel}
    save(catalog_path, catalog)
    print(f"SUMMARY pages={pages} chars={len(text)} status={status}")


if __name__ == "__main__":
    main()
