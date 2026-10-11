#!/usr/bin/env python3
"""Prepare a pinned web catalog from existing, unchanged release artifacts."""
import argparse
import json
import re
import sys
from pathlib import Path

from build_release import EXPORT_ROOT, json_bytes, sha


def prepare(export_root: Path, commit: str, prefix: str = "SYNODIC-RELEASE") -> Path:
    if not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("Use the full publication commit that contains the identical ZIP and manifest")
    if not re.fullmatch(r"[A-Za-z0-9_/-]+", prefix) or any(p in ("", ".", "..") for p in prefix.split("/")):
        raise ValueError("Invalid repository publication path")
    entries, repositories = [], set()
    for path in sorted(export_root.glob("*/manifest.json")):
        manifest_text = path.read_text(encoding="utf-8")
        manifest = json.loads(manifest_text)
        spec = json.loads((path.parent / "github-release.json").read_bytes())
        repositories.add(spec["repository"])
        version, name = manifest["release_version"], manifest["asset_name"]
        if path.parent.name != version or spec["tag_name"] != "v" + version or name != f"synodic-core-{version}.zip":
            raise ValueError("Inconsistent release identity")
        import zipfile
        with zipfile.ZipFile(path.parent / name) as archive:
            if archive.read("manifest.json") != path.read_bytes():
                raise ValueError("Inner/external manifest differ")
        checksum_rows = dict(line.split("  ", 1)[::-1] for line in (path.parent / "SHA256SUMS.txt").read_text().splitlines())
        digest = sha((path.parent / name).read_bytes())
        if checksum_rows.get(name) != digest:
            raise ValueError("Core ZIP changed after packaging")
        entries.append(dict(tag=spec["tag_name"], manifest_text=manifest_text, zip_sha256=digest,
                            zip_url=f"https://raw.githubusercontent.com/{spec['repository']}/{commit}/{prefix}/{version}/{name}"))
    if len(repositories) != 1 or not entries:
        raise ValueError("Expected at least one release from a single repository")
    result = export_root / "catalog.json"
    result.write_bytes(json_bytes(dict(schema_version=1, repository=repositories.pop(), releases=entries)))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--publication-commit", required=True)
    parser.add_argument("--output-root", type=Path, default=EXPORT_ROOT)
    parser.add_argument("--repository-prefix", default="SYNODIC-RELEASE")
    args = parser.parse_args()
    try:
        print(prepare(args.output_root.resolve(), args.publication_commit, args.repository_prefix))
    except (OSError, ValueError, KeyError) as error:
        print("error: " + str(error), file=sys.stderr)
        sys.exit(1)
