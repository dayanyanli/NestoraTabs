# NestoraTabs 1.0.0 Manual Chrome Test Checklist

Every item below requires a person to test the real extension in Chrome. Unchecked items are **MANUAL CHECK REQUIRED** and must not be reported as passed.

## Upgrade and persistence

- [ ] Install V0.3 as an unpacked extension.
- [ ] Create representative V0.3 data: multiple groups, reordered websites, collapsed groups, and a saved favicon.
- [ ] Replace the V0.3 runtime files with V1.0 files in the same directory.
- [ ] Open `chrome://extensions/` and click Reload.
- [ ] Confirm the version is 1.0.0 and the name is NestoraTabs.
- [ ] Confirm all V0.3 data, IDs, ordering, collapsed state, names, URLs, and favicon URLs remain intact.
- [ ] Restart Chrome and confirm the configuration persists.

## Current page and window

- [ ] Click the pinned NestoraTabs toolbar icon and confirm the Popup opens reliably without flashing or closing.
- [ ] Open the Popup and confirm the current page title, full URL, and favicon appear.
- [ ] Add the current page to an existing group.
- [ ] Create a new group and add the current page.
- [ ] Add the same page again and confirm it is rejected as a duplicate.
- [ ] Open Save Current Window and confirm valid tabs are selectable.
- [ ] Confirm Chrome internal pages, extension pages, new-tab pages, and invalid URLs are excluded.
- [ ] Use Select All.
- [ ] Use Select None.
- [ ] Save selected tabs to a new group.
- [ ] Add selected tabs to an existing group and confirm duplicates are skipped.

## Context menu and bookmarks

- [ ] Right-click a normal webpage and confirm the NestoraTabs submenu appears.
- [ ] Add a page to an existing group from the context menu.
- [ ] Use the context-menu New Group flow.
- [ ] Rename or add a group and confirm the context submenu updates.
- [ ] Import a Chrome bookmark folder as a new group.
- [ ] Import a bookmark folder into an existing group.
- [ ] Repeat with recursive import enabled and disabled.
- [ ] Confirm invalid and duplicate bookmark URLs are skipped.

## Organization and opening

- [ ] Collapse and expand a group, close the Popup, and confirm the state persists.
- [ ] Drag groups into a new order and confirm persistence.
- [ ] Drag websites into a new order and confirm persistence.
- [ ] Open an individual website.
- [ ] Use Open All and confirm existing tabs are not duplicated.
- [ ] Use Open All in New Tabs and confirm all sites open in the saved order.
- [ ] Copy a group and confirm collision-safe naming.

## Editing, backup, and deletion

- [ ] Manually add a URL without a protocol and confirm `https://` is added.
- [ ] Edit a website name and URL.
- [ ] Delete a website, including the final website in a group.
- [ ] Delete a complete group and verify the confirmation prompt.
- [ ] Export JSON and inspect the downloaded file.
- [ ] Import a V0.1 backup.
- [ ] Import a V0.2 backup.
- [ ] Import a V0.3 backup.
- [ ] Test both Replace and Merge modes.
- [ ] Attempt to import corrupted JSON and confirm the Popup remains usable.

## Release UI and accessibility

- [ ] Check the Popup around 320, 420, and 500 px where possible; confirm no horizontal scrolling.
- [ ] Test long group names, website names, and URLs.
- [ ] Navigate primary controls using Tab and Shift+Tab.
- [ ] Confirm focus indicators are visible.
- [ ] Confirm disabled controls are distinguishable without relying only on color.
- [ ] Confirm the 16 px toolbar icon and 128 px store icon remain clear.
