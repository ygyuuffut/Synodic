#!/usr/bin/env python3
"""Inject SYNODIC into a Twine HTML export."""

from __future__ import annotations

import argparse
import re
import sys
import json
import textwrap
import tomllib
import math
import base64
import hashlib
from pathlib import Path


def module_metadata(asset_dir: Path, module_id: str, entry: dict, core: bool) -> dict:
    """TOML is build-time input; the browser receives only normalized data."""
    with (asset_dir / entry["manifest"]).open("rb") as handle:
        data = tomllib.load(handle).get("mod", {})
    # Accept both [mod] title=... and the supplied [mod] mod.title=... form.
    data = data.get("mod", data)
    api_version = str(data.get("api", {}).get("version", ""))
    requires = str(data.get("lunar", {}).get("api", {}).get("requirement", ""))
    for key in ("title", "author", "description"):
        if not isinstance(data.get(key), str):
            raise ValueError(f"{entry['manifest']}: missing text field {key}")
    if not (api_version or data.get("version")):
        raise ValueError(f"{entry['manifest']}: missing version")
    return dict(id=module_id, core=core, title=data["title"], author=data["author"],
                description=textwrap.dedent(data["description"]).strip(),
                version=str(data.get("version", api_version)), apiVersion=api_version,
                requiresApi=requires)


def watermark_config(asset_dir: Path, manifest: dict) -> dict:
    """Validate build-time presentation settings; never read files on a phone."""
    path = manifest["configuration"]["mainMenuWatermark"]
    with (asset_dir / path).open("rb") as handle:
        data = tomllib.load(handle).get("watermark", {})
    if not isinstance(data, dict):
        raise ValueError(f"{path}: watermark must be a table")
    data = data.get("watermark", data)
    if not isinstance(data, dict) or not isinstance(data.get("font", {}), dict):
        raise ValueError(f"{path}: watermark and watermark.font must be tables")
    text, position = data.get("text"), data.get("position", "bottom left")
    font = data.get("font", {})
    name = font.get("name", "JetBrains Mono")
    if not isinstance(text, str) or not isinstance(name, str) or not name.strip():
        raise ValueError(f"{path}: watermark text and font.name must be strings")
    if position not in ("bottom left", "bottom right", "top left", "top right"):
        raise ValueError(f"{path}: unsupported watermark.position")
    def number(value, field, minimum, maximum=None):
        if (isinstance(value, bool) or not isinstance(value, (int, float))
                or not math.isfinite(value) or value < minimum
                or maximum is not None and value > maximum):
            raise ValueError(f"{path}: invalid watermark.{field}")
        return value
    return dict(text=text, position=position,
                opacity=number(data.get("opacity", 0.5), "opacity", 0, 1),
                font=dict(name=name, weight=number(font.get("weight", 400), "font.weight", 1, 1000),
                          size=number(font.get("size", 18), "font.size", 0.01)))


def installed_modules(asset_dir: Path, manifest: dict, hecate: bool = False) -> list[str]:
    addon = manifest.get("optional", {}).get("hecate", {})
    files = addon.get("modules", []) + addon.get("styles", []) + ([addon["manifest"]] if addon.get("manifest") else [])
    available = ((asset_dir / "hecate").is_dir() and addon.get("modules")
                 and addon.get("manifest") and all((asset_dir / path).is_file() for path in files))
    if hecate and not available:
        print("HECATE MOD unavailable; injecting SYNODIC Core only", file=sys.stderr)
    return ["hecate"] if hecate and available else []


def transition_config(asset_dir: Path, manifest: dict) -> dict:
    with (asset_dir / manifest['configuration']['transitions']).open('rb') as handle:
        data = tomllib.load(handle).get('presentation', {})
    defaults = dict(decision_ms=100, min_loading_ms=150, fade_to_black_ms=50,
                    fade_from_black_ms=50, background_crossfade_ms=200)
    names = ['decisionMs', 'minLoadingMs', 'fadeToBlackMs', 'fadeFromBlackMs', 'backgroundCrossfadeMs']
    result = {}
    for name, (key, default) in zip(names, defaults.items()):
        value = data.get(key, default)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 10000:
            raise ValueError(f'Invalid transition timing: {key}')
        result[name] = value
    return result


def quality_scales(asset_dir: Path, manifest: dict) -> dict:
    """Linear width/height percentages; build-time input, no network work."""
    path = manifest['configuration']['graphicsQuality']
    with (asset_dir / path).open('rb') as handle:
        data = tomllib.load(handle).get('resolution_percent', {})
    names = {'LOW': 'fast', 'MEDIUM': 'standard', 'HIGH': 'fancy', 'ULTRA': 'ultra'}
    if not isinstance(data, dict) or set(data) != set(names.values()):
        raise ValueError(f'{path}: exactly fast, standard, fancy and ultra are required')
    scales = {}
    for profile, name in names.items():
        value = data[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 1 <= value <= 100:
            raise ValueError(f'{path}: invalid resolution_percent.{name} (1–100)')
        scales[profile] = value / 100
    if list(scales.values()) != sorted(scales.values()):
        raise ValueError(f'{path}: resolution percentages must not decrease from Fast to Ultra')
    return scales


def image_variants(asset_dir: Path, manifest: dict) -> dict:
    registry = json.loads((asset_dir / 'lunar/lunar.assets.variants.json').read_text())
    scales = quality_scales(asset_dir, manifest)
    registry['linearScales'] = scales
    for source, row in registry['images'].items():
        if row.get('small') or row.get('unavailable'):
            continue
        width, height = row.get('width'), row.get('height')
        if not isinstance(width, int) or not isinstance(height, int) or width <= 0 or height <= 0:
            raise ValueError(f'Invalid original dimensions: {source}')
        row['variants'] = {profile: f'{source}/v1/fit/w_{max(1, round(width * scale))},h_{max(1, round(height * scale))}/file.webp'
                           for profile, scale in scales.items()}
    return registry


def build_config(asset_dir: Path, manifest: dict) -> dict:
    """One build-time version source, independent of module/API versions."""
    path = manifest["configuration"]["build"]
    with (asset_dir / path).open("rb") as handle:
        data = tomllib.load(handle).get("build", {})
    if not isinstance(data, dict):
        raise ValueError(f"{path}: build must be a table")
    version, revision = data.get("version"), data.get("revision", "")
    legacy = isinstance(version, str) and re.fullmatch(r"b\d+(?:\.\d+){1,2}", version)
    semver = isinstance(version, str) and re.fullmatch(
        r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
        r"(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
        r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?", version)
    valid_semver = bool(semver) and not any(
        part.isdigit() and len(part) > 1 and part.startswith("0")
        for part in (semver[4] or "").split("."))
    if not (legacy or valid_semver):
        raise ValueError(f"{path}: invalid build.version")
    if not isinstance(revision, str) or len(revision) > 80 or any(ord(c) < 32 for c in revision):
        raise ValueError(f"{path}: invalid build.revision")
    return dict(version=version, revision=revision)


def logger_quotes(asset_dir: Path, manifest: dict) -> list[str]:
    """Optional configuration must never prevent a core build."""
    try:
        with (asset_dir / manifest.get("configuration", {}).get("loggerQuotes", "lunar/lunar.logger.quotes.toml")).open("rb") as handle:
            data = tomllib.load(handle)
            crash = data.get("crash")
            quotes = crash.get("quotes", []) if isinstance(crash, dict) else data.get("quotes", [])
        return [q[:500] for q in quotes[:64] if isinstance(q, str) and q.strip()] if isinstance(quotes, list) else []
    except (OSError, ValueError):
        return []


def build_catalog(asset_dir: Path, manifest: dict, installed: list[str]) -> list[dict]:
    core = manifest.get("metadata", {})
    if set(core) != {"lunar", "moonshine"}:
        raise ValueError("SYNODIC Runtime requires both core TOML manifests")
    catalog = ([module_metadata(asset_dir, key, entry, True) for key, entry in core.items()]
               + [module_metadata(asset_dir, key, manifest["optional"][key], False) for key in installed])
    version = next(row["apiVersion"] for row in catalog if row["id"] == "lunar")
    def numeric(text: str) -> tuple[int, int, int]:
        if not re.fullmatch(r"\d+(?:\.\d+){0,2}", text):
            raise ValueError("Invalid numeric SYNODIC API version: " + text)
        parts = [int(p) for p in text.split(".")]
        return tuple(parts + [0] * (3 - len(parts)))
    current = numeric(version)
    for row in catalog:
        requirement = row["requiresApi"]
        if not row["core"] or not requirement:
            continue
        match = re.fullmatch(r"\s*(>=|>|<=|<|=)?\s*(\d+(?:\.\d+){0,2})\s*", requirement)
        if not match:
            raise ValueError("Unsupported Core API requirement: " + requirement)
        target = numeric(match[2])
        valid = {">=": current >= target, ">": current > target, "<=": current <= target,
                 "<": current < target, "=": current == target}[match[1] or "="]
        if not valid:
            raise ValueError("Incompatible Core API requirement: " + row["id"])
    return catalog


def replace_or_insert(text: str, start: str, end: str, block: str, anchor: str) -> str:
    wrapped = f"{start}\n{block.rstrip()}\n{end}"
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    if pattern.search(text):
        return pattern.sub(lambda _match: wrapped, text, count=1)
    index = text.lower().rfind(anchor.lower())
    if index < 0:
        raise ValueError(f"HTML anchor {anchor!r} was not found")
    return text[:index] + wrapped + "\n" + text[index:]


def restore_font_imports(text: str) -> str:
    """Restore the exact resource imports before reinjection/integrity comparison."""
    saved = re.search(r'<script type="application/json" id="LUNAR-font-original-imports">(.*?)</script>', text, re.S)
    if saved:
        for index, rule in enumerate(json.loads(saved[1])):
            token = f"/* SYNODIC-FONT-IMPORT-{index} */"
            if text.count(token) != 1:
                raise ValueError("Font import projection is not reversible")
            text = text.replace(token, rule, 1)
    return text


def font_resources(text: str, asset_dir: Path, manifest: dict) -> str:
    registry = json.loads((asset_dir / manifest['configuration']['fonts']).read_text())
    if registry.get('schema') != 1:
        raise ValueError('Unsupported font resource schema')
    originals = []
    def stylesheet(match):
        def gate(rule):
            if not ('fonts.googleapis.com' in rule[0] and any(f in rule[0] for f in registry['nativeImportFamilies'])):
                return rule[0]
            originals.append(rule[0])
            return f"/* SYNODIC-FONT-IMPORT-{len(originals)-1} */"
        return re.sub(r'@import\s+url\([^)]*\)[^;]*;', gate, match[0], flags=re.I)
    # Only registered unused mobile font imports. No native JS/mechanics/style rewrite.
    text = re.sub(r'<style\b[^>]*>.*?</style>', stylesheet, text, flags=re.S | re.I)
    css,licenses = [],{}
    for row in registry['resources']:
        if row['profiles'] != ['common']:
            raise ValueError('Profile-specific faces need an explicit registration gate')
        encoded = base64.b64encode((asset_dir / row.pop('file')).read_bytes()).decode('ascii')
        css.append('@font-face{font-family:"'+row['family']+'";font-style:normal;font-weight:'+row['weight']+';font-display:swap;src:url(data:font/woff2;base64,'+encoded+') format("woff2");}')
        license_path = row.pop('license')
        licenses[Path(license_path).name] = (asset_dir / license_path).read_text()
    def data(value):
        return json.dumps(value, ensure_ascii=False).replace('<','\\u003c').replace('&','\\u0026')
    block = '<style id="LUNAR-font-resources">'+''.join(css)+'</style>\n<script type="application/json" id="LUNAR-font-manifest">'+data(registry)+'</script>\n<script type="application/json" id="LUNAR-font-original-imports">'+data(originals)+'</script>\n<script type="application/json" id="LUNAR-font-licenses">'+data(licenses)+'</script>'
    return replace_or_insert(text,'<!-- STG-LUNAR-FONT-RESOURCES:START -->','<!-- STG-LUNAR-FONT-RESOURCES:END -->',block,'</head>')


def inject(source: Path, output: Path, asset_dir: Path, hecate: bool = False) -> None:
    text = restore_font_imports(source.read_text(encoding="utf-8"))
    if "<tw-storydata" not in text or 'format="SugarCube"' not in text:
        raise ValueError("input does not look like a SugarCube Twine export")
    # Strip only previous injection blocks; native export remains byte-identical.
    text = re.sub(r"<!-- STG-[A-Z-]+:START -->.*?<!-- STG-[A-Z-]+:END -->\n?", "", text, flags=re.DOTALL)
    native_fingerprint = hashlib.sha256(text.encode("utf-8")).hexdigest()
    declared = re.search(r"window\.STG_VERSION\s*=\s*(['\"])(.*?)\1", text)
    manifest = json.loads((asset_dir / "modules.json").read_text())
    text = font_resources(text, asset_dir, manifest)
    modules, styles = list(manifest["modules"]), list(manifest["styles"])
    # Runtime is one installable core, with two separately owned layers.
    if not all(any(path.startswith(layer + "/") for path in modules)
               for layer in ("lunar", "moonshine")):
        raise ValueError("SYNODIC Runtime requires both LUNAR API and MOONSHINE UI")
    installed = installed_modules(asset_dir, manifest, hecate)
    owners = {}
    for module_id in installed:
        addon = manifest["optional"][module_id]
        modules += addon["modules"]
        styles += addon["styles"]
        owners.update({path: module_id for path in addon["modules"]})
    catalog_rows = build_catalog(asset_dir, manifest, installed)
    catalog = json.dumps(catalog_rows, ensure_ascii=False)
    # Manifest text cannot terminate the JSON script or execute markup.
    catalog = catalog.replace("<", "\\u003c").replace("&", "\\u0026")
    text = replace_or_insert(text, "<!-- STG-LUNAR-MOD-CATALOG:START -->", "<!-- STG-LUNAR-MOD-CATALOG:END -->",
                            '<script type="application/json" id="LUNAR-mod-catalog">' + catalog + '</script>', "</body>")
    build = build_config(asset_dir, manifest)
    transition = json.dumps(transition_config(asset_dir, manifest))
    text = replace_or_insert(text, '<!-- STG-LUNAR-TRANSITION-CONFIG:START -->', '<!-- STG-LUNAR-TRANSITION-CONFIG:END -->',
                            '<script type="application/json" id="LUNAR-transition-config">' + transition + '</script>', '</body>')
    diagnostic = json.dumps(dict(build=build["version"], buildRevision=build["revision"], gameVersion=declared[2] if declared else "unknown",
                                gameFingerprint=native_fingerprint, modules=catalog_rows, quotes=logger_quotes(asset_dir, manifest)), ensure_ascii=False)
    diagnostic = diagnostic.replace("<", "\\u003c").replace("&", "\\u0026")
    text = replace_or_insert(text, "<!-- STG-LUNAR-DIAGNOSTIC-CONFIG:START -->", "<!-- STG-LUNAR-DIAGNOSTIC-CONFIG:END -->",
                            '<script type="application/json" id="LUNAR-diagnostic-config">' + diagnostic + '</script>', "</body>")
    watermark = json.dumps(watermark_config(asset_dir, manifest), ensure_ascii=False)
    watermark = watermark.replace("<", "\\u003c").replace("&", "\\u0026")
    text = replace_or_insert(text, "<!-- STG-LUNAR-MAIN-MENU-WATERMARK:START -->", "<!-- STG-LUNAR-MAIN-MENU-WATERMARK:END -->",
                            '<script type="application/json" id="LUNAR-main-menu-watermark">' + watermark + '</script>', "</body>")
    asset_manifest = json.loads((asset_dir / manifest["configuration"]["assets"]).read_text())
    if asset_manifest.get("schema") != 1 or not asset_manifest["profiles"]["mobile"]["available"]:
        raise ValueError("A complete mobile asset profile is required")
    # One build-time registry: URL literals are inert data, never preload targets.
    asset_manifest['imageVariants'] = image_variants(asset_dir, manifest)
    known = {row["source"] for row in asset_manifest["assets"]}
    for source_url in sorted(set(re.findall(r"https://static\.wixstatic\.com/media/[^\s\"'<>;)]+?\.(?:png|jpe?g|webp)(?:\?[^\s\"'<>;)]*)?", text))):
        if source_url in known:
            continue
        asset_manifest["assets"].append(dict(id="native." + hashlib.sha256(source_url.encode()).hexdigest()[:12], source=source_url,
                                            pack="deferred", critical=False, readiness="decorative", kind="cg", failurePolicy="continue", profiles=dict(mobile=source_url)))
    asset_data = json.dumps(asset_manifest).replace("<", "\\u003c").replace("&", "\\u0026")
    text = replace_or_insert(text, "<!-- STG-LUNAR-ASSET-MANIFEST:START -->", "<!-- STG-LUNAR-ASSET-MANIFEST:END -->",
                            '<script type="application/json" id="LUNAR-asset-manifest">' + asset_data + '</script>', "</body>")
    bootstrap = manifest["bootstrap"]
    shell_css = (asset_dir / bootstrap["style"]).read_text()
    for family, font in zip(("MOONSHINE Loading Mono", "MOONSHINE Loading Moons"), bootstrap["fonts"]):
        encoded = base64.b64encode((asset_dir / font).read_bytes()).decode("ascii")
        shell_css += '@font-face{font-family:"' + family + '";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,' + encoded + ') format("woff2");}\n'
    shell_code = (asset_dir / bootstrap["script"]).read_text()
    licenses = json.dumps({Path(path).name: (asset_dir / path).read_text() for path in bootstrap["licenses"]}).replace("<", "\\u003c").replace("&", "\\u0026")
    shell_block = '<!-- STG-BOOTSTRAP:START -->\n<style id="MOONSHINE-loading-style">' + shell_css + '</style>\n<script>' + shell_code + '</script>\n<script type="application/json" id="MOONSHINE-loading-licenses">' + licenses + '</script>\n<!-- STG-BOOTSTRAP:END -->\n'
    # Preserve charset within HTML's first 1024 bytes and the native viewport.
    early_anchor = re.search(r'<meta\s+name=[\"\']viewport[\"\'][^>]*>', text, re.I)
    if not early_anchor:
        early_anchor = re.search(r'<meta\s+charset=[^>]*>', text, re.I)
    if not early_anchor:
        raise ValueError("A charset declaration is required before the early shell")
    text = text[:early_anchor.end()] + shell_block + text[early_anchor.end():]
    for index, path in enumerate(styles):
        code = (asset_dir / path).read_text(encoding="utf-8")
        marker = re.sub(r"[^A-Z]+", "-", path.upper()).strip("-")
        owner = "HECATE" if path.startswith("hecate/") else "MOONSHINE"
        css_id = owner + ("-source-css" if index == 0 else "-" + Path(path).stem)
        text = replace_or_insert(text, "<!-- STG-" + marker + ":START -->", "<!-- STG-" + marker + ":END -->", f'<style id="{css_id}">\n{code}</style>', "</head>")
    for path in modules:
        code = (asset_dir / path).read_text(encoding="utf-8")
        if path in owners:
            code = 'if (window.LUNAR.bridge.mods.shouldLoad(' + json.dumps(owners[path]) + ')) {\n' + code + '\n}'
        marker = re.sub(r"[^A-Z]+", "-", path.upper()).strip("-")
        text = replace_or_insert(text, "<!-- STG-" + marker + ":START -->", "<!-- STG-" + marker + ":END -->", '<script id="' + Path(path).stem + '">\n' + code + '</script>', "</body>")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(text, encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Add or refresh SYNODIC Runtime (LUNAR API + MOONSHINE UI) in a SugarCube HTML export."
    )
    parser.add_argument("input", type=Path, help="exported Twine/SugarCube HTML")
    parser.add_argument("-o", "--output", type=Path, help="output HTML path (default: SYNODIC/builds/)")
    parser.add_argument("--hecate", action="store_true", help="Include the private HECATE dev MOD if all its files are available")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = args.input.resolve()
    output = args.output.resolve() if args.output else Path(__file__).resolve().parent / "builds" / (source.stem + ".mobile.html")
    if source == output:
        print("error: output must differ from input; keep the original export unchanged", file=sys.stderr)
        return 2
    try:
        inject(source, output, Path(__file__).resolve().parent, hecate=args.hecate)
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
