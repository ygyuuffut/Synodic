#!/usr/bin/env python3
"""Build public Core/source ZIPs; never include game bytes or private MODs."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import tempfile
import tomllib
import zipfile
import zlib
from pathlib import Path

sys.dont_write_bytecode = True
from inject_mobile import build_catalog, build_config, inject, watermark_config

ROOT = Path(__file__).resolve().parent
EXPORT_ROOT = ROOT.parent / "SYNODIC-RELEASE"
MARKERS = re.compile(r"<!-- STG-([A-Z-]+):START -->\n(.*?)\n<!-- STG-\1:END -->", re.S)
SEED = ('<!doctype html>\n<html><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width"></head><body>'
        '<tw-storydata format="SugarCube"></tw-storydata>'
        '<script>window.STG_VERSION = "SYNODIC_RELEASE_SEED";</script></body></html>')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_bytes(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def inventory(files: dict[str, bytes]) -> list[dict]:
    return [dict(path=name, size=len(data), sha256=sha(data))
            for name, data in sorted(files.items())]


def zip_bytes(files: dict[str, bytes]) -> bytes:
    import io
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED,
                         compresslevel=9, allowZip64=False) as archive:
        for name, data in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(entry, data, compresslevel=9)
    return output.getvalue()


def public_source(root: Path, modules: dict) -> dict[str, bytes]:
    # Runtime follows the authoritative module list; no recursive runtime bundling.
    names = set(modules["modules"] + modules["styles"])
    names.update(modules["configuration"].values())
    names.update(entry["manifest"] for entry in modules["metadata"].values())
    names.update(["modules.json", "lunar/lunar.assets.variants.json"])
    names.update([modules["bootstrap"]["script"], modules["bootstrap"]["style"]])
    names.update(modules["bootstrap"]["fonts"] + modules["bootstrap"]["licenses"])
    names.update(p.name for pattern in ("*.py", "*.md") for p in root.glob(pattern))
    names.update(["release.toml", "COPYING", "THIRD-PARTY-NOTICES.txt", ".gitignore"])
    for folder, suffixes in (("assets", {".woff2", ".ttf", ".txt", ".svg", ".json"}),
                             ("lunar", {".md"}), ("moonshine", {".md"}),
                             ("moonshine-components", {".md"}),
                             ("tests", {".py", ".cjs", ".md"})):
        names.update(p.relative_to(root).as_posix() for p in (root / folder).rglob("*")
                     if p.is_file() and p.suffix in suffixes and "hecate" not in p.name.lower())
    forbidden = set(path for addon in modules.get("optional", {}).values()
                    for path in addon.get("modules", []) + addon.get("styles", [])
                    + ([addon["manifest"]] if addon.get("manifest") else []))
    if any(name in forbidden or name.startswith("hecate/") for name in names):
        raise ValueError("Private MOD implementation selected for public source")
    result = {}
    for name in sorted(names):
        path = root / name
        if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError("Missing/unsafe public source: " + name)
        result[name] = path.read_bytes()
    return result


def compile_payload(root: Path) -> dict:
    work = root / "builds"
    work.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="release-seed-", dir=work) as tmp:
        seed, output = Path(tmp) / "seed.html", Path(tmp) / "compiled.html"
        seed.write_text(SEED, encoding="utf-8")
        inject(seed, output, root)
        text = output.read_text(encoding="utf-8")
    matches = list(MARKERS.finditer(text))
    names = [m[1] for m in matches]
    if len(set(names)) != len(names) or len(names) > 256 or names.count("BOOTSTRAP") != 1:
        raise ValueError("Duplicate/missing/too many injection blocks")
    split = text.lower().index("</head>")
    payload = dict(schema=1, kind="SYNODIC-compiled-core",
                   injectorSha256=sha((root / "inject_mobile.py").read_bytes()),
                   head=[m[1] for m in matches if m.start() < split and m[1] != "BOOTSTRAP"],
                   body=[m[1] for m in matches if m.start() > split],
                   blocks={m[1]: m[2] for m in matches},
                   nativeImportFamilies=json.loads((root / "lunar/lunar.fonts.manifest.json").read_bytes())["nativeImportFamilies"])
    if set(payload["blocks"]) != set(payload["head"] + payload["body"] + ["BOOTSTRAP"]):
        raise ValueError("Unlisted injection block")
    for name, block in payload["blocks"].items():
        if "HECATE" in name or re.search(r'<tw-storydata\b|id=["\'](?:hecate\.|HECATE-|lunar\.api\.hecate)', block, re.I):
            raise ValueError("Private MOD/native game in payload")
    return payload


def validate_games(games: list[dict], inputs: list[Path]) -> list[dict]:
    expected = {(g["version"], h) for g in games for h in g["raw_sha256"]}
    actual = set()
    if not expected or any(not re.fullmatch(r"[a-f0-9]{64}", h) for _, h in expected):
        raise ValueError("Invalid release fingerprints")
    for path in inputs:
        data = path.read_bytes()
        text = data.decode("utf-8")
        script = re.findall(r'<script\b[^>]*\bid=["\']twine-user-script["\'][^>]*>(.*?)</script>', text, re.S | re.I)
        declarations = re.findall(r'window\.STG_VERSION\s*=\s*(["\'])(.*?)\1', script[0]) if len(script) == 1 else []
        if len(declarations) != 1 or re.search(r'<!-- STG-[A-Z-]+:(?:START|END) -->|id=["\'](?:LUNAR-|MOONSHINE-|lunar\.|moonshine\.)', text):
            raise ValueError("Supply an unmodified, un-injected original game: " + str(path))
        pair = (declarations[0][1].removeprefix("v"), sha(data))
        if pair not in expected:
            raise ValueError("Uncertified original game fingerprint: " + str(path))
        actual.add(pair)
    if actual != expected:
        raise ValueError("Supply every configured original-game fingerprint before building")
    return games


def build_release(root: Path, export_root: Path, games: list[Path], source_commit: str | None = None) -> Path:
    config = tomllib.loads((root / "release.toml").read_text(encoding="utf-8"))
    release = config["release"]
    modules = json.loads((root / "modules.json").read_bytes())
    identity = build_config(root, modules)
    version, channel = release["version"], release["channel"]
    if identity["version"] != version or not re.fullmatch(r"\d+\.\d+\.\d+(?:-(?:rc|beta)\.?[1-9]\d*)?", version):
        raise ValueError("Release version and Runtime SemVer must agree")
    expected_channel = "rc" if "-rc" in version else "beta" if "-beta" in version else "stable"
    if channel != expected_channel or release["license"] != "GPL-3.0-or-later":
        raise ValueError("Inconsistent release channel/license")
    if version not in watermark_config(root, modules)["text"]:
        raise ValueError("Watermark must show the public release version")
    if source_commit is not None and not re.fullmatch(r"[a-f0-9]{40}", source_commit):
        raise ValueError("Source commit must be a full lowercase 40-hex revision")
    destination = export_root / version
    if destination.exists():
        raise ValueError("Version directory already exists; never overwrite a release: " + str(destination))
    certified_games = validate_games(config["games"], games)
    catalog = build_catalog(root, modules, [])
    public = public_source(root, modules)
    payload = compile_payload(root)
    font_registry = json.loads(public["lunar/lunar.fonts.manifest.json"])
    font_paths = sorted({r["file"] for r in font_registry["resources"]} | set(modules["bootstrap"]["fonts"]))
    dependencies = dict(schema_version=1, release_version=version,
                        components=catalog, toolchain=dict(packager="Python >=3.11 (standard library)",
                        optional_font_authoring="fontTools + Brotli; prebuilt WOFF2 included",
                        acceptance="Node.js >=20 + Playwright + pngjs; Google Chrome and separate THEIA HTML"),
                        embedded_assets=inventory({p: public[p] for p in font_paths}),
                        license_files=inventory({p: data for p, data in public.items() if p.startswith("assets/") and p.endswith("LICENSE.txt")}),
                        installer=dict(name="THEIA", version="1.0.0", bundled=False,
                                       injection_contract="synodic-python-text-v1"),
                        original_game=dict(bundled=False, games=certified_games),
                        private_mods_included=False)
    dependency_bytes = json_bytes(dependencies)
    source_inventory = json_bytes(dict(schema_version=1, release_version=version, files=inventory(public)))
    core_name, source_name = f"synodic-core-{version}.zip", f"synodic-source-{version}.zip"
    source = dict(public)
    source.update({"source-inventory.json": source_inventory, "dependencies.json": dependency_bytes})
    source_zip = zip_bytes({"SYNODIC/" + name: data for name, data in source.items()})
    core = {"payload.json": json_bytes(payload), "COPYING": public["COPYING"],
            "THIRD-PARTY-NOTICES.txt": public["THIRD-PARTY-NOTICES.txt"], "dependencies.json": dependency_bytes}
    manifest = dict(schema_version=1, kind="synodic-core", release_version=version, channel=channel,
                    asset_name=core_name, injection_contract="synodic-python-text-v1", payload_path="payload.json",
                    games=certified_games, components=[dict(id=c["id"], version=c["version"],
                    api_version=c["apiVersion"], requires_api=c["requiresApi"]) for c in catalog], files=inventory(core),
                    license=dict(spdx=release["license"], file="COPYING", third_party_game_included=False),
                    source=dict(repository="https://github.com/" + release["repository"], commit=source_commit,
                                snapshot_sha256=sha(source_inventory), asset_name=source_name,
                                archive_sha256=sha(source_zip), build_instructions="SYNODIC/BUILD.md"))
    manifest_data = json_bytes(manifest)
    core["manifest.json"] = manifest_data
    core_zip = zip_bytes(core)
    if len(core_zip) > 16 * 1024**2 or sum(map(len, core.values())) > 24 * 1024**2 or len(core) > 32 or len(manifest_data) > 256 * 1024:
        raise ValueError("Core exceeds THEIA limits")
    # No timestamps, absolute input paths or game bytes in public build metadata.
    assets = [core_name, "manifest.json", source_name, "SHA256SUMS.txt", "dependencies.json"]
    release_spec = dict(repository=release["repository"], tag_name="v" + version,
                        name="SYNODIC Core " + version, prerelease=channel != "stable", draft=True,
                        make_latest=False if channel != "stable" else "legacy",
                        body_path="RELEASE_NOTES.md", assets=assets)
    notes = (f"# SYNODIC Core {version}\n\n"
             "手機用 LUNAR API + MOONSHINE UI 成對部署。\n\n"
             "使用 THEIA 1.0.0 匯入 Core ZIP，並選擇受支援的原版 STG 0.2001 HTML。\n"
             "相容性按 manifest.json 的原始 bytes SHA-256 判定；已注入 b5/b6.9 不是安裝輸入。\n\n"
             f"- 安裝包：`{core_name}`\n- 對應源碼：`{source_name}`\n"
             "- 授權：GPL-3.0-or-later；第三方字体／圖標保留各自授權。\n"
             "- 不包含 STG 原版、已注入完整遊戲或私人 HECATE 實作。\n\n"
             "已知限制：跨瀏覽器／Android／iOS／真實 CDN 與長時間使用仍需實機驗收；\n"
             "既有 A35 Error 5 沒有被證實修復。RC 不宣稱上述驗收已完成。\n")
    # Versioned release prose is corresponding source, not an untracked ZIP edit.
    if "RELEASE_NOTES.md" in public:
        notes = public["RELEASE_NOTES.md"].decode("utf-8")
        if not notes.startswith(f"# SYNODIC Core {version}\n"):
            raise ValueError("RELEASE_NOTES.md must identify the current release")
    readme = (f"# SYNODIC {version} release workspace\n\n"
              "此資料夾集中保存該版封包、源碼、依賴、GitHub Release 設定與校驗檔。\n"
              "上傳清單見 github-release.json；該檔是維護者準備資料，不是 GitHub API request body。\n"
              f"本地驗收證據位於 SYNODIC/builds/release-{version}/；不隨公開包交付遊戲。\n\n"
              "尚未發布到 GitHub。此本地 checkout 沒有 Git revision 時，manifest.source.commit\n"
              "為 null，精確來源以 source-inventory.json 及 snapshot_sha256 記錄。公開發布時\n"
              "將這份 corresponding source 存入 repository，記錄 source commit；封包 bytes\n"
              "凍結後只可原樣上傳，不在相同 tag 下替換。\n\n"
              "線上 catalog 在取得包含相同封包的 publication commit 後由\n"
              "SYNODIC/prepare_release_catalog.py 生成；沒有虛構 URL 或假 catalog。\n")
    files = {core_name: core_zip, source_name: source_zip, "manifest.json": manifest_data,
             "dependencies.json": dependency_bytes, "source-inventory.json": source_inventory,
             "COPYING": public["COPYING"], "THIRD-PARTY-NOTICES.txt": public["THIRD-PARTY-NOTICES.txt"],
             "BUILD.md": public["BUILD.md"], "RELEASE_NOTES.md": notes.encode(), "README.md": readme.encode(),
             "github-release.json": json_bytes(release_spec),
             "build-info.json": json_bytes(dict(schema_version=1, identity=identity,
              source_snapshot_sha256=sha(source_inventory), source_commit=source_commit,
              injector_sha256=payload["injectorSha256"], blocks=len(payload["blocks"]),
              toolchain=dict(python=sys.version.split()[0], zlib=zlib.ZLIB_VERSION),
              artifacts=inventory({core_name: core_zip, source_name: source_zip, "manifest.json": manifest_data}),
              validation="See SYNODIC/builds/release-" + version + "/acceptance.json; build is not publication"))}
    files["SHA256SUMS.txt"] = "".join(f"{sha(data)}  {name}\n" for name, data in sorted(files.items())).encode()
    # Finish all computation before committing a complete version directory.
    export_root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".release-", dir=export_root) as tmp:
        staged = Path(tmp) / version
        staged.mkdir()
        for name, data in files.items():
            (staged / name).write_bytes(data)
        staged.rename(destination)
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", type=Path, default=EXPORT_ROOT)
    parser.add_argument("--game", type=Path, action="append", required=True)
    parser.add_argument("--source-commit")
    args = parser.parse_args()
    try:
        print(build_release(ROOT, args.output_root.resolve(), [p.resolve() for p in args.game], args.source_commit))
    except (OSError, ValueError) as error:
        print("error: " + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
