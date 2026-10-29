const STORAGE_KEY = "siteGroups";
const Core = globalThis.TabLauncherCore;
const params = new URLSearchParams(location.search);
const page = {
  title: params.get("title") || "",
  url: params.get("url") || "",
  faviconUrl: params.get("faviconUrl") || ""
};

const elements = {
  form: document.querySelector("#new-group-form"),
  name: document.querySelector("#group-name"),
  error: document.querySelector("#form-error"),
  pageTitle: document.querySelector("#page-title"),
  pageUrl: document.querySelector("#page-url"),
  siteIcon: document.querySelector("#site-icon"),
  cancel: document.querySelector("#cancel-button")
};

elements.pageTitle.textContent = page.title || Core.getDisplayName(page.url);
elements.pageUrl.textContent = page.url;

const faviconUrl = Core.normalizeFaviconUrl(page.faviconUrl);
if (faviconUrl) {
  const image = document.createElement("img");
  image.src = faviconUrl;
  image.alt = "";
  image.addEventListener("error", () => image.remove());
  elements.siteIcon.replaceChildren(image);
}

async function closeCurrentTab() {
  const tab = await chrome.tabs.getCurrent();
  if (typeof tab?.id === "number") {
    await chrome.tabs.remove(tab.id);
  } else {
    window.close();
  }
}

elements.cancel.addEventListener("click", () => {
  closeCurrentTab().catch(() => window.close());
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.error.textContent = "";
  const name = elements.name.value.trim();
  if (!name) {
    elements.error.textContent = "请输入分组名称";
    return;
  }

  try {
    const site = Core.createSiteCandidate(page, true);
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const groups = Core.normalizeStoredGroups(result[STORAGE_KEY]);
    groups.push({
      id: Core.createId("group"),
      name,
      collapsed: false,
      sites: [site]
    });
    await chrome.storage.local.set({ [STORAGE_KEY]: groups });
    await closeCurrentTab();
  } catch (error) {
    elements.error.textContent = error.message || "创建失败，请重试";
  }
});
