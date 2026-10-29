const assert = require("node:assert/strict");
const path = require("node:path");

const listeners = {};
const menus = [];
const createdTabs = [];
const badgeTexts = [];
let storageGroups = [{
  id: "g1",
  name: "Work",
  collapsed: false,
  sites: [{ id: "s1", name: "Existing", url: "https://example.com" }]
}];

function event(name) {
  return {
    addListener(listener) {
      listeners[name] = listener;
    }
  };
}

global.importScripts = (...files) => {
  files.forEach((file) => require(path.join(__dirname, "..", file)));
};

const nativeSetTimeout = global.setTimeout;
global.setTimeout = (callback) => {
  queueMicrotask(callback);
  return 1;
};

global.chrome = {
  runtime: {
    onInstalled: event("installed"),
    onStartup: event("startup"),
    getURL: (file) => `chrome-extension://test-id/${file}`
  },
  storage: {
    local: {
      async get() {
        return { siteGroups: structuredClone(storageGroups) };
      },
      async set(value) {
        storageGroups = structuredClone(value.siteGroups);
      }
    },
    onChanged: event("storageChanged")
  },
  contextMenus: {
    onClicked: event("menuClicked"),
    async removeAll() {
      menus.length = 0;
    },
    create(item) {
      menus.push(item);
      return item.id;
    }
  },
  action: {
    async setBadgeBackgroundColor() {},
    async setBadgeText({ text }) {
      badgeTexts.push(text);
    }
  },
  tabs: {
    async create(options) {
      createdTabs.push(options);
      return { id: 100, ...options };
    }
  }
};

require(path.join(__dirname, "..", "background.js"));

async function flush() {
  await new Promise((resolve) => nativeSetTimeout(resolve, 0));
  await new Promise((resolve) => nativeSetTimeout(resolve, 0));
}

(async () => {
  await flush();
  assert.equal(menus[0].title, "添加当前网页到 NestoraTabs");
  assert.equal(menus.some((item) => item.title === "Work"), true);
  assert.equal(menus.some((item) => item.title === "新建分组并添加…"), true);

  listeners.menuClicked(
    { menuItemId: "tab-launcher-group:g1", pageUrl: "https://new.example.com/path" },
    {
      title: "New page",
      url: "https://new.example.com/path",
      favIconUrl: "https://new.example.com/favicon.ico"
    }
  );
  await flush();
  assert.equal(storageGroups[0].sites.length, 2);
  assert.equal(storageGroups[0].sites[1].name, "New page");
  assert.equal(storageGroups[0].sites[1].faviconUrl, "https://new.example.com/favicon.ico");
  assert.equal(badgeTexts.includes("✓"), true);

  listeners.menuClicked(
    { menuItemId: "tab-launcher-group:g1", pageUrl: "https://new.example.com/path/" },
    { title: "Duplicate", url: "https://new.example.com/path/" }
  );
  await flush();
  assert.equal(storageGroups[0].sites.length, 2);
  assert.equal(badgeTexts.includes("已"), true);

  listeners.menuClicked(
    { menuItemId: "tab-launcher-new-group", pageUrl: "https://fresh.example.com" },
    { title: "Fresh", url: "https://fresh.example.com" }
  );
  await flush();
  assert.equal(createdTabs.length, 1);
  assert.match(createdTabs[0].url, /^chrome-extension:\/\/test-id\/context-new-group\.html\?/);
  assert.match(createdTabs[0].url, /url=https%3A%2F%2Ffresh\.example\.com/);

  storageGroups.push({ id: "g2", name: "Personal", collapsed: false, sites: [] });
  listeners.storageChanged({ siteGroups: {} }, "local");
  await flush();
  assert.equal(menus.some((item) => item.title === "Personal"), true);

  console.log("background.test.js: all assertions passed");
})().finally(() => {
  global.setTimeout = nativeSetTimeout;
});
