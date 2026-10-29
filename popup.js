const STORAGE_KEY = "siteGroups";
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const Core = globalThis.TabLauncherCore;

const state = {
  groups: [],
  currentPage: null,
  windowTabs: [],
  windowAutoSkipped: 0,
  bookmarkFolders: new Map(),
  editingGroupId: null,
  editingSiteId: null,
  siteGroupId: null,
  pendingImportGroups: null,
  drag: null,
  toastTimer: null
};

const elements = {
  groupsList: document.querySelector("#groups-list"),
  groupCount: document.querySelector("#group-count"),
  createGroupButton: document.querySelector("#create-group-button"),
  saveWindowButton: document.querySelector("#save-window-button"),
  manageButton: document.querySelector("#manage-button"),
  currentPageTitle: document.querySelector("#current-page-title"),
  currentPageUrl: document.querySelector("#current-page-url"),
  currentPageIcon: document.querySelector("#current-page-icon"),
  currentPageStatus: document.querySelector("#current-page-status"),
  addCurrentPageButton: document.querySelector("#add-current-page-button"),
  emptyTemplate: document.querySelector("#empty-state-template"),
  groupTemplate: document.querySelector("#group-template"),
  siteTemplate: document.querySelector("#site-template"),
  groupDialog: document.querySelector("#group-dialog"),
  groupDialogTitle: document.querySelector("#group-dialog-title"),
  groupForm: document.querySelector("#group-form"),
  groupNameInput: document.querySelector("#group-name-input"),
  groupError: document.querySelector("#group-error"),
  siteDialog: document.querySelector("#site-dialog"),
  siteDialogTitle: document.querySelector("#site-dialog-title"),
  siteForm: document.querySelector("#site-form"),
  siteNameInput: document.querySelector("#site-name-input"),
  siteUrlInput: document.querySelector("#site-url-input"),
  siteError: document.querySelector("#site-error"),
  manageDialog: document.querySelector("#manage-dialog"),
  exportButton: document.querySelector("#export-button"),
  importButton: document.querySelector("#import-button"),
  importFileInput: document.querySelector("#import-file-input"),
  manageError: document.querySelector("#manage-error"),
  importModeDialog: document.querySelector("#import-mode-dialog"),
  importSummary: document.querySelector("#import-summary"),
  addCurrentDialog: document.querySelector("#add-current-dialog"),
  currentDestinationList: document.querySelector("#current-destination-list"),
  currentNewGroupName: document.querySelector("#current-new-group-name"),
  currentNewGroupButton: document.querySelector("#current-new-group-button"),
  currentAddError: document.querySelector("#current-add-error"),
  windowDialog: document.querySelector("#window-dialog"),
  windowSelectionSummary: document.querySelector("#window-selection-summary"),
  tabSelectionList: document.querySelector("#tab-selection-list"),
  selectAllTabs: document.querySelector("#select-all-tabs"),
  selectNoTabs: document.querySelector("#select-no-tabs"),
  windowTargetSelect: document.querySelector("#window-target-select"),
  windowNewGroupWrap: document.querySelector("#window-new-group-wrap"),
  windowNewGroupName: document.querySelector("#window-new-group-name"),
  windowError: document.querySelector("#window-error"),
  saveSelectedTabsButton: document.querySelector("#save-selected-tabs-button"),
  bookmarkImportButton: document.querySelector("#bookmark-import-button"),
  bookmarkDialog: document.querySelector("#bookmark-dialog"),
  bookmarkFolderSelect: document.querySelector("#bookmark-folder-select"),
  bookmarkRecursive: document.querySelector("#bookmark-recursive"),
  bookmarkTargetMode: document.querySelector("#bookmark-target-mode"),
  bookmarkExistingWrap: document.querySelector("#bookmark-existing-wrap"),
  bookmarkExistingGroup: document.querySelector("#bookmark-existing-group"),
  bookmarkError: document.querySelector("#bookmark-error"),
  bookmarkConfirmButton: document.querySelector("#bookmark-confirm-button"),
  toast: document.querySelector("#toast")
};

async function loadGroups() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const rawGroups = result[STORAGE_KEY];
    state.groups = Core.normalizeStoredGroups(rawGroups);
    render();

    if (Array.isArray(rawGroups) && JSON.stringify(rawGroups) !== JSON.stringify(state.groups)) {
      await saveGroups();
    }
  } catch {
    state.groups = [];
    render();
    showToast("本地配置异常，已使用空配置打开");
  }
}

async function loadCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error("没有活动标签页");
    state.currentPage = {
      title: (tab.title || "").trim() || Core.getDisplayName(tab.url || ""),
      url: tab.url || "",
      faviconUrl: tab.favIconUrl || ""
    };
    elements.currentPageTitle.textContent = state.currentPage.title;
    elements.currentPageUrl.textContent = state.currentPage.url;
    const isSupported = Core.isHttpUrl(state.currentPage.url);
    elements.addCurrentPageButton.disabled = !isSupported;
    elements.currentPageStatus.textContent = isSupported ? "" : "此页面不可添加";
    setSiteIcon(
      elements.currentPageIcon,
      state.currentPage.faviconUrl,
      getSiteInitial(state.currentPage.title, state.currentPage.url)
    );
  } catch {
    state.currentPage = null;
    elements.currentPageTitle.textContent = "无法读取当前网页";
    elements.currentPageUrl.textContent = "";
    elements.currentPageStatus.textContent = "";
    elements.addCurrentPageButton.disabled = true;
  }
}

async function saveGroups() {
  await chrome.storage.local.set({ [STORAGE_KEY]: state.groups });
}

function render() {
  closeAllMenus();
  elements.groupsList.replaceChildren();
  elements.groupCount.textContent = `${state.groups.length} 个分组`;

  if (state.groups.length === 0) {
    elements.groupsList.append(elements.emptyTemplate.content.cloneNode(true));
    return;
  }

  state.groups.forEach((group) => {
    const fragment = elements.groupTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".group-card");
    const sitesList = fragment.querySelector(".sites-list");
    const openButton = fragment.querySelector(".open-group-button");
    const forceOpenButton = fragment.querySelector(".force-open-button");
    const collapseButton = fragment.querySelector(".collapse-button");

    card.dataset.groupId = group.id;
    card.classList.toggle("is-collapsed", group.collapsed);
    fragment.querySelector(".group-name").textContent = group.name;
    fragment.querySelector(".site-count").textContent = `${group.sites.length} 个网站`;
    openButton.disabled = group.sites.length === 0;
    forceOpenButton.disabled = group.sites.length === 0;
    collapseButton.setAttribute("aria-expanded", String(!group.collapsed));
    collapseButton.setAttribute("aria-label", group.collapsed ? "展开分组" : "收起分组");

    group.sites.forEach((site) => {
      sitesList.append(createSiteRow(group.id, site));
    });

    elements.groupsList.append(fragment);
  });
}

function createSiteRow(groupId, site) {
  const fragment = elements.siteTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".site-row");
  row.dataset.groupId = groupId;
  row.dataset.siteId = site.id;
  fragment.querySelector(".site-name").textContent = site.name;
  fragment.querySelector(".site-url").textContent = getCompactUrl(site.url);
  setSiteIcon(
    fragment.querySelector(".site-avatar"),
    site.faviconUrl,
    getSiteInitial(site.name, site.url)
  );
  return fragment;
}

function setSiteIcon(container, faviconUrl, fallbackText) {
  container.textContent = fallbackText;
  const safeFaviconUrl = Core.normalizeFaviconUrl(faviconUrl);
  if (!safeFaviconUrl) return;
  const image = document.createElement("img");
  image.src = safeFaviconUrl;
  image.alt = "";
  image.addEventListener("error", () => {
    container.textContent = fallbackText;
  }, { once: true });
  container.replaceChildren(image);
}

function getSiteInitial(name, url) {
  const candidate = name.trim() || Core.getDisplayName(url);
  return Array.from(candidate)[0] || "•";
}

function getCompactUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname || parsed.protocol.replace(":", "")}${path}${parsed.search}`;
  } catch {
    return url;
  }
}

function findGroup(groupId) {
  return state.groups.find((group) => group.id === groupId);
}

function openGroupDialog(groupId = null) {
  state.editingGroupId = groupId;
  const group = groupId ? findGroup(groupId) : null;
  elements.groupDialogTitle.textContent = group ? "修改分组名称" : "创建分组";
  elements.groupNameInput.value = group?.name || "";
  elements.groupError.textContent = "";
  elements.groupDialog.showModal();
  elements.groupNameInput.focus();
  elements.groupNameInput.select();
}

function openSiteDialog(groupId, siteId = null) {
  const group = findGroup(groupId);
  if (!group) return;

  const site = siteId ? group.sites.find((item) => item.id === siteId) : null;
  state.siteGroupId = groupId;
  state.editingSiteId = siteId;
  elements.siteDialogTitle.textContent = site ? "编辑网站" : "添加网站";
  elements.siteNameInput.value = site?.name || "";
  elements.siteUrlInput.value = site?.url || "";
  elements.siteError.textContent = "";
  elements.siteDialog.showModal();
  elements.siteNameInput.focus();
}

async function handleGroupSubmit(event) {
  event.preventDefault();
  const name = elements.groupNameInput.value.trim();
  if (!name) {
    elements.groupError.textContent = "请输入分组名称";
    return;
  }

  const wasEditing = Boolean(state.editingGroupId);
  if (wasEditing) {
    const group = findGroup(state.editingGroupId);
    if (group) group.name = name;
  } else {
    state.groups.push({
      id: Core.createId("group"),
      name,
      collapsed: false,
      sites: []
    });
  }

  await saveGroups();
  elements.groupDialog.close();
  render();
  showToast(wasEditing ? "分组名称已更新" : "分组已创建");
}

async function handleSiteSubmit(event) {
  event.preventDefault();
  const name = elements.siteNameInput.value.trim();
  if (!name) {
    elements.siteError.textContent = "请输入网站名称";
    return;
  }

  let url;
  try {
    url = Core.prepareUrl(elements.siteUrlInput.value);
  } catch (error) {
    elements.siteError.textContent = error.message;
    return;
  }

  const group = findGroup(state.siteGroupId);
  if (!group) return;

  const duplicate = group.sites.find(
    (site) => site.id !== state.editingSiteId && Core.normalizeUrl(site.url) === Core.normalizeUrl(url)
  );
  if (duplicate) {
    elements.siteError.textContent = `该网址已存在于本分组：${duplicate.name}`;
    return;
  }

  const wasEditing = Boolean(state.editingSiteId);
  if (wasEditing) {
    const site = group.sites.find((item) => item.id === state.editingSiteId);
    if (site) {
      const urlChanged = Core.normalizeUrl(site.url) !== Core.normalizeUrl(url);
      Object.assign(site, { name, url });
      if (urlChanged) delete site.faviconUrl;
    }
  } else {
    group.sites.push({ id: Core.createId("site"), name, url });
  }

  await saveGroups();
  elements.siteDialog.close();
  render();
  showToast(wasEditing ? "网站已更新" : "网站已添加");
}

async function getOpenTabMap() {
  const tabs = await chrome.tabs.query({});
  const map = new Map();
  tabs.forEach((tab) => {
    const url = tab.pendingUrl || tab.url;
    if (url) map.set(Core.normalizeUrl(url), tab);
  });
  return map;
}

async function focusTab(tab) {
  if (typeof tab.windowId === "number") {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  if (typeof tab.id === "number") {
    await chrome.tabs.update(tab.id, { active: true });
  }
}

async function openSingleSite(url) {
  const openTabs = await getOpenTabMap();
  const existingTab = openTabs.get(Core.normalizeUrl(url));
  if (existingTab) {
    showToast("网站已经打开，已切换到对应标签页");
    await focusTab(existingTab);
    return;
  }
  await chrome.tabs.create({ url, active: true });
}

async function openWholeGroup(group, forceNew = false) {
  const openTabs = forceNew ? new Map() : await getOpenTabMap();
  const plan = Core.planGroupOpen(group.sites, [...openTabs.keys()], forceNew);
  const urlsToOpen = plan.urls;
  const skippedCount = plan.skippedCount;

  if (urlsToOpen.length === 0) {
    showToast("这个分组中的网站都已经打开");
    return;
  }

  let openedCount = 0;
  let failedCount = 0;
  let firstCreatedTab = null;

  for (const url of urlsToOpen) {
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      if (!firstCreatedTab) firstCreatedTab = tab;
      openedCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  const parts = [`已按顺序打开 ${openedCount} 个网站`];
  if (skippedCount > 0) parts.push(`跳过 ${skippedCount} 个已打开或重复网站`);
  if (failedCount > 0) parts.push(`${failedCount} 个无法打开`);
  showToast(parts.join("，"));

  if (firstCreatedTab) await focusTab(firstCreatedTab);
}

function renderCurrentDestinations() {
  elements.currentDestinationList.replaceChildren();
  state.groups.forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "destination-button";
    button.dataset.currentGroupId = group.id;
    button.textContent = `${group.name}（${group.sites.length}）`;
    elements.currentDestinationList.append(button);
  });
  if (state.groups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "manage-intro";
    empty.textContent = "还没有已有分组，请在下方新建一个分组。";
    elements.currentDestinationList.append(empty);
  }
}

function openCurrentPageDialog() {
  if (!state.currentPage || !Core.isHttpUrl(state.currentPage.url)) return;
  elements.currentAddError.textContent = "";
  elements.currentNewGroupName.value = "";
  renderCurrentDestinations();
  elements.addCurrentDialog.showModal();
}

async function addCurrentPageToGroup(groupId) {
  const group = findGroup(groupId);
  if (!group || !state.currentPage) return;
  const result = Core.addUniqueSites(group.sites, [state.currentPage], true);
  if (result.addedSites.length === 0) {
    elements.currentAddError.textContent = "该网页已经存在于此分组。";
    return;
  }
  group.sites = result.sites;
  await saveGroups();
  elements.addCurrentDialog.close();
  render();
  showToast(`已添加到“${group.name}”`);
}

async function addCurrentPageToNewGroup() {
  elements.currentAddError.textContent = "";
  const name = elements.currentNewGroupName.value.trim();
  if (!name) {
    elements.currentAddError.textContent = "请输入新分组名称";
    return;
  }
  if (!state.currentPage) return;
  const site = Core.createSiteCandidate(state.currentPage, true);
  state.groups.push({
    id: Core.createId("group"),
    name,
    collapsed: false,
    sites: [site]
  });
  await saveGroups();
  elements.addCurrentDialog.close();
  render();
  showToast(`已创建“${name}”并添加网页`);
}

function populateGroupSelect(select, includeNew = false) {
  select.replaceChildren();
  if (includeNew) {
    const newOption = document.createElement("option");
    newOption.value = "__new__";
    newOption.textContent = "保存为新分组";
    select.append(newOption);
  }
  state.groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = `添加到：${group.name}`;
    select.append(option);
  });
}

function updateWindowSelectionSummary() {
  const selectedCount = state.windowTabs.filter((item) => item.selectable && item.selected).length;
  const selectableCount = state.windowTabs.filter((item) => item.selectable).length;
  elements.windowSelectionSummary.textContent = `已选择 ${selectedCount}/${selectableCount}`;
}

function renderWindowTabList() {
  elements.tabSelectionList.replaceChildren();
  state.windowTabs.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = `tab-check-row${item.selectable ? "" : " is-excluded"}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.selected;
    checkbox.disabled = !item.selectable;
    checkbox.dataset.windowTabIndex = String(index);
    const copy = document.createElement("span");
    copy.className = "tab-check-copy";
    const title = document.createElement("strong");
    title.textContent = item.title || Core.getDisplayName(item.url);
    const url = document.createElement("small");
    url.textContent = item.selectable ? item.url : `${item.url || "无 URL"} · ${item.reason}`;
    copy.append(title, url);
    label.append(checkbox, copy);
    elements.tabSelectionList.append(label);
  });
  updateWindowSelectionSummary();
}

async function saveCurrentWindow() {
  elements.saveWindowButton.disabled = true;
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const prepared = Core.prepareWindowTabs(tabs);
    state.windowTabs = prepared.items;
    state.windowAutoSkipped = prepared.autoSkipped;

    populateGroupSelect(elements.windowTargetSelect, true);
    const now = new Date();
    elements.windowNewGroupName.value = `窗口 ${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    elements.windowNewGroupWrap.hidden = false;
    elements.windowError.textContent = "";
    renderWindowTabList();
    elements.windowDialog.showModal();
  } catch {
    showToast("无法读取当前窗口，请重试");
  } finally {
    elements.saveWindowButton.disabled = false;
  }
}

async function saveSelectedWindowTabs() {
  elements.windowError.textContent = "";
  const candidates = state.windowTabs
    .filter((item) => item.selectable && item.selected)
    .map((item) => ({
      name: item.title,
      url: item.url,
      faviconUrl: item.faviconUrl
    }));
  if (candidates.length === 0) {
    elements.windowError.textContent = "请至少选择一个网页";
    return;
  }

  const target = elements.windowTargetSelect.value;
  let result;
  if (target === "__new__") {
    const name = elements.windowNewGroupName.value.trim();
    if (!name) {
      elements.windowError.textContent = "请输入新分组名称";
      return;
    }
    result = Core.addUniqueSites([], candidates, true);
    state.groups.push({
      id: Core.createId("group"),
      name,
      collapsed: false,
      sites: result.sites
    });
  } else {
    const group = findGroup(target);
    if (!group) {
      elements.windowError.textContent = "目标分组不存在，请重新选择";
      return;
    }
    result = Core.addUniqueSites(group.sites, candidates, true);
    group.sites = result.sites;
  }

  await saveGroups();
  elements.windowDialog.close();
  render();
  const skipped = state.windowAutoSkipped + result.duplicateCount + result.invalidCount;
  showToast(`已添加 ${result.addedSites.length} 个网页，跳过 ${skipped} 个重复或无效网页`);
}

async function toggleGroupCollapsed(groupId) {
  const group = findGroup(groupId);
  if (!group) return;
  group.collapsed = !group.collapsed;
  await saveGroups();
  render();
}

async function duplicateGroup(groupId) {
  const group = findGroup(groupId);
  if (!group) return;
  const copy = Core.duplicateGroup(group, state.groups);
  const sourceIndex = state.groups.findIndex((item) => item.id === groupId);
  state.groups.splice(sourceIndex + 1, 0, copy);
  await saveGroups();
  render();
  showToast(`已创建“${copy.name}”`);
}

async function deleteGroup(groupId) {
  const group = findGroup(groupId);
  if (!group || !confirm(`确定删除分组“${group.name}”吗？`)) return;
  state.groups = state.groups.filter((item) => item.id !== groupId);
  await saveGroups();
  render();
  showToast("分组已删除");
}

async function deleteSite(groupId, siteId) {
  const group = findGroup(groupId);
  const site = group?.sites.find((item) => item.id === siteId);
  if (!group || !site || !confirm(`确定删除“${site.name}”吗？`)) return;
  group.sites = group.sites.filter((item) => item.id !== siteId);
  await saveGroups();
  render();
  showToast("网站已删除");
}

function exportConfiguration() {
  const content = JSON.stringify(Core.createExportObject(state.groups), null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `nestoratabs-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(objectUrl);
  showToast("配置已导出");
}

async function handleImportFile(event) {
  elements.manageError.textContent = "";
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    elements.manageError.textContent = "文件过大，配置文件不能超过 2 MB";
    return;
  }

  try {
    const text = await file.text();
    state.pendingImportGroups = Core.parseImportText(text);
    const siteCount = state.pendingImportGroups.reduce((total, group) => total + group.sites.length, 0);
    elements.importSummary.textContent = `已验证 ${state.pendingImportGroups.length} 个分组、${siteCount} 个网站。请选择如何导入。`;
    elements.manageDialog.close();
    elements.importModeDialog.showModal();
  } catch (error) {
    elements.manageError.textContent = error.message || "无法读取配置文件";
  }
}

async function applyImport(mode) {
  if (!state.pendingImportGroups) return;

  try {
    if (mode === "replace") {
      state.groups = state.pendingImportGroups;
    } else if (mode === "merge") {
      state.groups = Core.mergeGroups(state.groups, state.pendingImportGroups);
    } else {
      return;
    }
    await saveGroups();
    const importedCount = state.pendingImportGroups.length;
    state.pendingImportGroups = null;
    elements.importModeDialog.close();
    render();
    showToast(`已导入 ${importedCount} 个分组`);
  } catch {
    showToast("导入保存失败，当前配置未更改");
    await loadGroups();
  }
}

function flattenBookmarkFolders(nodes, depth = 0, output = []) {
  return Core.flattenBookmarkFolders(nodes, depth, output);
}

function collectBookmarkSites(folder, recursive) {
  return Core.collectBookmarkSites(folder, recursive);
}

async function openBookmarkImportDialog() {
  elements.bookmarkError.textContent = "";
  elements.bookmarkFolderSelect.replaceChildren();
  elements.bookmarkExistingGroup.replaceChildren();
  state.bookmarkFolders.clear();

  try {
    const tree = await chrome.bookmarks.getTree();
    const folders = flattenBookmarkFolders(tree);
    folders.forEach((folder) => {
      state.bookmarkFolders.set(folder.id, folder);
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = `${"　".repeat(folder.depth)}${folder.title}`;
      elements.bookmarkFolderSelect.append(option);
    });
    state.groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.name;
      elements.bookmarkExistingGroup.append(option);
    });

    const existingOption = elements.bookmarkTargetMode.querySelector("option[value='existing']");
    existingOption.disabled = state.groups.length === 0;
    elements.bookmarkTargetMode.value = "new";
    elements.bookmarkExistingWrap.hidden = true;
    elements.bookmarkConfirmButton.disabled = folders.length === 0;
    if (folders.length === 0) {
      elements.bookmarkError.textContent = "没有找到可导入的收藏夹文件夹";
    }
    elements.manageDialog.close();
    elements.bookmarkDialog.showModal();
  } catch {
    elements.bookmarkError.textContent = "无法读取 Chrome 收藏夹";
    elements.bookmarkConfirmButton.disabled = true;
    elements.manageDialog.close();
    elements.bookmarkDialog.showModal();
  }
}

async function importBookmarkFolder() {
  elements.bookmarkError.textContent = "";
  const folderId = elements.bookmarkFolderSelect.value;
  const folderMeta = state.bookmarkFolders.get(folderId);
  if (!folderMeta) {
    elements.bookmarkError.textContent = "请选择收藏夹文件夹";
    return;
  }

  try {
    const [folder] = await chrome.bookmarks.getSubTree(folderId);
    if (!folder) throw new Error("收藏夹文件夹不存在");
    const candidates = collectBookmarkSites(folder, elements.bookmarkRecursive.checked);
    const mode = elements.bookmarkTargetMode.value;
    let result;

    if (mode === "new") {
      result = Core.addUniqueSites([], candidates, true);
      if (result.addedSites.length === 0) {
        elements.bookmarkError.textContent = `没有可导入的网址，跳过 ${result.duplicateCount + result.invalidCount} 个重复或无效网址`;
        return;
      }
      const existingNames = new Set(state.groups.map((group) => group.name));
      const name = existingNames.has(folderMeta.title)
        ? Core.createUniqueName(folderMeta.title, existingNames, "收藏夹")
        : folderMeta.title;
      state.groups.push({
        id: Core.createId("group"),
        name,
        collapsed: false,
        sites: result.sites
      });
    } else {
      const group = findGroup(elements.bookmarkExistingGroup.value);
      if (!group) {
        elements.bookmarkError.textContent = "请选择有效的目标分组";
        return;
      }
      result = Core.addUniqueSites(group.sites, candidates, true);
      group.sites = result.sites;
    }

    await saveGroups();
    elements.bookmarkDialog.close();
    render();
    const skipped = result.duplicateCount + result.invalidCount;
    showToast(`成功导入 ${result.addedSites.length} 个网址，跳过 ${skipped} 个重复或无效网址`);
  } catch (error) {
    elements.bookmarkError.textContent = error.message || "收藏夹导入失败";
  }
}

function closeAllMenus(except = null) {
  document.querySelectorAll(".group-menu, .site-menu").forEach((menu) => {
    if (menu !== except) menu.hidden = true;
  });
  document.querySelectorAll("[aria-expanded='true'].more-button, [aria-expanded='true'].site-more-button").forEach((button) => {
    if (!except || button.nextElementSibling !== except) {
      button.setAttribute("aria-expanded", "false");
    }
  });
}

function toggleMenu(button, menu) {
  const shouldOpen = menu.hidden;
  closeAllMenus(menu);
  menu.hidden = !shouldOpen;
  button.setAttribute("aria-expanded", String(shouldOpen));
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  state.toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2800);
}

function getDropPlacement(event, element) {
  const rect = element.getBoundingClientRect();
  return event.clientY > rect.top + rect.height / 2;
}

async function completeDrop(event) {
  if (!state.drag) return;
  const groupCard = event.target.closest(".group-card");
  if (!groupCard) return;

  if (state.drag.type === "group") {
    event.preventDefault();
    const targetId = groupCard.dataset.groupId;
    state.groups = Core.moveById(
      state.groups,
      state.drag.groupId,
      targetId,
      getDropPlacement(event, groupCard)
    );
    await saveGroups();
    render();
    showToast("分组顺序已保存");
    return;
  }

  const siteRow = event.target.closest(".site-row");
  if (!siteRow || siteRow.dataset.groupId !== state.drag.groupId) return;
  event.preventDefault();
  const group = findGroup(state.drag.groupId);
  if (!group) return;
  group.sites = Core.moveById(
    group.sites,
    state.drag.siteId,
    siteRow.dataset.siteId,
    getDropPlacement(event, siteRow)
  );
  await saveGroups();
  render();
  showToast("网站顺序已保存");
}

elements.createGroupButton.addEventListener("click", () => openGroupDialog());
elements.saveWindowButton.addEventListener("click", saveCurrentWindow);
elements.addCurrentPageButton.addEventListener("click", openCurrentPageDialog);
elements.currentNewGroupButton.addEventListener("click", () => {
  addCurrentPageToNewGroup().catch(() => {
    elements.currentAddError.textContent = "添加失败，请重试";
  });
});
elements.currentDestinationList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-current-group-id]");
  if (!button) return;
  elements.currentAddError.textContent = "";
  addCurrentPageToGroup(button.dataset.currentGroupId).catch(() => {
    elements.currentAddError.textContent = "添加失败，请重试";
  });
});
elements.selectAllTabs.addEventListener("click", () => {
  state.windowTabs.forEach((item) => {
    if (item.selectable) item.selected = true;
  });
  renderWindowTabList();
});
elements.selectNoTabs.addEventListener("click", () => {
  state.windowTabs.forEach((item) => {
    if (item.selectable) item.selected = false;
  });
  renderWindowTabList();
});
elements.tabSelectionList.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-window-tab-index]");
  if (!checkbox) return;
  const item = state.windowTabs[Number(checkbox.dataset.windowTabIndex)];
  if (item?.selectable) item.selected = checkbox.checked;
  updateWindowSelectionSummary();
});
elements.windowTargetSelect.addEventListener("change", () => {
  elements.windowNewGroupWrap.hidden = elements.windowTargetSelect.value !== "__new__";
});
elements.saveSelectedTabsButton.addEventListener("click", () => {
  saveSelectedWindowTabs().catch(() => {
    elements.windowError.textContent = "保存失败，请重试";
  });
});
elements.manageButton.addEventListener("click", () => {
  elements.manageError.textContent = "";
  elements.manageDialog.showModal();
});
elements.exportButton.addEventListener("click", exportConfiguration);
elements.importButton.addEventListener("click", () => elements.importFileInput.click());
elements.importFileInput.addEventListener("change", handleImportFile);
elements.bookmarkImportButton.addEventListener("click", openBookmarkImportDialog);
elements.bookmarkTargetMode.addEventListener("change", () => {
  elements.bookmarkExistingWrap.hidden = elements.bookmarkTargetMode.value !== "existing";
});
elements.bookmarkConfirmButton.addEventListener("click", importBookmarkFolder);
elements.groupForm.addEventListener("submit", handleGroupSubmit);
elements.siteForm.addEventListener("submit", handleSiteSubmit);

document.querySelectorAll("[data-dialog-close]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelectorAll("[data-import-mode]").forEach((button) => {
  button.addEventListener("click", () => applyImport(button.dataset.importMode));
});

document.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    if (!event.target.closest(".group-menu, .site-menu, .more-button, .site-more-button")) {
      closeAllMenus();
    }
    return;
  }

  const action = actionButton.dataset.action;
  const groupCard = actionButton.closest(".group-card");
  const siteRow = actionButton.closest(".site-row");
  const groupId = groupCard?.dataset.groupId || siteRow?.dataset.groupId;
  const siteId = siteRow?.dataset.siteId;
  const group = groupId ? findGroup(groupId) : null;
  const site = siteId ? group?.sites.find((item) => item.id === siteId) : null;

  try {
    if (action === "create-first-group") openGroupDialog();
    if (action === "toggle-menu") toggleMenu(actionButton, actionButton.nextElementSibling);
    if (action === "toggle-site-menu") toggleMenu(actionButton, actionButton.nextElementSibling);
    if (action === "toggle-collapse") await toggleGroupCollapsed(groupId);
    if (action === "add-site") openSiteDialog(groupId);
    if (action === "rename-group") openGroupDialog(groupId);
    if (action === "duplicate-group") await duplicateGroup(groupId);
    if (action === "delete-group") await deleteGroup(groupId);
    if (action === "edit-site") openSiteDialog(groupId, siteId);
    if (action === "delete-site") await deleteSite(groupId, siteId);
    if (action === "open-site" && site) await openSingleSite(site.url);
    if (action === "open-group" && group) await openWholeGroup(group, false);
    if (action === "force-open-group" && group) await openWholeGroup(group, true);
  } catch {
    showToast("操作失败，请重试");
  }
});

document.addEventListener("dragstart", (event) => {
  const groupHandle = event.target.closest(".group-drag-handle");
  const siteHandle = event.target.closest(".site-drag-handle");
  if (groupHandle) {
    const card = groupHandle.closest(".group-card");
    state.drag = { type: "group", groupId: card.dataset.groupId };
    card.classList.add("is-dragging");
  } else if (siteHandle) {
    const row = siteHandle.closest(".site-row");
    state.drag = {
      type: "site",
      groupId: row.dataset.groupId,
      siteId: row.dataset.siteId
    };
    row.classList.add("is-dragging");
  }
  if (state.drag && event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(state.drag));
  }
});

document.addEventListener("dragover", (event) => {
  if (!state.drag) return;
  const card = event.target.closest(".group-card");
  const row = event.target.closest(".site-row");
  const isValidGroupTarget = state.drag.type === "group" && card;
  const isValidSiteTarget = state.drag.type === "site" && row?.dataset.groupId === state.drag.groupId;
  if (isValidGroupTarget || isValidSiteTarget) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }
});

document.addEventListener("drop", (event) => {
  completeDrop(event).catch(() => showToast("排序保存失败"));
});

document.addEventListener("dragend", () => {
  document.querySelectorAll(".is-dragging").forEach((item) => item.classList.remove("is-dragging"));
  state.drag = null;
});

[elements.groupDialog, elements.siteDialog, elements.manageDialog, elements.importModeDialog, elements.addCurrentDialog, elements.windowDialog, elements.bookmarkDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

Promise.all([loadGroups(), loadCurrentPage()]);

// Support content is shown only after an explicit click in Manage.
document.querySelector("#support-button").addEventListener("click", () => {
  elements.manageDialog.close();
  document.querySelector("#support-dialog").showModal();
});
