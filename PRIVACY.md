# NestoraTabs Privacy Policy

**Last updated: 2026-10-29**

## What NestoraTabs does

NestoraTabs is a local-first browser workspace manager. It helps users organize websites into groups, save selected browser tabs and bookmark folders, and reopen those websites later.

## Data accessed

Only when the user invokes a related feature, NestoraTabs may process:

- The current page title, full URL, and browser-provided favicon URL
- Titles, URLs, and browser-provided favicon URLs for tabs in the current Chrome window
- Chrome bookmark names, URLs, and folder structure selected for import
- Website groups, ordering, collapsed state, and configuration created by the user

NestoraTabs does not claim that no user data is processed. The data above is processed only to provide the extension features requested by the user.

## How data is used

The accessed data is used only to:

- Display and save the current page
- Save selected tabs as a reusable workspace
- Detect and avoid duplicate tabs or saved URLs
- Reopen saved websites
- Import a user-selected Chrome bookmark folder
- Display, edit, reorder, import, export, and delete local NestoraTabs configuration

The data is not used for advertising, analytics, profiling, credit scoring, or purposes unrelated to NestoraTabs's workspace-management features.

## Local storage

NestoraTabs stores persistent configuration in `chrome.storage.local` inside the user's local Chrome profile. This includes groups, website names and URLs, ordering, collapsed state, IDs, and optional favicon URLs.

NestoraTabs has no developer account system, developer server, or cloud synchronization. JSON export occurs only when the user explicitly chooses Export Configuration.

## External transmission and network behavior

NestoraTabs does not upload tabs, bookmarks, saved websites, groups, or configuration to the developer, an analytics provider, or a cloud-storage service.

NestoraTabs does not call a developer API or third-party favicon service. When NestoraTabs displays a remote favicon URL supplied by Chrome, Chrome may request that image from its original website host. That request is limited to loading the favicon resource; NestoraTabs does not send the user's saved group contents, bookmark list, or configuration with it. If the favicon cannot be loaded, NestoraTabs uses a local fallback icon.

## Analytics, advertising, sale, and sharing

NestoraTabs:

- Does not collect personally identifiable information for the developer
- Does not create user accounts
- Does not track user behavior
- Does not use Google Analytics or third-party analytics
- Does not display advertising
- Does not sell user data
- Does not share user data with the developer, data brokers, advertisers, or analytics providers
- Does not build a browsing-history database
- Does not upload bookmarks or saved websites

## Bookmark access

NestoraTabs reads Chrome bookmark names, URLs, and folder structure only after the user opens the management dialog and chooses to import a bookmark folder. The selected bookmark data is used to create or update a local NestoraTabs group.

## Tab access

NestoraTabs reads tab titles, URLs, and browser-provided favicon URLs when the user opens the Popup, saves the current window, opens a workspace, or uses the page context menu. Tab access is also used to avoid duplicate tabs, create new tabs, and focus an already-open tab.

NestoraTabs does not read page contents or inject scripts into websites.

## User control, retention, and deletion

Configuration remains in `chrome.storage.local` until the user changes or deletes it, imports a replacement configuration, clears the extension's site data through Chrome, or removes the extension subject to Chrome's platform behavior.

Users can:

- Edit or delete individual saved websites
- Delete complete groups
- Replace the current configuration through JSON import
- Export a local JSON backup before deletion
- Remove the extension through Chrome

Deletion performed inside NestoraTabs updates the local configuration. Chrome's exact handling of extension storage after uninstall is controlled by the Chrome platform and should be verified against current Chrome behavior before making an absolute uninstall-retention claim.

## Permissions

- `storage` stores local configuration.
- `tabs` saves windows, detects duplicates, creates tabs, and focuses existing tabs.
- `activeTab` supports user-initiated current-page actions.
- `contextMenus` provides the page right-click menu.
- `bookmarks` reads folders only for a user-initiated bookmark import.

NestoraTabs does not request host permissions.

## Contact

`https://github.com/dayanyanli/NestoraTabs/issues`


## 1.0.1 voluntary support and image clarification

Support appears only after an explicit click. WeChat/Alipay placeholders are packaged locally. The Polygon address is a public receiving address supplied by the maintainer. The extension does not connect a wallet, initiate payments, collect payment information, or log accounts. Any payment performed separately is subject to the selected provider/network, and blockchain transactions are publicly visible.

Browser-provided or imported favicon URLs can load remote images. Their hosts may receive IP address and normal request metadata; imported URLs need not belong to the saved website. Do not import untrusted backups. No browsing or group data is sent to a developer service. No cloud synchronization is provided. Remove the extension to remove its local data, subject to browser behavior; exported backups must be deleted separately.

Contact: repository Issues at the URL above. Do not post secrets, exported backups, account details or personal browsing data in public Issues.
