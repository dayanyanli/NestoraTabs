# Testing

The extension itself has no runtime dependencies or build step. Use Node for tests/core.test.js, background.test.js, migration.test.js, security.test.js and popup.test.js. Run node --check on core.js, popup.js, background.js and context-new-group.js.

The optional tests/browser-regression.cjs uses playwright-core and its bundled Chromium in a fresh persistent profile. Make that development-only module available through NODE_PATH (or a separate test workspace), install the matching Chromium, and run node tests/browser-regression.cjs. PLAYWRIGHT_CHROMIUM_EXECUTABLE may select an existing matching Chromium. This writes synthetic browser profiles beside the project, screenshots and docs/BROWSER_CHECK_RESULTS.json; never use a personal browser profile. It does not use branded Chrome's removed extension-loading CLI flags.

The actual run used Chromium 148.0.7778.96 on 2026-10-29. It covers extension/service-worker loading, real dialog/image rendering, group/site UI entry and XSS text, current page/window save, background storage updates, bookmarks, duplicate/force group opening, actual JSON download/file import, favicon rendering and browser restart persistence. Native context-menu dispatch, physical drag gestures, toolbar bubbles and in-place upgrades remain UNKNOWN. See FEATURE_REGRESSION.md.

Packaging: python tools/build_candidate.py. Icon regeneration alone uses Pillow; it is not an extension dependency. Never promote a candidate to release/ without stable-release checks.

Official approach: https://playwright.dev/docs/chrome-extensions
