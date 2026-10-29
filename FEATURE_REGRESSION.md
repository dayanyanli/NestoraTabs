# NestoraTabs 1.0.1 prerelease regression

Date: 2026-10-29. Five Node suites PASS: core, background, migration, security, popup. Four runtime JS files pass node --check. Source changes preserve storage schema and feature scope; pendingUrl duplicate detection is strengthened.

Actual headless Chromium 148.0.7778.96: MV3 loading, support opt-in/local images/Escape, group and site UI entry, literal malicious-title rendering without HTML execution, current-page save and deduplication, eligible current-window saving, service-worker add handler with real storage, actual bookmark creation/import, duplicate/forced tab opening, JSON download and file import, favicon rendering and restart persistence all PASS. No uncaught popup errors. Full result: docs/BROWSER_CHECK_RESULTS.json. Browser script: tests/browser-regression.cjs.

| Required feature | Evidence | Status |
|---|---|---|
| Save current webpage | Actual Chromium handler/storage | PASS |
| Group management | Actual UI create/editable site, core copy/merge tests | PASS within tested flows |
| Save current window | Actual UI, eligible tabs | PASS |
| Right-click quick add | Actual service-worker handler/storage and mocked event dispatch | PASS for handler; native menu click UNKNOWN |
| Import Chrome bookmarks | Actual bookmarks API and UI | PASS |
| Sort sites/groups | Core moveById tests and unchanged drag handlers | PASS for logic; physical drag UNKNOWN |
| Bulk open | Actual tabs API | PASS |
| Prevent duplicate saves/opens | Actual Chromium and Node tests, including pending navigation | PASS |
| Force new tabs | Actual tabs API | PASS |
| JSON import/export | Actual file input/download and malformed import; Node size/schema tests | PASS |
| Favicon | Actual image rendering, normalization/fallback source checks | PASS within tested inputs |
| Local storage | Actual Chrome API and Chromium restart, migration tests | PASS |
| Branded Chrome toolbar bubble | Not exercised | UNKNOWN |
| In-place V1.0.0 upgrade in same path | Not exercised; different IDs require JSON import | UNKNOWN |

Screenshots use synthetic test data at 420×600; no personal browser profile. The earlier Windows Computer Use attempt stopped because its URL could not be verified; later independent Playwright/bundled Chromium checks succeeded. Neither is misrepresented as full branded Chrome/manual coverage. Remaining checks are disclosed in the prerelease. The maintainer explicitly approved public prerelease with these limitations; stable release remains pending.
