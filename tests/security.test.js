const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const runtimeFiles = [
  "core.js",
  "popup.js",
  "background.js",
  "context-new-group.js",
  "popup.html",
  "context-new-group.html",
  "popup.css",
  "context-new-group.css"
];
const source = runtimeFiles
  .map((file) => `\n/* FILE:${file} */\n${fs.readFileSync(path.join(root, file), "utf8")}`)
  .join("\n");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, "1.0.1");
assert.equal(manifest.name, "NestoraTabs");
assert.deepEqual([...manifest.permissions].sort(), [
  "activeTab",
  "bookmarks",
  "contextMenus",
  "storage",
  "tabs"
].sort());
assert.equal(Object.hasOwn(manifest, "host_permissions"), false);
["scripting", "webRequest", "cookies", "history", "downloads"].forEach((permission) => {
  assert.equal(manifest.permissions.includes(permission), false);
});
assert.equal(
  manifest.content_security_policy.extension_pages,
  "script-src 'self'; object-src 'self'"
);

const forbiddenPatterns = [
  [/\beval\s*\(/, "eval"],
  [/\bnew\s+Function\b/, "new Function"],
  [/\bfetch\s*\(/, "fetch"],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\baxios\b/i, "axios"],
  [/\banalytics\b/i, "analytics"],
  [/\btelemetry\b/i, "telemetry"],
  [/\binnerHTML\b/, "innerHTML"],
  [/\bouterHTML\b/, "outerHTML"],
  [/\binsertAdjacentHTML\b/, "insertAdjacentHTML"],
  [/\bdocument\.write\b/, "document.write"],
  [/<script[^>]+src=["']https?:/i, "remote script"],
  [/<link[^>]+href=["']https?:/i, "remote stylesheet"],
  [/<[^>]+\son[a-z]+\s*=/i, "inline event handler"],
  [/@import\s+url\(["']?https?:/i, "remote CSS import"]
];
forbiddenPatterns.forEach(([pattern, label]) => {
  assert.equal(pattern.test(source), false, `Forbidden runtime pattern found: ${label}`);
});

const htmlFiles = ["popup.html", "context-new-group.html"];
htmlFiles.forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  assert.equal(/<script(?![^>]*\bsrc=)/i.test(html), false, `Inline script found in ${file}`);
});

const jsFiles = ["popup.js", "context-new-group.js"];
jsFiles.forEach((file) => {
  const js = fs.readFileSync(path.join(root, file), "utf8");
  assert.equal(/\btextContent\b/.test(js), true, `${file} should use textContent for safe rendering`);
});

console.log("security.test.js: all assertions passed");
