"""Final package/source integrity, reproducibility and input admission."""
import json
import os
import sys
import tempfile
import tomllib
import zipfile
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from build_release import build_release, sha
from inject_mobile import inject
from prepare_release_catalog import prepare

games = [Path(os.environ.get("STG_RELEASE_PC_INPUT", str(ROOT.parent / "STG 0.2PC.html"))).resolve(),
         Path(os.environ.get("STG_RELEASE_C2_INPUT", str(ROOT.parent / "STG 0.2PC.C2.html"))).resolve()]
release_config = tomllib.loads((ROOT / "release.toml").read_text())["release"]
before = [sha(p.read_bytes()) for p in games]
work = ROOT / "builds"
work.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix="release-unit-", dir=work) as tmp:
    tmp = Path(tmp)
    first = build_release(ROOT, tmp / "first", games)
    second = build_release(ROOT, tmp / "second", games)
    manifest_bytes = (first / "manifest.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    core_name, source_name = manifest["asset_name"], manifest["source"]["asset_name"]
    if (ROOT / "RELEASE_NOTES.md").is_file():
        assert (first / "RELEASE_NOTES.md").read_bytes() == (ROOT / "RELEASE_NOTES.md").read_bytes()
        assert (first / "RELEASE_NOTES.md").read_text().startswith("# SYNODIC Core " + manifest["release_version"] + "\n")
    for name in (core_name, source_name, "manifest.json", "source-inventory.json", "dependencies.json"):
        assert (first / name).read_bytes() == (second / name).read_bytes(), "Nondeterministic: " + name
    assert manifest["channel"] == release_config["channel"] and manifest["release_version"] == release_config["version"]
    assert manifest["license"]["spdx"] == "GPL-3.0-or-later"
    assert [c["id"] for c in manifest["components"]] == ["lunar", "moonshine"]
    assert manifest["source"]["snapshot_sha256"] == sha((first / "source-inventory.json").read_bytes())
    assert manifest["source"]["archive_sha256"] == sha((first / source_name).read_bytes())
    with zipfile.ZipFile(first / core_name) as core:
        assert core.read("manifest.json") == manifest_bytes
        assert set(core.namelist()) == {"manifest.json", *(f["path"] for f in manifest["files"])}
        assert len(core.namelist()) <= 32
        assert core.testzip() is None
        assert sum(row.file_size for row in core.infolist()) <= 24 * 1024**2
        for row in manifest["files"]:
            data = core.read(row["path"])
            assert len(data) == row["size"] and sha(data) == row["sha256"]
        payload = json.loads(core.read("payload.json"))
        assert payload["schema"] == 1 and payload["kind"] == "SYNODIC-compiled-core"
        assert set(payload["blocks"]) == set(payload["head"] + payload["body"] + ["BOOTSTRAP"])
        assert len(payload["blocks"]) <= 256
        assert not any("HECATE" in name for name in payload["blocks"])
        assert not any('id="lunar.api.hecate"' in block or "<tw-storydata" in block for block in payload["blocks"].values())
    with zipfile.ZipFile(first / source_name) as source:
        names = source.namelist()
        assert not any("/hecate/" in n or n.endswith("lunar.api.hecate.cjs") or n.endswith(".html") for n in names)
        assert all(not n.endswith("/") and ".DS_Store" not in n and "__MACOSX" not in n for n in names)
        assert source.testzip() is None
        source.extractall(tmp / "extracted")
    extracted = tmp / "extracted/SYNODIC"
    inventory = json.loads((first / "source-inventory.json").read_bytes())
    for row in inventory["files"]:
        data = (extracted / row["path"]).read_bytes()
        assert data == (ROOT / row["path"]).read_bytes()
        assert len(data) == row["size"] and sha(data) == row["sha256"]
    rebuilt = build_release(extracted, tmp / "rebuilt", games)
    assert (rebuilt / core_name).read_bytes() == (first / core_name).read_bytes(), "Source archive cannot reproduce Core"
    assert (rebuilt / source_name).read_bytes() == (first / source_name).read_bytes(), "Source archive cannot reproduce itself"
    if (extracted / "RELEASE_NOTES.md").is_file():
        (extracted / "RELEASE_NOTES.md").write_text("# SYNODIC Core 0.0.0\n\nStale notes fixture.\n")
        try:
            build_release(extracted, tmp / "stale-notes", games)
            raise AssertionError("Stale release notes were admitted")
        except ValueError as error:
            assert "RELEASE_NOTES.md" in str(error)
            assert not (tmp / "stale-notes").exists()
    for line in (first / "SHA256SUMS.txt").read_text().splitlines():
        digest, name = line.split("  ", 1)
        assert sha((first / name).read_bytes()) == digest
    try:
        build_release(ROOT, tmp / "first", games)
        raise AssertionError("An existing release was overwritten")
    except ValueError as error:
        assert "already exists" in str(error)
    injected = tmp / "injected.html"
    inject(games[0], injected, ROOT)
    for inputs in (games[:1], [injected]):
        try:
            build_release(ROOT, tmp / "rejected", inputs)
            raise AssertionError("Incomplete or injected original input admitted")
        except ValueError:
            assert not (tmp / "rejected").exists()
    changed = tmp / "changed.html"
    changed.write_bytes(games[0].read_bytes() + b"\n<!-- changed -->")
    try:
        build_release(ROOT, tmp / "changed", [changed, games[1]])
        raise AssertionError("Unknown same-version fingerprint admitted")
    except ValueError:
        pass
    # Fake commit is used only in this temporary catalog fixture, never exported.
    index = json.loads(prepare(tmp / "first", "a" * 40).read_bytes())
    entry = index["releases"][0]
    assert entry["manifest_text"].encode() == manifest_bytes
    assert entry["zip_sha256"] == sha((first / core_name).read_bytes())
    assert "/" + "a" * 40 + "/SYNODIC-RELEASE/" + manifest["release_version"] + "/" in entry["zip_url"]
    original_zip = (first / core_name).read_bytes()
    (first / core_name).write_bytes(original_zip + b"changed")
    try:
        prepare(tmp / "first", "a" * 40)
        raise AssertionError("Catalog accepted modified ZIP")
    except ValueError:
        pass
assert before == [sha(p.read_bytes()) for p in games], "Original inputs were modified"
print("PASS Core/manifest/inventory/limits/private exclusions, deterministic ZIPs, corresponding-source rebuild, input rejection, no overwrite and pinned catalog")
