# NestoraTabs Permission Audit

NestoraTabs 1.0.1 requests only the following Chrome permissions. No data accessed through these permissions is uploaded to the developer or to an analytics service.

## `storage`

- **Why it is needed:** Saves groups, websites, ordering, collapsed state, and optional favicon URLs in `chrome.storage.local`.
- **When it is used:** Whenever the user creates, edits, reorders, imports, exports, or deletes configuration.
- **User data accessed:** NestoraTabs configuration only.
- **Uploaded:** No.

## `tabs`

- **Why it is needed:** Reads tabs in the current window, checks all open tabs for duplicate URLs, creates tabs, and focuses an already-open tab.
- **When it is used:** Save Current Window, Open All, Open All in New Tabs, and opening an individual website.
- **User data accessed:** Tab title, URL, and browser-provided favicon URL when the user invokes the related feature.
- **Uploaded:** No.

## `activeTab`

- **Why it is needed:** Supports user-initiated actions on the current active page.
- **When it is used:** Displaying and saving the current page.
- **User data accessed:** Current page title, URL, and browser-provided favicon URL.
- **Uploaded:** No.

## `contextMenus`

- **Why it is needed:** Creates “Add current page to NestoraTabs” and its group submenu.
- **When it is used:** Only when the user opens or selects the NestoraTabs page context menu.
- **User data accessed:** The selected page title, URL, and browser-provided favicon URL after the user chooses an action.
- **Uploaded:** No.

## `bookmarks`

- **Why it is needed:** Reads Chrome bookmark folders for the explicit “Import from Chrome bookmarks” action.
- **When it is used:** Only after the user opens the management dialog and starts a bookmark-folder import.
- **User data accessed:** The selected folder structure, bookmark names, and bookmark URLs.
- **Uploaded:** No.

## Permissions deliberately not requested

NestoraTabs does not request `host_permissions`, `<all_urls>`, `scripting`, `webRequest`, `cookies`, `history`, or `downloads`. It does not inspect page contents, inject scripts, intercept traffic, read cookies, query browsing history, or download files through the Chrome downloads API.

## Favicon network note

NestoraTabs does not use a developer API or third-party favicon service. When the Popup displays a remote favicon URL supplied by Chrome, Chrome may request that image from its original website host. NestoraTabs does not attach the user's saved group contents, bookmark list, or configuration to that image request.

## Candidate qualification

No new permission was introduced. The existing activeTab grant may overlap tabs for metadata access; minimum-privilege necessity is UNKNOWN and must be verified in Chrome before changing it. Support needs no browser permissions.
