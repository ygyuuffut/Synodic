#!/usr/bin/env python3
"""Extract/reinject translatable text from a Twine/SugarCube HTML export.

The game keeps most prose in JavaScript string literals rather than in
<tw-passagedata>.  This tool catalogs both without evaluating game code.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


SCRIPT_RE = re.compile(
    r'(<script\b[^>]*\bid=["\']twine-user-script["\'][^>]*>)(.*?)(</script>)',
    re.IGNORECASE | re.DOTALL,
)
PASSAGE_RE = re.compile(
    r'(<tw-passagedata\b(?P<attrs>[^>]*)>)(?P<body>.*?)(</tw-passagedata>)',
    re.IGNORECASE | re.DOTALL,
)
ATTR_RE = re.compile(r'\b([\w-]+)=["\'](.*?)["\']', re.DOTALL)
WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ\u00C0-\u024F\u4e00-\u9fff]{2,}")


@dataclass
class JsString:
    start: int
    end: int
    quote: str
    raw: str
    value: str
    line: int


def decode_js(raw: str) -> str:
    """Decode the useful subset of JavaScript string escapes."""
    out: list[str] = []
    i = 0
    simple = {
        "n": "\n", "r": "\r", "t": "\t", "b": "\b", "f": "\f",
        "v": "\v", "0": "\0", "\\": "\\", "'": "'", '"': '"',
        "/": "/",
    }
    while i < len(raw):
        char = raw[i]
        if char != "\\":
            out.append(char)
            i += 1
            continue
        i += 1
        if i >= len(raw):
            out.append("\\")
            break
        esc = raw[i]
        if esc in "\r\n":
            if esc == "\r" and i + 1 < len(raw) and raw[i + 1] == "\n":
                i += 1
            i += 1
            continue
        if esc in simple:
            out.append(simple[esc])
            i += 1
            continue
        if esc == "x" and i + 2 < len(raw):
            try:
                out.append(chr(int(raw[i + 1:i + 3], 16)))
                i += 3
                continue
            except ValueError:
                pass
        if esc == "u":
            if i + 1 < len(raw) and raw[i + 1] == "{":
                close = raw.find("}", i + 2)
                if close >= 0:
                    try:
                        out.append(chr(int(raw[i + 2:close], 16)))
                        i = close + 1
                        continue
                    except ValueError:
                        pass
            elif i + 4 < len(raw):
                try:
                    out.append(chr(int(raw[i + 1:i + 5], 16)))
                    i += 5
                    continue
                except ValueError:
                    pass
        # JavaScript treats many unknown escapes as the escaped character.
        out.append(esc)
        i += 1
    decoded = "".join(out)
    # JavaScript commonly spells emoji as two UTF-16 \uXXXX escapes.
    # Combine those surrogate code units before UTF-8 JSON serialization.
    normalized: list[str] = []
    i = 0
    while i < len(decoded):
        code = ord(decoded[i])
        if 0xD800 <= code <= 0xDBFF and i + 1 < len(decoded):
            low = ord(decoded[i + 1])
            if 0xDC00 <= low <= 0xDFFF:
                normalized.append(chr(0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00)))
                i += 2
                continue
        normalized.append(decoded[i])
        i += 1
    return "".join(normalized)


def encode_js(value: str, quote: str) -> str:
    value = value.replace("\\", "\\\\")
    value = value.replace(quote, "\\" + quote)
    value = value.replace("\r", "\\r").replace("\n", "\\n")
    value = value.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    # Prevent translated prose from accidentally terminating the script tag.
    value = re.sub(r"</", r"<\\/", value)
    return quote + value + quote


def scan_js_strings(source: str) -> list[JsString]:
    """Lex JavaScript comments and quoted strings without executing it."""
    found: list[JsString] = []
    i = 0
    line = 1
    while i < len(source):
        char = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""
        if char == "\n":
            line += 1
            i += 1
            continue
        if char == "/" and nxt == "/":
            end = source.find("\n", i + 2)
            i = len(source) if end < 0 else end
            continue
        if char == "/" and nxt == "*":
            end = source.find("*/", i + 2)
            if end < 0:
                break
            line += source.count("\n", i, end + 2)
            i = end + 2
            continue
        if char == "`":
            # The current game uses concatenated quote strings for prose.
            # Skip template literals conservatively rather than risk editing
            # an interpolation expression.
            i += 1
            while i < len(source):
                if source[i] == "\\":
                    i += 2
                elif source[i] == "`":
                    i += 1
                    break
                else:
                    if source[i] == "\n":
                        line += 1
                    i += 1
            continue
        if char not in ("'", '"'):
            i += 1
            continue
        quote = char
        start = i
        start_line = line
        i += 1
        raw_start = i
        while i < len(source):
            if source[i] == "\\":
                if i + 1 < len(source) and source[i + 1] == "\n":
                    line += 1
                elif i + 2 < len(source) and source[i + 1:i + 3] == "\r\n":
                    line += 1
                i += 2
                continue
            if source[i] == quote:
                raw = source[raw_start:i]
                found.append(JsString(start, i + 1, quote, raw, decode_js(raw), start_line))
                i += 1
                break
            if source[i] == "\n":
                # Invalid unescaped newline: abandon this candidate.
                line += 1
                i += 1
                break
            i += 1
    return found


def visible_words(value: str) -> list[str]:
    plain = re.sub(r"<[^>]*>", " ", value)
    plain = html.unescape(plain)
    return WORD_RE.findall(plain)


def is_candidate(value: str, min_words: int) -> bool:
    stripped = value.strip()
    if len(stripped) < 3 or len(stripped) > 12000:
        return False
    if re.match(r"^(?:https?:|data:|blob:|file:)", stripped, re.I):
        return False
    if not visible_words(value) or len(visible_words(value)) < min_words:
        return False
    if "<" not in value and re.search(r"\b(?:linear-gradient|radial-gradient|translate|rgba?)\(", value):
        return False
    if "<" not in value and value.count(";") >= 2 and value.count(":") >= 2:
        return False
    return True


def context_at(source: str, start: int, end: int, width: int = 100) -> str:
    text = source[max(0, start - width):min(len(source), end + width)]
    return re.sub(r"\s+", " ", text).strip()


def stable_js_entries(script: str, min_words: int) -> list[dict]:
    occurrences: defaultdict[str, int] = defaultdict(int)
    entries: list[dict] = []
    for token in scan_js_strings(script):
        digest = hashlib.sha1(token.value.encode("utf-8")).hexdigest()[:14]
        occurrences[digest] += 1
        if not is_candidate(token.value, min_words):
            continue
        entries.append({
            "id": f"js:{digest}:{occurrences[digest]}",
            "kind": "javascript",
            "line": token.line,
            "original": token.value,
            "translation": "",
            "context": context_at(script, token.start, token.end),
        })
    return entries


def passage_entries(document: str, min_words: int) -> list[dict]:
    entries: list[dict] = []
    for match in PASSAGE_RE.finditer(document):
        attrs = dict(ATTR_RE.findall(match.group("attrs")))
        decoded = html.unescape(match.group("body"))
        if not is_candidate(decoded, min_words):
            continue
        entries.append({
            "id": f"passage:{attrs.get('pid', '?')}",
            "kind": "passage",
            "name": attrs.get("name", ""),
            "original": decoded,
            "translation": "",
            "context": f"Twine passage: {attrs.get('name', '')}",
        })
    return entries


def extract_catalog(source_path: Path, output_path: Path, min_words: int) -> None:
    document = source_path.read_text(encoding="utf-8")
    script_match = SCRIPT_RE.search(document)
    if not script_match:
        raise ValueError("twine-user-script was not found")
    script = script_match.group(2)
    entries = passage_entries(document, min_words) + stable_js_entries(script, min_words)
    catalog = {
        "format": "stg-story-translation-v1",
        "source_file": source_path.name,
        "source_script_sha256": hashlib.sha256(script.encode("utf-8")).hexdigest(),
        "instructions": (
            "Fill translation only. Preserve HTML tags, {{placeholders}}, % tokens, "
            "and SugarCube/JavaScript fragments inside the text. Do not edit id/original."
        ),
        "entries": entries,
    }
    output_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"extracted {len(entries)} entries -> {output_path}")


def apply_catalog(source_path: Path, catalog_path: Path, output_path: Path) -> None:
    document = source_path.read_text(encoding="utf-8")
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    if catalog.get("format") != "stg-story-translation-v1":
        raise ValueError("unsupported catalog format")
    translations = {
        item["id"]: item
        for item in catalog.get("entries", [])
        if isinstance(item.get("translation"), str) and item["translation"].strip()
    }

    # Passage replacements are keyed by pid and preserve the surrounding tag.
    def replace_passage(match: re.Match[str]) -> str:
        attrs = dict(ATTR_RE.findall(match.group("attrs")))
        item = translations.get(f"passage:{attrs.get('pid', '?')}")
        if not item:
            return match.group(0)
        current = html.unescape(match.group("body"))
        if current != item.get("original"):
            raise ValueError(f"passage {attrs.get('pid')} no longer matches catalog original")
        encoded = html.escape(item["translation"], quote=False)
        return match.group(1) + encoded + match.group(4)

    document = PASSAGE_RE.sub(replace_passage, document)
    script_match = SCRIPT_RE.search(document)
    if not script_match:
        raise ValueError("twine-user-script was not found")
    script = script_match.group(2)
    occurrences: defaultdict[str, int] = defaultdict(int)
    replacements: list[tuple[int, int, str]] = []
    applied_ids: set[str] = set()
    for token in scan_js_strings(script):
        digest = hashlib.sha1(token.value.encode("utf-8")).hexdigest()[:14]
        occurrences[digest] += 1
        entry_id = f"js:{digest}:{occurrences[digest]}"
        item = translations.get(entry_id)
        if not item:
            continue
        if token.value != item.get("original"):
            raise ValueError(f"{entry_id} no longer matches catalog original")
        replacements.append((token.start, token.end, encode_js(item["translation"], token.quote)))
        applied_ids.add(entry_id)
    for start, end, replacement in reversed(replacements):
        script = script[:start] + replacement + script[end:]
    document = document[:script_match.start(2)] + script + document[script_match.end(2):]
    output_path.write_text(document, encoding="utf-8")
    passage_count = sum(1 for key in translations if key.startswith("passage:"))
    missing = sorted(key for key in translations if key.startswith("js:") and key not in applied_ids)
    if missing:
        raise ValueError(f"{len(missing)} translated JavaScript entries were not found; output was written but should not be used")
    print(f"applied {len(replacements) + passage_count} translations -> {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    extract = sub.add_parser("extract", help="create a JSON translation catalog")
    extract.add_argument("html", type=Path)
    extract.add_argument("-o", "--output", type=Path, required=True)
    extract.add_argument("--min-words", type=int, default=3, help="minimum visible words per entry (default: 3)")
    apply_cmd = sub.add_parser("apply", help="apply filled translation fields")
    apply_cmd.add_argument("html", type=Path)
    apply_cmd.add_argument("catalog", type=Path)
    apply_cmd.add_argument("-o", "--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.command == "extract":
            extract_catalog(args.html.resolve(), args.output.resolve(), max(1, args.min_words))
        else:
            source = args.html.resolve()
            output = args.output.resolve()
            if source == output:
                raise ValueError("output must differ from input")
            apply_catalog(source, args.catalog.resolve(), output)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
