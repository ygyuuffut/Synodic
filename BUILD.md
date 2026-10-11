# Building a SYNODIC release

Python 3.11 or later and its standard library are sufficient to build the
release. The supplied WOFF2 subsets, SVG icons and image variant registry
are already compiled; packaging does not fetch or rebuild them.

From the workspace containing SYNODIC/ and the original game files:

```sh
python3 SYNODIC/build_release.py --game 'STG 0.2PC.html' --game 'STG 0.2PC.C2.html'
```

The default output is `SYNODIC-RELEASE/<release.version>/`. An existing
version directory is never overwritten. To verify reproducibility, use a
new temporary `--output-root` and compare the archive SHA-256 values.
Read `release.toml` for the exact accepted original-game fingerprints;
both configured inputs must be supplied, and neither is copied into a ZIP.
The file names are examples: a separately retained native C2 fixture is valid
only if its raw SHA-256 exactly matches the configured fingerprint. Do not
recreate a deleted input or pass an injected game to satisfy this requirement.
For an extracted source archive, supply your own matching original files
with absolute paths. `--output-root` can select another local export root.

The builder compiles a synthetic seed with the actual Python injector,
preserves ordered marker contents as payload schema 1, writes one canonical
manifest, and creates deterministic ZIPs with fixed timestamps and ordered
entries. Core includes LUNAR and MOONSHINE together. Corresponding source
includes public modules, configuration, tooling, prebuilt assets, editable
font sources, licenses, documentation and public regression tests. Private
HECATE implementations and its dedicated API are excluded from both ZIPs.

`source-inventory.json` records exact source bytes. Its SHA-256 identifies
the local snapshot even when the checkout has no Git metadata. Pass
`--source-commit <40-hex-commit>` only after confirming that exact public
revision matches the archived inventory. An omitted commit is explicitly
recorded as null; the builder never invents a revision.

After local validation and committing the identical release ZIP/manifest
to the public repository, generate the web catalog with the publication
commit (which can differ from the source commit):

```sh
python3 SYNODIC/prepare_release_catalog.py --publication-commit <40-hex-commit>
```

This writes `SYNODIC-RELEASE/catalog.json`, with commit-pinned raw URLs to
`SYNODIC-RELEASE/<version>/synodic-core-<version>.zip`. THEIA's Sources &
About needs the final public raw catalog URL. No builder publishes, pushes,
creates a GitHub Release or changes THEIA.

Local package acceptance:

```sh
python3 SYNODIC/tests/test_release.py
python3 SYNODIC/tests/test_inject.py
node SYNODIC/tests/test_architecture.cjs
node SYNODIC/tests/test_release_theia.cjs
```

Use Node.js 20 or later for the Node commands above. The THEIA test uses its delivered HTML under file://, imports the actual
release ZIP, and compares each downloaded output with a fresh Python oracle.
It also runs the existing story/actions and retained-history regressions
on those exports. Node tests need Playwright and pngjs; THEIA carries its
own vendored JSZip. Point `NODE_PATH` at installed development dependencies
when necessary. Native inputs and generated gameplay HTML remain external
to release/source archives; generated QA files stay in SYNODIC/builds/.

Optional asset-authoring tools: `build_fonts.py` needs fontTools and Brotli
and an accepted b5 input; `build_map_icons.py` reads local SVG originals;
`build_asset_variants.py` reads bounded public CDN metadata. These tools
are not part of the offline packaging path and are not run automatically.
Existing precompiled assets are pinned by the source inventory.

Current `RELEASE_NOTES.md` is included in corresponding source and copied
verbatim into the version directory. Its first heading must identify the exact
release version; a stale heading fails the build. Core/source ZIP bytes remain
deterministic. Add a game-free `validation.json` after final acceptance and
recompute the outer SHA256SUMS before freezing publication files.

For RC2's shared CG fix, run `test_rc1_cg_theia_live.cjs` with
`SYNODIC_RELEASE_DIR` set to the final package directory and `CG_STAGE` set to
`builds/release-1.0.0-rc2/`. It imports the actual ZIP through THEIA 1.0.1,
checks safe PC/C2 and explicit Force Deck against fresh Python bytes, and runs
the actual Story CG suite. Also run completed Scan and Collected Data on that
Deck export. `STG_RELEASE_PC_INPUT` and `STG_RELEASE_C2_INPUT` override inputs
for release unit/THEIA tests; they do not broaden the fingerprint allowlist.
