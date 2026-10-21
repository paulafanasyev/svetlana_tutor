#!/usr/bin/env python3
"""Idempotently add vetted official school-material records and update the source catalog."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "apps/web/src/data/official-russian-school-materials.json"
ITEMS = ROOT / "apps/web/src/data/official-russian-school-material-items.json"
MANIFEST = ROOT / "docs/official-russian-school-materials/updates-2026-10.json"
TODAY = "2026-10-21"

def u(host, path):
    return "https:" + "/" + "/" + host + "/" + path

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")

def main():
    catalog, index = load(CATALOG), load(ITEMS)
    source = {
        "id": "minprosveshcheniya-literary-works-2026",
        "name": "Минпросвещения России — список произведений в федеральных образовательных программах",
        "url": u("docs.edu.gov.ru", "document/9e6ddf2b6267693c0cecdd047768cafa/"),
        "kind": ["official-literature-list", "federal-education-programs", "recommended-reading"],
        "access": "public official document page; downloadable file linked on the page",
        "gradeRange": [1, 11],
        "subjects": ["literature", "literary-reading", "native-literature"],
        "publicationDate": "2026-07-21",
        "lastCheckedAt": TODAY,
        "storesFullTextbooksLocally": False,
        "rightsNote": "Keep official link and metadata; copyright of individual literary works remains separate."
    }
    sources = {x["id"]: x for x in catalog.get("sources", [])}
    if source["id"] not in sources:
        catalog["sources"].append(source)
    elif sources[source["id"]].get("url") != source["url"]:
        raise ValueError("Source ID collision: " + source["id"])

    source_updates = {
        "fipi-ege-demos": {
            "checkedAt": TODAY, "latestProjectEdition": "ЕГЭ и ГВЭ-11 — проекты КИМ 2027 года",
            "latestProjectPublishedAt": "2026-08-28",
            "latestProjectStatus": "VERIFIED_PROJECT_PUBLICATION; final approved 2027 version NOT PROVEN",
            "publicDiscussionDeadline": "2026-09-30",
            "rightsStatus": "LINK_TO_OFFICIAL_SOURCE; do not mirror without confirmed permission"
        },
        "fipi-oge-demos": {
            "checkedAt": TODAY, "latestProjectEdition": "ОГЭ и ГВЭ-9 — проекты КИМ 2027 года",
            "latestProjectPublishedAt": "2026-08-26",
            "latestProjectStatus": "VERIFIED_PROJECT_PUBLICATION; final approved 2027 version NOT PROVEN",
            "publicDiscussionDeadline": "2026-09-30",
            "rightsStatus": "LINK_TO_OFFICIAL_SOURCE; do not mirror without confirmed permission"
        },
        "fipi-ege-methodology": {
            "checkedAt": TODAY,
            "latestEdition": "Методические рекомендации для учителей по результатам ЕГЭ 2026 года",
            "latestEditionPublishedAt": "2026-09-15",
            "latestEditionStatus": "VERIFIED_OFFICIAL_PAGE; subject-specific files linked from the page",
            "rightsStatus": "LINK_TO_SOURCE; do not bulk-copy PDFs without confirmed permission"
        }
    }
    item_by_id = {x["id"]: x for x in index["items"]}
    updated = []
    for item_id, fields in source_updates.items():
        if item_id not in item_by_id:
            raise ValueError("Expected existing FIPI item missing: " + item_id)
        item_by_id[item_id].update(fields)
        updated.append(item_id)

    new_items = [
        {"id":"minprosveshcheniya-literary-works-list-2026","sourceId":source["id"],"title":"Список произведений, включённых в федеральные образовательные программы начального, основного и среднего общего образования","gradeRange":[1,11],"subject":"literature","topic":"Рекомендуемый перечень произведений для школьного литературного образования","kind":["official-list","federal-education-programs","recommended-reading"],"url":source["url"],"checkedAt":TODAY,"publicationDate":"2026-07-21","accessStatus":"PUBLIC_OFFICIAL_DOCUMENT_PAGE; downloadable file linked on source page","rightsStatus":"LINK_ONLY; copyright status of individual literary works remains separate","contentStoredLocally":False,"verificationStatus":"VERIFIED"},
        {"id":"edsoo-literature-teaching-2026-2027","sourceId":"edsoo-subject-materials","title":"ЕДСОО: «Вопросы о важном — литература», материалы к преподаванию в 2026/2027 учебном году","gradeRange":[5,11],"subject":"literature","topic":"Методическое письмо, федеральные рабочие программы и материалы к урокам литературы","kind":["teacher-methodology","federal-working-programs","lesson-materials"],"url":u("edsoo.ru","2026/10/19/voprosy-o-vazhnom-literatura-2/"),"checkedAt":TODAY,"publicationDate":"2026-10-19","accessStatus":"PUBLIC_OFFICIAL_PAGE; linked documents are referenced on the page","rightsStatus":"LINK_ONLY; check terms of each linked file before redistribution","contentStoredLocally":False,"verificationStatus":"VERIFIED"},
        {"id":"edsoo-music-method-webinar-2026","sourceId":"edsoo-subject-materials","title":"ЕДСОО: методический вебинар «Как сделать уроки музыки интересными и результативными?»","gradeRange":[1,8],"subject":"music","topic":"Музицирование и предметные результаты на уроках музыки","kind":["teacher-methodology","webinar-announcement"],"url":u("edsoo.ru","2026/10/19/kak-sdelat-uroki-muzyki-interesnymi-i-rezultativnymi/"),"checkedAt":TODAY,"publicationDate":"2026-10-19","accessStatus":"PUBLIC_ANNOUNCEMENT; webinar date 2026-10-20 passed; recording NOT PROVEN","rightsStatus":"LINK_ONLY; do not copy video or presentation without confirmed permission","contentStoredLocally":False,"verificationStatus":"VERIFIED","recordingStatus":"NOT_PROVEN"},
        {"id":"edsoo-engineering-project-method-seminar-2026","sourceId":"edsoo-subject-materials","title":"ЕДСОО: «От школьной теории к инженерной практике» — семинар по инженерным и агротехнологическим классам","gradeRange":[5,11],"subject":"all-school-subjects","topic":"Проектная деятельность и методические рекомендации для учителей естественно-научных предметов","kind":["teacher-methodology","webinar-announcement","project-learning"],"url":u("edsoo.ru","2026/10/20/ot-shkolnoj-teorii-k-inzhenernoj-praktike/"),"checkedAt":TODAY,"publicationDate":"2026-10-20","accessStatus":"PUBLIC_ANNOUNCEMENT; event scheduled 2026-10-21 14:00 Moscow time; recording NOT PROVEN","rightsStatus":"LINK_ONLY; do not copy video or presentation without confirmed permission","contentStoredLocally":False,"verificationStatus":"VERIFIED","recordingStatus":"NOT_PROVEN"}
    ]
    existing_ids = {x["id"] for x in index["items"]}
    existing_urls = {x.get("url") for x in index["items"]}
    added = []
    for item in new_items:
        if item["id"] in existing_ids:
            continue
        if item["url"] in existing_urls:
            raise ValueError("Refusing duplicate URL: " + item["url"])
        if item["sourceId"] not in {s["id"] for s in catalog["sources"]}:
            raise ValueError("Unknown sourceId: " + item["sourceId"])
        index["items"].append(item)
        existing_ids.add(item["id"])
        existing_urls.add(item["url"])
        added.append(item["id"])

    if len(existing_ids) != len(index["items"]):
        raise ValueError("Duplicate item IDs")
    catalog["lastVerified"] = TODAY
    index["lastVerified"] = TODAY
    save(CATALOG, catalog)
    save(ITEMS, index)
    manifest = {"schemaVersion":1,"checkedAt":TODAY,"status":"MERGED_BY_GITHUB_ACTIONS","addedItemIds":added,"updatedItemIds":updated,"rightsNote":"Only official links and metadata are stored; full copyrighted textbooks are not mirrored."}
    save(MANIFEST, manifest)
    print(json.dumps({"status":"VERIFIED","addedCount":len(added),"addedIds":added,"updatedCount":len(updated),"updatedIds":updated,"totalItemCount":len(index["items"]),"sourceCount":len(catalog["sources"])}, ensure_ascii=False))

if __name__ == "__main__":
    main()
