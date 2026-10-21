"""Shared paths for the school-materials sync.

PDFs never go into git: they are written to .cache/school-materials/release/
(gitignored) and uploaded to the GitHub Release RELEASE_TAG by the workflow.
Git keeps only JSON indexes and MANIFESTs (source URL, sha256, size, asset name).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/school-materials"
MANIFESTS = DATA / "manifests"
CACHE = ROOT / ".cache/school-materials"
RELEASE_DIR = CACHE / "release"
RELEASE_TAG = "school-materials-2026-10"
REPO = "paulafanasyev/svetlana_tutor"


def asset_url(name):
    return f"https://github.com/{REPO}/releases/download/{RELEASE_TAG}/{name}"


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def release_fields(name, data_len, sha):
    return {"releaseTag": RELEASE_TAG, "releaseAsset": name, "releaseUrl": asset_url(name),
            "fileSizeBytes": data_len, "sha256": sha,
            "contentStoredLocally": False, "storedInRelease": True}


def drop_local(obj):
    for key in ("localPath", "textPath", "ocrPdfPath"):
        obj.pop(key, None)
