# NestoraTabs

A lightweight, privacy-friendly Chrome extension for organizing, saving, and opening tabs and bookmarks.

Permanently free; voluntary support never unlocks or restricts features. Primarily supports Chrome and compatible Chromium browsers. Former local development name: TabNest. Not affiliated with other products using that name.

> **v1.0.1 prerelease:** Baseline application-code provenance has not been fully verified. Its supplied MIT notice is retained, not independent proof of all rights. New icons have documented creation provenance. Main workflows passed actual headless Chromium checks; native context-menu clicks, Chrome toolbar-bubble behavior, physical dragging and in-place upgrades remain unverified. The maintainer expressly authorized this public prerelease with these disclosures. This is not a stable release or a claim of complete copyright clearance.

## Features

Save the current page or eligible current-window tabs; organize, copy, collapse and reorder groups; reorder websites; add via context menus; import Chrome bookmark folders; open groups in bulk; prevent duplicates; force new tabs; import/export JSON; display favicons. Data uses chrome.storage.local.

## Installation

1. Download the extension ZIP from [GitHub Releases](https://github.com/dayanyanli/NestoraTabs/releases). Currently use `nestoratabs-v1.0.1-candidate.zip` under the **Pre-release** label; use an official ZIP once stable releases are available.
2. Extract the ZIP.
3. Open `chrome://extensions`.
4. Enable Developer mode.
5. Click **Load unpacked**.
6. Select the directory containing `manifest.json`.

**Load third-party extensions only when you trust their source and publisher.** Export a JSON backup first. Changing the loaded directory changes the extension ID/storage area. Import your old TabNest backup manually; cross-ID data migration is not automatic.

## Privacy and support

Pages/groups remain in local browser storage. No developer upload, tracking, ads, account requirement or cloud-sync promises. Browser-provided/imported favicon URLs can contact image hosts and expose IP/request metadata. Use JSON backups. See [PRIVACY.md](PRIVACY.md).

Manage → Support developer reveals voluntary support. Local WeChat/Alipay placeholders cannot accept payment. A maintainer-supplied Polygon address is displayed without wallet integration, payment initiation or logs. Verify network, address and asset independently; ownership/payment eligibility has not been verified. Blockchain transactions are public and usually irreversible.

## Screenshots and development

Actual headless Chromium captures using synthetic data: [main](docs/screenshots/main.png), [support](docs/screenshots/support.png). No runtime dependencies or build step. Run all five Node tests/*.test.js suites; see [browser testing](docs/TESTING.md). Issues and Pull Requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), [asset licensing](docs/ASSET_LICENSES.md), and [release audit](RELEASE_AUDIT.md). Original MIT attribution is retained; third-party rights are not relicensed.
