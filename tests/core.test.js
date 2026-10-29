const assert = require("node:assert/strict");
const path = require("node:path");

require(path.join(__dirname, "..", "core.js"));
const Core = globalThis.TabLauncherCore;

const group = (id, name, collapsed = false, sites = []) => ({ id, name, collapsed, sites });
const site = (id, name, url, faviconUrl) => ({
  id,
  name,
  url,
  ...(faviconUrl ? { faviconUrl } : {})
});

assert.equal(Core.SCHEMA_VERSION, 3);

assert.equal(Core.prepareUrl("google.com"), "https://google.com");
assert.equal(Core.prepareUrl("www.github.com"), "https://www.github.com");
assert.equal(Core.prepareUrl("http://www.github.com"), "http://www.github.com");
assert.equal(
  Core.prepareUrl("https://github.com/user/project?tab=readme"),
  "https://github.com/user/project?tab=readme"
);
assert.throws(() => Core.prepareUrl("javascript:alert(1)"));
assert.throws(() => Core.prepareUrl(""));
assert.equal(Core.isHttpUrl("https://example.com"), true);
assert.equal(Core.isHttpUrl("chrome://newtab"), false);
assert.equal(Core.isHttpUrl("about:blank"), false);

assert.equal(Core.normalizeUrl("https://Example.com/#top"), "https://example.com");
assert.equal(Core.normalizeUrl("https://example.com"), Core.normalizeUrl("https://example.com/"));
assert.notEqual(
  Core.normalizeUrl("https://github.com/user/project-a"),
  Core.normalizeUrl("https://github.com/user/project-b")
);
assert.notEqual(
  Core.normalizeUrl("https://example.com/search?q=a"),
  Core.normalizeUrl("https://example.com/search?q=b")
);

const v02Data = [{
  id: "g1",
  name: "AI Dev",
  collapsed: true,
  sites: [{ id: "s1", name: "GitHub", url: "https://github.com/user/project" }]
}];
const migrated = Core.normalizeStoredGroups(v02Data);
assert.equal(migrated.length, 1);
assert.equal(migrated[0].collapsed, true);
assert.equal(migrated[0].sites[0].url, "https://github.com/user/project");
assert.equal(migrated[0].sites[0].faviconUrl, undefined);

const faviconData = [{
  name: "Tools",
  sites: [
    { name: "Valid", url: "https://example.com", faviconUrl: "https://example.com/favicon.ico" },
    { name: "Unsafe icon", url: "https://safe.example.com", faviconUrl: "javascript:alert(1)" }
  ]
}];
const normalizedFavicons = Core.normalizeStoredGroups(faviconData);
assert.equal(normalizedFavicons[0].sites[0].faviconUrl, "https://example.com/favicon.ico");
assert.equal(normalizedFavicons[0].sites[1].faviconUrl, undefined);

const existingSites = [site("s1", "Home", "https://example.com")];
const addResult = Core.addUniqueSites(existingSites, [
  { title: "Duplicate slash", url: "https://example.com/" },
  { title: "Path A", url: "https://example.com/a", favIconUrl: "https://example.com/a.ico" },
  { title: "Path B", url: "https://example.com/b" },
  { title: "Invalid", url: "chrome://settings" }
], true);
assert.equal(addResult.addedSites.length, 2);
assert.equal(addResult.duplicateCount, 1);
assert.equal(addResult.invalidCount, 1);
assert.deepEqual(addResult.addedSites.map((item) => item.url), [
  "https://example.com/a",
  "https://example.com/b"
]);
assert.equal(addResult.addedSites[0].faviconUrl, "https://example.com/a.ico");

const preparedWindow = Core.prepareWindowTabs([
  { title: "A", url: "https://a.example.com", favIconUrl: "https://a.example.com/icon.png" },
  { title: "A duplicate", url: "https://a.example.com/" },
  { title: "Project A", url: "https://github.com/user/project-a" },
  { title: "Project B", url: "https://github.com/user/project-b" },
  { title: "Settings", url: "chrome://settings" },
  { title: "Extension", url: "chrome-extension://abc/page.html" },
  { title: "Blank", url: "about:blank" }
]);
assert.equal(preparedWindow.items.filter((item) => item.selectable).length, 3);
assert.equal(preparedWindow.autoSkipped, 4);
assert.equal(preparedWindow.items[1].reason, "窗口内重复网址");
assert.equal(preparedWindow.items[0].faviconUrl, "https://a.example.com/icon.png");

const bookmarkTree = [{
  id: "0",
  title: "",
  children: [{
    id: "1",
    title: "Bookmarks Bar",
    children: [
      { id: "10", title: "Direct", url: "https://direct.example.com" },
      {
        id: "2",
        title: "Nested",
        children: [
          { id: "20", title: "", url: "https://nested.example.com" },
          { id: "21", title: "Bad", url: "chrome://settings" }
        ]
      }
    ]
  }]
}];
const folders = Core.flattenBookmarkFolders(bookmarkTree);
assert.deepEqual(folders.map((item) => [item.title, item.depth]), [
  ["Bookmarks Bar", 0],
  ["Nested", 1]
]);
assert.deepEqual(
  Core.collectBookmarkSites(bookmarkTree[0].children[0], false).map((item) => item.url),
  ["https://direct.example.com"]
);
const recursiveBookmarks = Core.collectBookmarkSites(bookmarkTree[0].children[0], true);
assert.deepEqual(recursiveBookmarks.map((item) => item.url), [
  "https://direct.example.com",
  "https://nested.example.com",
  "chrome://settings"
]);
assert.equal(recursiveBookmarks[1].name, "nested.example.com");
const bookmarkImport = Core.addUniqueSites([], recursiveBookmarks, true);
assert.equal(bookmarkImport.addedSites.length, 2);
assert.equal(bookmarkImport.invalidCount, 1);

const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
assert.deepEqual(Core.moveById(items, "a", "c", true).map((item) => item.id), ["b", "c", "a", "d"]);
assert.deepEqual(Core.moveById(items, "d", "b", false).map((item) => item.id), ["a", "d", "b", "c"]);

const orderedSites = [
  site("s1", "A", "https://a.example.com"),
  site("s2", "B", "https://b.example.com/path"),
  site("s3", "A duplicate", "https://a.example.com/")
];
const normalPlan = Core.planGroupOpen(orderedSites, ["https://b.example.com/path#open"], false);
assert.deepEqual(normalPlan.urls, ["https://a.example.com"]);
assert.equal(normalPlan.skippedCount, 2);
assert.deepEqual(
  Core.planGroupOpen(orderedSites, ["https://a.example.com"], true).urls,
  orderedSites.map((item) => item.url)
);

const original = group("g1", "AI Dev", true, [
  site("s1", "GitHub", "https://github.com", "https://github.com/favicon.ico")
]);
const copied = Core.duplicateGroup(original, [
  original,
  group("g2", "AI Dev - 副本"),
  group("g3", "AI Dev - 副本 2")
]);
assert.equal(copied.name, "AI Dev - 副本 3");
assert.equal(copied.sites[0].faviconUrl, "https://github.com/favicon.ico");
assert.notEqual(copied.sites[0].id, original.sites[0].id);

const merged = Core.mergeGroups(
  [group("c1", "Work"), group("c2", "Work - 导入")],
  [group("i1", "Work"), group("i2", "Work")]
);
assert.deepEqual(merged.map((item) => item.name), [
  "Work",
  "Work - 导入",
  "Work - 导入 2",
  "Work - 导入 3"
]);

const validImport = JSON.stringify({
  schemaVersion: 3,
  groups: [{
    name: "Work",
    collapsed: true,
    sites: [{
      name: "Project",
      url: "project.example.com/path?q=1",
      faviconUrl: "https://project.example.com/icon.svg"
    }]
  }, { name: "Empty", sites: [] }]
});
const parsed = Core.parseImportText(validImport);
assert.equal(parsed.length, 2);
assert.equal(parsed[0].sites[0].faviconUrl, "https://project.example.com/icon.svg");
assert.throws(() => Core.parseImportText("{broken"));
assert.throws(() => Core.parseImportText("{}"));
assert.throws(() => Core.parseImportText(JSON.stringify({ groups: [{ name: "", sites: [] }] })));
assert.throws(() => Core.parseImportText(JSON.stringify({
  groups: [{ name: "Work", sites: [{ name: "", url: "https://example.com" }] }]
})));
assert.throws(() => Core.parseImportText(JSON.stringify({
  groups: [{
    name: "Work",
    sites: [
      { name: "A", url: "https://example.com/" },
      { name: "B", url: "https://example.com#top" }
    ]
  }]
})));

const exported = Core.createExportObject([original], "2026-07-27T00:00:00.000Z");
assert.deepEqual(Object.keys(exported), ["formatVersion", "schemaVersion", "exportedAt", "groups"]);
assert.equal(exported.formatVersion, 1);
assert.equal(exported.schemaVersion, 3);
assert.equal(exported.groups[0].sites[0].faviconUrl, "https://github.com/favicon.ico");
assert.equal(exported.groups[0].id, undefined);
assert.equal(exported.groups[0].sites[0].id, undefined);

console.log("core.test.js: all assertions passed");
