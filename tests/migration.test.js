const assert = require("node:assert/strict");
const path = require("node:path");

require(path.join(__dirname, "..", "core.js"));
const Core = globalThis.TabLauncherCore;

const v03Data = [
  {
    id: "group_v03_a",
    name: "Workspace A",
    collapsed: true,
    sites: [
      {
        id: "site_v03_a",
        name: "Project A",
        url: "https://example.com/project-a?view=board",
        faviconUrl: "https://example.com/favicon.svg"
      },
      {
        id: "site_v03_b",
        name: "Project B",
        url: "https://example.com/project-b"
      }
    ]
  },
  {
    id: "group_v03_b",
    name: "Workspace B",
    collapsed: false,
    sites: []
  }
];

const migrated = Core.normalizeStoredGroups(v03Data);
assert.equal(migrated.length, 2);
assert.deepEqual(migrated.map((group) => group.id), ["group_v03_a", "group_v03_b"]);
assert.deepEqual(migrated.map((group) => group.name), ["Workspace A", "Workspace B"]);
assert.deepEqual(migrated.map((group) => group.collapsed), [true, false]);
assert.deepEqual(migrated[0].sites.map((site) => site.id), ["site_v03_a", "site_v03_b"]);
assert.deepEqual(migrated[0].sites.map((site) => site.name), ["Project A", "Project B"]);
assert.deepEqual(migrated[0].sites.map((site) => site.url), [
  "https://example.com/project-a?view=board",
  "https://example.com/project-b"
]);
assert.equal(migrated[0].sites[0].faviconUrl, "https://example.com/favicon.svg");
assert.equal(migrated[0].sites[1].faviconUrl, undefined);

const partiallyDamaged = [
  null,
  { id: "empty-name", name: "", collapsed: false, sites: [] },
  {
    id: "recoverable",
    name: "Recoverable",
    collapsed: "invalid",
    sites: [
      null,
      { id: "good", name: "", url: "https://valid.example.com" },
      { id: "bad-url", name: "Bad URL", url: "javascript:alert(1)" }
    ]
  }
];
const recovered = Core.normalizeStoredGroups(partiallyDamaged);
assert.equal(recovered.length, 1);
assert.equal(recovered[0].id, "recoverable");
assert.equal(recovered[0].collapsed, false);
assert.equal(recovered[0].sites.length, 1);
assert.equal(recovered[0].sites[0].id, "good");
assert.equal(recovered[0].sites[0].name, "valid.example.com");

const largeData = Array.from({ length: 120 }, (_, groupIndex) => ({
  id: `large_group_${groupIndex}`,
  name: `Large Group ${groupIndex}`,
  collapsed: groupIndex % 2 === 0,
  sites: Array.from({ length: 80 }, (_, siteIndex) => ({
    id: `large_site_${groupIndex}_${siteIndex}`,
    name: `Site ${groupIndex}-${siteIndex}`,
    url: `https://g${groupIndex}.example.com/site/${siteIndex}?order=${siteIndex}`
  }))
}));
const largeMigrated = Core.normalizeStoredGroups(largeData);
assert.equal(largeMigrated.length, 120);
assert.equal(largeMigrated[119].sites.length, 80);
assert.equal(largeMigrated[119].id, "large_group_119");
assert.equal(largeMigrated[119].sites[79].id, "large_site_119_79");
assert.equal(largeMigrated[119].sites[79].url, "https://g119.example.com/site/79?order=79");

const backupGroups = [{
  name: "Imported",
  collapsed: true,
  sites: [{ name: "Example", url: "https://example.com" }]
}];
const backupVariants = [
  { groups: backupGroups },
  { schemaVersion: 2, groups: backupGroups },
  { schemaVersion: 3, groups: backupGroups },
  { formatVersion: 1, schemaVersion: 3, groups: backupGroups }
];
backupVariants.forEach((backup) => {
  const parsed = Core.parseImportText(JSON.stringify(backup));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, "Imported");
  assert.equal(parsed[0].sites[0].url, "https://example.com");
});

const exported = Core.createExportObject(migrated, "2026-07-27T00:00:00.000Z");
assert.equal(exported.formatVersion, 1);
assert.equal(Core.parseImportText(JSON.stringify(exported)).length, 2);

console.log("migration.test.js: all assertions passed");
