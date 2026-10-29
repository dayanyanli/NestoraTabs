# NestoraTabs 1.0.1 security audit

Date: 2026-10-29. Scope: current public snapshot and allowlisted package. Status: PUBLIC PRERELEASE AUTHORIZED WITH DISCLOSED RISKS. No claim of complete copyright clearance or complete manual testing.

| Item | Status | Evidence / limit |
|---|---|---|
| Secret/token/personal-user-path scan | PASS within heuristic scope | No matching secrets or personal-user paths in the selected public files; sensitive values are never printed. Maintainer-supplied public Polygon address is intentional |
| User data/test history | PASS | No data/, uploads/, profiles, exported backups or personal browsing data packaged; tests and screenshots use synthetic fixtures |
| Manifest permissions | PASS for no additions; UNKNOWN for strict minimality | Same activeTab/bookmarks/contextMenus/storage/tabs; no host_permissions. activeTab may overlap tabs metadata access and remains a documented follow-up |
| Remote code / eval | PASS static checks | Only packaged scripts/importScripts, self-only CSP; no eval/new Function/remote scripts or injected HTML sinks |
| Unnecessary upload / telemetry | PASS static checks | No fetch/XHR/WebSocket/analytics integration. Existing remote favicon image requests remain and are disclosed |
| JSON import | PASS tested controls | 2 MiB gate, parse/shape/name/URL/protocol/duplicate validation, error handling; bad input does not write storage in tests |
| Pathological import performance | UNKNOWN | No explicit per-field/count/depth cap beyond popup size limit; browser adversarial stress not claimed |
| DOM XSS | PASS within static/tested scope | textContent rendering, safe URL allowlist; actual malicious title rendered as literal text, no injected element; no innerHTML/outerHTML/document.write sinks found |
| Favicon privacy | KNOWN RESIDUAL | Imported HTTP(S) favicon URLs may contact arbitrary image hosts and expose IP/request metadata; data-image rendering retained. Do not import untrusted backups |
| MV3 | PASS for actual Chromium loading/service worker | Full branded Chrome lifecycle/manual behavior not claimed |
| Image/font/dependency rights | New assets documented; baseline code UNKNOWN | New icon excludes old artwork. No bundled fonts/runtime dependencies. Original MIT attribution retained; baseline code provenance still unverified |
| Git history | PASS for public snapshot construction | Fresh public repository excludes previous private history and old icon blobs; only selected current files staged |
| Sponsorship | PASS static/UI behavior | Explicit click only; local non-payable placeholders; no wallet connection, payment API, private keys or payment logs; no new grants |
| Provider / Web Store approval | UNKNOWN | Receiving-account eligibility, checksum/ownership/asset compatibility and official store review unverified; see docs/SPONSORSHIP_POLICY.md |

The user expressly authorized a public free prerelease after disclosure of remaining provenance and manual-test uncertainties. That authorization does not create third-party rights. Resolve provenance and remaining manual checks before declaring a fully verified stable release. No absolute security or legal guarantee is made.

Official references: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3 and https://developer.chrome.com/docs/webstore/program-policies/policies .
