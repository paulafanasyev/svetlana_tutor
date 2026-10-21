#!/usr/bin/env python3
"""Fetch and archive the official 2026 federal textbook-list legal act."""
from __future__ import annotations
import hashlib, html, json, re, time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
LANDING = "https://minjust.consultant.ru/documents/60664"
OFFICIAL_NOTICE = "https://edu.gov.ru/press/11911/minprosveshcheniya-rossii-obnovilo-federalnyy-perechen-uchebnikov-dlya-vseh-urovney-shkolnogo-obrazovaniya"
OUT = ROOT / "downloads/federal-textbook-list-2026"
PDF_PATH = OUT / "federal-textbook-list-order-436-2026.pdf"
TEXT_PATH = OUT / "federal-textbook-list-order-436-2026.txt"
MANIFEST_PATH = OUT / "MANIFEST.json"
MAX_BYTES = 30 * 1024 * 1024

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.active=None
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=="a" and attrs.get("href"):
            self.active={"href":attrs["href"],"text":""}
    def handle_data(self, data):
        if self.active is not None: self.active["text"] += data
    def handle_endtag(self, tag):
        if tag=="a" and self.active is not None:
            self.links.append(self.active); self.active=None

def get(url):
    req=Request(url,headers={"User-Agent":"svetlana-tutor-education-catalog/1.0"})
    with urlopen(req,timeout=60) as response:
        data=response.read(MAX_BYTES+1)
        if len(data)>MAX_BYTES: raise ValueError("download exceeds size limit")
        return data,response.geturl(),response.headers.get("Content-Type","")

def write_json(path,obj):
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    page,final_url,ctype=get(LANDING)
    pdf_data=None; pdf_url=None
    if page.startswith(b"%PDF-") or "application/pdf" in ctype.lower():
        pdf_data,pdf_url=page,final_url
    else:
        parser=Links(); parser.feed(page.decode("utf-8",errors="replace"))
        candidates=[]
        for a in parser.links:
            url=urljoin(final_url,html.unescape(a["href"].strip()))
            p=urlparse(url)
            if p.scheme!="https" or p.netloc.lower() not in {"minjust.consultant.ru","www.minjust.consultant.ru"}:
                continue
            label=(a["text"]+" "+p.path).lower()
            if ".pdf" in p.path.lower() or "pdf" in label or "скачать" in label:
                candidates.append(url)
        # Try explicit PDF candidates first, then the official landing endpoint.
        for url in list(dict.fromkeys(candidates+[LANDING])):
            try:
                data,actual_url,content_type=get(url)
                if data.startswith(b"%PDF-") or "application/pdf" in content_type.lower():
                    if not data.startswith(b"%PDF-"):
                        raise ValueError("PDF content type without PDF signature")
                    pdf_data,pdf_url=data,actual_url
                    break
            except Exception:
                continue
    if not pdf_data or not pdf_data.startswith(b"%PDF-"):
        raise RuntimeError("Could not retrieve the official textbook-list PDF from the Minjust landing page.")
    PDF_PATH.write_bytes(pdf_data)
    reader=PdfReader(str(PDF_PATH),strict=False)
    pages=[]
    for number,page in enumerate(reader.pages,1):
        text=page.extract_text() or ""
        pages.append(f"===== PDF PAGE {number} =====\n{text.strip()}\n")
    extracted="\n".join(pages).strip()+"\n"
    TEXT_PATH.write_text(extracted,encoding="utf-8")
    sha=hashlib.sha256(pdf_data).hexdigest()
    manifest={
        "title":"Приказ Минпросвещения России от 22.06.2026 № 436 — федеральный перечень учебников",
        "registration":"Зарегистрирован Минюстом России 22.07.2026 № 87563",
        "officialLandingPage":LANDING,"officialAnnouncement":OFFICIAL_NOTICE,"resolvedPdfUrl":pdf_url,
        "checkedAt":time.strftime("%Y-%m-%d",time.gmtime()),
        "pdf":{"path":str(PDF_PATH.relative_to(ROOT)),"bytes":len(pdf_data),"pages":len(reader.pages),"sha256":sha,"signature":"%PDF-"},
        "text":{"path":str(TEXT_PATH.relative_to(ROOT)),"characters":len(extracted),"extractionLibrary":"pypdf"},
        "rightsStatus":"OFFICIAL_NORMATIVE_LEGAL_ACT; preserve source attribution; not a substitute for individual textbook files",
        "note":"The PDF and extracted text are the federal textbook-list document. They are not full copies of each listed textbook."
    }
    write_json(MANIFEST_PATH,manifest)
    # Add one provenance record for the full legal list; individual textbooks remain separate records.
    items_path = ROOT / "apps/web/src/data/official-russian-school-material-items.json"
    items_obj = json.loads(items_path.read_text(encoding="utf-8"))
    item_id = "federal-textbook-list-2026-full-document"
    item = {
        "id": item_id, "sourceId": "federal-textbook-list-2026",
        "title": "Федеральный перечень учебников — полный текст приказа № 436 от 22.06.2026",
        "gradeRange": [1, 11], "subject": "all-school-subjects",
        "topic": "Полный официальный перечень допущенных учебников",
        "kind": ["official-textbook-list", "normative-document", "full-text-extraction"],
        "url": LANDING, "checkedAt": manifest["checkedAt"],
        "accessStatus": "LOCAL_OFFICIAL_PDF_AND_TEXT_VERIFIED",
        "rightsStatus": "OFFICIAL_NORMATIVE_LEGAL_ACT; individual textbook contents are not included",
        "contentStoredLocally": True, "localPath": manifest["pdf"]["path"],
        "textPath": manifest["text"]["path"], "pageCount": manifest["pdf"]["pages"],
        "fileSizeBytes": manifest["pdf"]["bytes"], "sha256": manifest["pdf"]["sha256"],
        "downloadStatus": "LOCAL_PDF_SIGNATURE_AND_HASH_VERIFIED"
    }
    existing_items = items_obj.setdefault("items", [])
    existing_items[:] = [x for x in existing_items if x.get("id") != item_id]
    existing_items.append(item)
    items_obj["schemaVersion"] = max(int(items_obj.get("schemaVersion", 1)), 8)
    items_obj["lastVerified"] = manifest["checkedAt"]
    items_path.write_text(json.dumps(items_obj, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    catalog_path = ROOT / "apps/web/src/data/official-russian-school-materials.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    catalog["federalTextbookListLocalCopy"] = {
        "status": "VERIFIED", "sourceUrl": LANDING,
        "pdfPath": manifest["pdf"]["path"], "textPath": manifest["text"]["path"],
        "pages": manifest["pdf"]["pages"], "sha256": manifest["pdf"]["sha256"],
        "note": "Contains the federal list, not the full contents of every listed textbook."
    }
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    print(json.dumps({"pdfPages":len(reader.pages),"pdfBytes":len(pdf_data),"sha256":sha,"extractedCharacters":len(extracted)},ensure_ascii=False))

if __name__=="__main__":
    main()
