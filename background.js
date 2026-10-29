importScripts("core.js");

const STORAGE_KEY = "siteGroups";
const MENU_ROOT = "tab-launcher-root";
const MENU_NEW_GROUP = "tab-launcher-new-group";
const MENU_GROUP_PREFIX = "tab-launcher-group:";
const Core = globalThis.TabLauncherCore;

let menuRebuild = Promise.resolve();

function queueMenuRebuild() {
  menuRebuild = menuRebuild
    .catch(() => undefined)
    .then(rebuildContextMenus)
    .catch(() => undefined);
}

async function getGroups() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return Core.normalizeStoredGroups(result[STORAGE_KEY]);
}

async function rebuildContextMenus() {
  const groups = await getGroups();
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ROOT,
    title: "添加当前网页到 NestoraTabs",
    contexts: ["page"]
  });

  groups.forEach((group) => {
    chrome.contextMenus.create({
      id: `${MENU_GROUP_PREFIX}${group.id}`,
      parentId: MENU_ROOT,
      title: group.name.slice(0, 80),
      contexts: ["page"]
    });
  });

  if (groups.length > 0) {
    chrome.contextMenus.create({
      id: "tab-launcher-separator",
      parentId: MENU_ROOT,
      type: "separator",
      contexts: ["page"]
    });
  }

  chrome.contextMenus.create({
    id: MENU_NEW_GROUP,
    parentId: MENU_ROOT,
    title: "新建分组并添加…",
    contexts: ["page"]
  });
}

async function setBadge(text, color) {
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }).catch(() => undefined), 2200);
}

function pageFromTab(info, tab) {
  return {
    title: tab?.title || "",
    url: tab?.url || info.pageUrl || "",
    faviconUrl: Core.normalizeFaviconUrl(tab?.favIconUrl) || ""
  };
}

async function addPageToGroup(groupId, page) {
  if (!Core.isHttpUrl(page.url)) {
    await setBadge("!", "#b42318");
    return;
  }

  const groups = await getGroups();
  const group = groups.find((item) => item.id === groupId);
  if (!group) {
    await setBadge("!", "#b42318");
    queueMenuRebuild();
    return;
  }

  const result = Core.addUniqueSites(group.sites, [page], true);
  if (result.addedSites.length === 0) {
    await setBadge("已", "#68736c");
    return;
  }

  group.sites = result.sites;
  await chrome.storage.local.set({ [STORAGE_KEY]: groups });
  await setBadge("✓", "#216e4e");
}

async function openNewGroupPage(page) {
  if (!Core.isHttpUrl(page.url)) {
    await setBadge("!", "#b42318");
    return;
  }
  const params = new URLSearchParams({
    title: page.title,
    url: page.url,
    faviconUrl: page.faviconUrl
  });
  await chrome.tabs.create({
    url: chrome.runtime.getURL(`context-new-group.html?${params.toString()}`)
  });
}

chrome.runtime.onInstalled.addListener(queueMenuRebuild);
chrome.runtime.onStartup.addListener(queueMenuRebuild);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[STORAGE_KEY]) queueMenuRebuild();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuId = String(info.menuItemId);
  const page = pageFromTab(info, tab);
  if (menuId === MENU_NEW_GROUP) {
    openNewGroupPage(page).catch(() => setBadge("!", "#b42318"));
  } else if (menuId.startsWith(MENU_GROUP_PREFIX)) {
    addPageToGroup(menuId.slice(MENU_GROUP_PREFIX.length), page)
      .catch(() => setBadge("!", "#b42318"));
  }
});

queueMenuRebuild();
