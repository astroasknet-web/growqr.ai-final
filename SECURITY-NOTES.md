# Dependency security notes

Last reviewed 2026-10-11. `npm audit` reports 0 vulnerabilities.

| Advisory | Package | Severity | Fix |
|---|---|---|---|
| GHSA-1241331 (librsvg, CVE-2026-96889) | `sharp` | high | Upgraded 0.35.4 to **0.35.5** (`npm audit fix`). |
| GHSA-68fv-2mgg-jv7q (source-map DoS) | `source-map-js` | high | Upgraded 1.2.1 to **1.2.2** (`npm audit fix`). |
| GHSA-rj75-hqrm-r3gf (selector parsing CPU exhaustion) | `postcss-selector-parser` | moderate | Pinned to **7.1.6** with an `overrides` entry (tailwindcss 3 asks for ^6, which has no fix). |
| GHSA-vfj7-8cjw-p6xm (stack exhaustion on nested patterns) | `braces` | high | **No upstream fix exists** (latest 3.0.3 is vulnerable). Patched locally, see below. |

## braces: local patch

`vendor/braces-3.0.4.tgz` is braces 3.0.3 plus one change in `lib/parse.js`: a SyntaxError when brace nesting passes 64 levels. The source of the tarball is `vendor/braces/` (with `README-GROWQR.md`).

It is installed through `package.json`:

```json
"devDependencies": { "braces": "file:./vendor/braces-3.0.4.tgz" },
"overrides": { "braces": "$braces" }
```

`braces` is used only at build time (tailwindcss, chokidar, micromatch) and never ships in the running site, so the real-world exposure was already low. The patch removes it and clears the audit.

`lib/security/dependency-patches.test.ts` fails if an unpatched copy ever comes back.

**When upstream publishes a fixed braces:** delete `vendor/`, the `braces` devDependency and the `braces` override, then `npm install`.

**To rebuild the tarball** after editing `vendor/braces`: `cd vendor && npm pack ./braces`, then `npm install`.
