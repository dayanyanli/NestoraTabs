const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const nodes = new Map();
function node() {
  return {textContent: "", value: "", hidden: false, dataset: {}, events: {},
    content: {cloneNode: () => node()}, classList: {toggle() {}},
    addEventListener(type, fn) { this.events[type] = fn; },
    append() {}, replaceChildren() {}, setAttribute() {},
    showModal() { this.open = true; this.opens = (this.opens || 0) + 1; },
    close() { this.open = false; }, querySelector: () => node()};
}
const document = {querySelector(selector) {
  if (!nodes.has(selector)) nodes.set(selector, node());
  return nodes.get(selector);
}, querySelectorAll: () => [], addEventListener() {}, createElement: node};
const writes = []; const createdTabs = [];
const context = vm.createContext({document, URL, console, setTimeout, clearTimeout,
  chrome: {storage: {local: {get: async () => ({siteGroups: []}), set: async (x) => writes.push(x)}},
    tabs: {query: async () => [{id: 1, title: "Example", url: "about:blank", pendingUrl: "https://example.com"}],
      create: async (x) => {createdTabs.push(x); return {id: 2};}, update: async () => {}},
    windows: {update: async () => {}}}});
for (const file of ["core.js", "popup.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
(async () => {
  await new Promise(setImmediate);
  const support = document.querySelector("#support-dialog");
  assert.equal(support.opens, undefined, "Support must stay closed at startup");
  document.querySelector("#manage-button").events.click();
  assert.equal(support.opens, undefined, "Managing data must not show support");
  document.querySelector("#support-button").events.click();
  assert.equal(support.open, true);
  assert.equal(document.querySelector("#manage-dialog").open, false);
  let read = false;
  await context.handleImportFile({target: {files: [{size: 2097153, text: async () => {read = true; return "{}";}}]}});
  assert.equal(read, false, "Oversize imports must be rejected before reading");
  await context.handleImportFile({target: {files: [{size: 1, text: async () => "{"}]}});
  assert.ok(document.querySelector("#manage-error").textContent);
  assert.equal(writes.length, 0, "Invalid imports must not write storage");
  const group = {sites: [{url: "https://example.com"}, {url: "https://second.example"}]};
  await context.openWholeGroup(group, false);
  assert.deepEqual(createdTabs.map(x => x.url), ["https://second.example"]);
  createdTabs.length = 0;
  await context.openWholeGroup(group, true);
  assert.deepEqual(createdTabs.map(x => x.url), ["https://example.com", "https://second.example"]);
  clearTimeout(vm.runInContext("state.toastTimer", context));
  console.log("popup.test.js: all assertions passed (mock DOM/Chrome APIs, not browser verification)");
})().catch(error => { console.error(error); process.exitCode = 1; });
