(function attachCore(globalScope) {
  "use strict";

  const SCHEMA_VERSION = 3;
  const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "file:", "chrome:", "chrome-extension:", "edge:", "about:"]);

  function createId(prefix = "item") {
    const randomPart = globalScope.crypto?.randomUUID
      ? globalScope.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now().toString(36)}_${randomPart}`;
  }

  function getDisplayName(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, "") || parsed.protocol.replace(":", "");
    } catch {
      return "未命名网站";
    }
  }

  function prepareUrl(rawUrl) {
    if (typeof rawUrl !== "string") throw new Error("网址必须是文本");
    const trimmed = rawUrl.trim();
    if (!trimmed) throw new Error("请输入网址");

    const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    let parsed;
    try {
      parsed = new URL(withProtocol);
    } catch {
      throw new Error("请输入有效的网址");
    }

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      throw new Error("仅支持网页、文件或浏览器内部页面");
    }

    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.hostname) {
      throw new Error("网址缺少有效域名");
    }

    const isOriginOnly =
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      /^[a-z][a-z\d+.-]*:\/\/[^/?#]+$/i.test(withProtocol);
    return isOriginOnly ? parsed.href.replace(/\/$/, "") : parsed.href;
  }

  function normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      parsed.hash = "";
      parsed.hostname = parsed.hostname.toLowerCase();
      if (
        (parsed.protocol === "https:" && parsed.port === "443") ||
        (parsed.protocol === "http:" && parsed.port === "80")
      ) {
        parsed.port = "";
      }
      if (parsed.pathname === "/") parsed.pathname = "";
      return parsed.href.replace(/\/$/, "");
    } catch {
      return String(url || "").trim().replace(/#.*$/, "").replace(/\/$/, "").toLowerCase();
    }
  }

  function isHttpUrl(url) {
    try {
      const parsed = new URL(url);
      return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  function normalizeFaviconUrl(value) {
    if (typeof value !== "string" || !value.trim()) return undefined;
    const trimmed = value.trim();
    if (trimmed.length > 4096) return undefined;
    try {
      const parsed = new URL(trimmed);
      const allowed = new Set(["http:", "https:", "data:", "chrome:", "chrome-extension:"]);
      return allowed.has(parsed.protocol) ? trimmed : undefined;
    } catch {
      return undefined;
    }
  }

  function createSiteCandidate(value, httpOnly = true) {
    if (!value || typeof value !== "object") throw new Error("网站数据格式无效");
    const url = prepareUrl(value.url);
    if (httpOnly && !isHttpUrl(url)) throw new Error("仅支持 HTTP/HTTPS 网页");
    const nameSource = typeof value.name === "string" ? value.name : value.title;
    const name = typeof nameSource === "string" && nameSource.trim()
      ? nameSource.trim()
      : getDisplayName(url);
    const faviconUrl = normalizeFaviconUrl(value.faviconUrl || value.favIconUrl);
    return {
      id: createId("site"),
      name,
      url,
      ...(faviconUrl ? { faviconUrl } : {})
    };
  }

  function addUniqueSites(existingSites, candidates, httpOnly = true) {
    const seen = new Set(existingSites.map((site) => normalizeUrl(site.url)));
    const addedSites = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    candidates.forEach((candidate) => {
      let site;
      try {
        site = createSiteCandidate(candidate, httpOnly);
      } catch {
        invalidCount += 1;
        return;
      }
      const normalized = normalizeUrl(site.url);
      if (seen.has(normalized)) {
        duplicateCount += 1;
        return;
      }
      seen.add(normalized);
      addedSites.push(site);
    });

    return {
      sites: [...existingSites, ...addedSites],
      addedSites,
      duplicateCount,
      invalidCount
    };
  }

  function prepareWindowTabs(tabs) {
    const seen = new Set();
    let autoSkipped = 0;
    const items = tabs.map((tab) => {
      const url = typeof tab.url === "string" ? tab.url : "";
      const item = {
        title: typeof tab.title === "string" && tab.title.trim()
          ? tab.title.trim()
          : getDisplayName(url),
        url,
        faviconUrl: typeof tab.favIconUrl === "string" ? tab.favIconUrl : "",
        selectable: false,
        selected: false,
        reason: "内部或无效页面"
      };
      if (!isHttpUrl(url)) {
        autoSkipped += 1;
        return item;
      }
      const normalized = normalizeUrl(url);
      if (seen.has(normalized)) {
        autoSkipped += 1;
        item.reason = "窗口内重复网址";
        return item;
      }
      seen.add(normalized);
      item.selectable = true;
      item.selected = true;
      item.reason = "";
      return item;
    });
    return { items, autoSkipped };
  }

  function flattenBookmarkFolders(nodes, depth = 0, output = []) {
    nodes.forEach((node) => {
      const isFolder = !node.url && Array.isArray(node.children);
      if (isFolder && node.title) {
        output.push({ id: node.id, title: node.title, depth });
      }
      if (isFolder) {
        flattenBookmarkFolders(node.children, node.title ? depth + 1 : depth, output);
      }
    });
    return output;
  }

  function collectBookmarkSites(folder, recursive) {
    const sites = [];
    const visit = (nodes, allowFolders) => {
      nodes.forEach((node) => {
        if (node.url) {
          sites.push({
            name: typeof node.title === "string" && node.title.trim()
              ? node.title.trim()
              : getDisplayName(node.url),
            url: node.url
          });
        } else if (allowFolders && Array.isArray(node.children)) {
          visit(node.children, true);
        }
      });
    };
    visit(folder.children || [], recursive);
    return sites;
  }

  function normalizeStoredGroups(value) {
    if (!Array.isArray(value)) return [];

    return value
      .filter((group) => group && typeof group.name === "string" && group.name.trim())
      .map((group) => {
        const sites = Array.isArray(group.sites) ? group.sites : [];
        return {
          id: typeof group.id === "string" && group.id ? group.id : createId("group"),
          name: group.name.trim(),
          collapsed: typeof group.collapsed === "boolean" ? group.collapsed : false,
          sites: sites
            .filter((site) => {
              if (!site || typeof site.url !== "string") return false;
              try {
                prepareUrl(site.url);
                return true;
              } catch {
                return false;
              }
            })
            .map((site) => {
              const faviconUrl = normalizeFaviconUrl(site.faviconUrl);
              return {
                id: typeof site.id === "string" && site.id ? site.id : createId("site"),
                name: typeof site.name === "string" && site.name.trim()
                  ? site.name.trim()
                  : getDisplayName(site.url),
                url: prepareUrl(site.url),
                ...(faviconUrl ? { faviconUrl } : {})
              };
            })
        };
      });
  }

  function validateImportObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("备份文件的根数据必须是对象");
    }
    if (!Array.isArray(value.groups)) {
      throw new Error("备份文件缺少 groups 数组");
    }

    const groups = value.groups.map((group, groupIndex) => {
      if (!group || typeof group !== "object" || Array.isArray(group)) {
        throw new Error(`第 ${groupIndex + 1} 个分组格式无效`);
      }
      if (typeof group.name !== "string" || !group.name.trim()) {
        throw new Error(`第 ${groupIndex + 1} 个分组缺少有效名称`);
      }
      if (!Array.isArray(group.sites)) {
        throw new Error(`分组“${group.name.trim()}”缺少 sites 数组`);
      }

      const seenUrls = new Set();
      const sites = group.sites.map((site, siteIndex) => {
        if (!site || typeof site !== "object" || Array.isArray(site)) {
          throw new Error(`分组“${group.name.trim()}”中的第 ${siteIndex + 1} 个网站格式无效`);
        }
        if (typeof site.name !== "string" || !site.name.trim()) {
          throw new Error(`分组“${group.name.trim()}”中存在空网站名称`);
        }

        let url;
        try {
          url = prepareUrl(site.url);
        } catch (error) {
          throw new Error(`网站“${site.name.trim()}”的网址无效：${error.message}`);
        }

        const normalized = normalizeUrl(url);
        if (seenUrls.has(normalized)) {
          throw new Error(`分组“${group.name.trim()}”中存在重复网址：${url}`);
        }
        seenUrls.add(normalized);

        const faviconUrl = normalizeFaviconUrl(site.faviconUrl);
        return {
          id: createId("site"),
          name: site.name.trim(),
          url,
          ...(faviconUrl ? { faviconUrl } : {})
        };
      });

      return {
        id: createId("group"),
        name: group.name.trim(),
        collapsed: typeof group.collapsed === "boolean" ? group.collapsed : false,
        sites
      };
    });

    return groups;
  }

  function parseImportText(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("JSON 文件已损坏或格式不正确");
    }
    return validateImportObject(parsed);
  }

  function createExportObject(groups, exportedAt = new Date().toISOString()) {
    return {
      formatVersion: 1,
      schemaVersion: SCHEMA_VERSION,
      exportedAt,
      groups: groups.map((group) => ({
        name: group.name,
        collapsed: Boolean(group.collapsed),
        sites: group.sites.map((site) => ({
          name: site.name,
          url: site.url,
          ...(site.faviconUrl ? { faviconUrl: site.faviconUrl } : {})
        }))
      }))
    };
  }

  function createUniqueName(baseName, existingNames, suffix) {
    const names = existingNames instanceof Set ? existingNames : new Set(existingNames);
    const first = `${baseName} - ${suffix}`;
    if (!names.has(first)) return first;
    let number = 2;
    while (names.has(`${first} ${number}`)) number += 1;
    return `${first} ${number}`;
  }

  function duplicateGroup(group, allGroups) {
    const name = createUniqueName(
      group.name,
      new Set(allGroups.map((item) => item.name)),
      "副本"
    );
    return {
      id: createId("group"),
      name,
      collapsed: group.collapsed,
      sites: group.sites.map((site) => ({
        id: createId("site"),
        name: site.name,
        url: site.url,
        ...(site.faviconUrl ? { faviconUrl: site.faviconUrl } : {})
      }))
    };
  }

  function mergeGroups(currentGroups, importedGroups) {
    const names = new Set(currentGroups.map((group) => group.name));
    const renamedImports = importedGroups.map((group) => {
      let name = group.name;
      if (names.has(name)) {
        name = createUniqueName(group.name, names, "导入");
      }
      names.add(name);
      return { ...group, name };
    });
    return [...currentGroups, ...renamedImports];
  }

  function moveById(items, sourceId, targetId, placeAfter = false) {
    const sourceIndex = items.findIndex((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return [...items];

    const next = [...items];
    const [moved] = next.splice(sourceIndex, 1);
    let insertIndex = next.findIndex((item) => item.id === targetId);
    if (placeAfter) insertIndex += 1;
    next.splice(insertIndex, 0, moved);
    return next;
  }

  function planGroupOpen(sites, openUrls = [], forceNew = false) {
    if (forceNew) {
      return {
        urls: sites.map((site) => site.url),
        skippedCount: 0
      };
    }

    const seen = new Set(openUrls.map(normalizeUrl));
    const urls = [];
    let skippedCount = 0;
    sites.forEach((site) => {
      const normalized = normalizeUrl(site.url);
      if (seen.has(normalized)) {
        skippedCount += 1;
      } else {
        seen.add(normalized);
        urls.push(site.url);
      }
    });
    return { urls, skippedCount };
  }

  globalScope.TabLauncherCore = Object.freeze({
    SCHEMA_VERSION,
    createId,
    getDisplayName,
    prepareUrl,
    normalizeUrl,
    isHttpUrl,
    normalizeFaviconUrl,
    createSiteCandidate,
    addUniqueSites,
    prepareWindowTabs,
    flattenBookmarkFolders,
    collectBookmarkSites,
    normalizeStoredGroups,
    validateImportObject,
    parseImportText,
    createExportObject,
    createUniqueName,
    duplicateGroup,
    mergeGroups,
    moveById,
    planGroupOpen
  });
})(globalThis);
