const { chromium } = require('playwright-core');
const fs = require('node:fs'); const path = require('node:path'); const http = require('node:http'); const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const profile=path.join(path.dirname(root),'nestoratabs-browser-profile-'+Date.now());
const executable=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath();
const results=[];let ctx;let server;
async function check(name,fn){await fn();results.push({name,status:'PASS'});}
(async()=>{
 server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Synthetic '+req.url+'</title><h1>Release test fixture</h1>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const launch=()=>chromium.launchPersistentContext(profile,{executablePath:executable,headless:true,args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`],viewport:{width:420,height:600},acceptDownloads:true});
 ctx=await launch();let sw=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');const id=sw.url().split('/')[2];
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`chrome-extension://${id}/popup.html`);
 await check('MV3 actual Chromium loading',async()=>assert.equal(await page.title(),'NestoraTabs'));
 await check('Support opt-in and local placeholder images',async()=>{
  assert.equal(await page.locator('#support-dialog').evaluate(e=>e.open),false);
  await page.locator('#manage-button').click();assert.equal(await page.locator('#support-dialog').evaluate(e=>e.open),false);
  await page.locator('#support-button').click();assert.equal(await page.locator('#support-dialog').evaluate(e=>e.open),true);
  assert.equal(await page.locator('#support-dialog img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth===144&&e.src.startsWith('chrome-extension://'))),true);
  await page.screenshot({path:root+'/docs/screenshots/support.png'});await page.keyboard.press('Escape');assert.equal(await page.locator('#support-dialog').evaluate(e=>e.open),false);
 });
 await check('Create group and add site using actual UI/storage',async()=>{
  await page.locator('#create-group-button').click();await page.locator('#group-name-input').fill('Release fixture');await page.locator('#group-form button[type=submit]').click();
  await page.locator('.add-site-button').click();await page.locator('#site-name-input').fill('<img src=x onerror=alert(1)>');await page.locator('#site-url-input').fill(base+'/a');await page.locator('#site-form button[type=submit]').click();
  assert.equal(await page.locator('.site-name').textContent(),'<img src=x onerror=alert(1)>');assert.equal(await page.locator('.site-name img').count(),0);
  assert.equal(await page.evaluate(async()=> (await chrome.storage.local.get('siteGroups')).siteGroups[0].sites.length),1);
 });
 const gid=await page.evaluate(()=>state.groups[0].id);
 await check('Current-page save and duplicate prevention',async()=>{
  await page.evaluate(async({gid,url})=>{state.currentPage={title:'Fixture B',url};await addCurrentPageToGroup(gid);await addCurrentPageToGroup(gid);},{gid,url:base+'/b'});
  assert.equal(await page.evaluate(()=>state.groups[0].sites.length),2);
 });
 await check('Save current-window eligible tabs',async()=>{
  const site=await ctx.newPage();await site.goto(base+'/window');await page.bringToFront();await page.locator('#save-window-button').click();await page.locator('#window-new-group-name').fill('Window fixture');await page.locator('#save-selected-tabs-button').click();
  assert.equal(await page.evaluate(()=>state.groups.some(g=>g.name==='Window fixture'&&g.sites.some(s=>s.url.endsWith('/window')))),true);
 });
 await check('Background add handler with actual Chrome storage',async()=>{
  await sw.evaluate(async({gid,url})=>{await addPageToGroup(gid,{title:'Background fixture',url});},{gid,url:base+'/context'});
  await page.reload();await page.waitForFunction(()=>state.groups[0]?.sites.length===3);
 });
 await check('Bookmark import using actual Chrome bookmarks API',async()=>{
  const folder=await page.evaluate(async(url)=>{const f=await chrome.bookmarks.create({title:'Synthetic release folder'});await chrome.bookmarks.create({parentId:f.id,title:'Bookmark fixture',url});return f.id;},base+'/bookmark');
  await page.locator('#manage-button').click();await page.locator('#bookmark-import-button').click();await page.locator('#bookmark-folder-select').selectOption(folder);await page.locator('#bookmark-confirm-button').click();
  assert.equal(await page.evaluate(()=>state.groups.some(g=>g.sites.some(s=>s.url.endsWith('/bookmark')))),true);
 });
 await check('Group opening and forced new tabs with actual tabs API',async()=>{
  await page.evaluate(async(id)=>await openWholeGroup(findGroup(id),false),gid);
  const count=await page.evaluate(async()=> (await chrome.tabs.query({})).length);
  await page.evaluate(async(id)=>await openWholeGroup(findGroup(id),false),gid);assert.equal(await page.evaluate(async()=> (await chrome.tabs.query({})).length),count);
  await page.evaluate(async(id)=>await openWholeGroup(findGroup(id),true),gid);assert.equal(await page.evaluate(async()=> (await chrome.tabs.query({})).length),count+3);
 });
 await check('JSON download and real file input import',async()=>{
  await page.bringToFront();await page.locator('#manage-button').click();const downloadPromise=page.waitForEvent('download');await page.locator('#export-button').click();const dl=await downloadPromise;const exportFile=path.join(profile,'nestoratabs-test-backup.json');await dl.saveAs(exportFile);
  const backup=JSON.parse(fs.readFileSync(exportFile,'utf8'));assert.ok(backup.groups.length>=3);
  await page.locator('#import-file-input').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{')});assert.ok(await page.locator('#manage-error').textContent());
  await page.locator('#import-file-input').setInputFiles(exportFile);await page.locator('[data-import-mode=merge]').click();assert.equal(await page.evaluate(()=>state.groups.length),backup.groups.length*2);
 });
 await check('Favicon data-image rendering',async()=>{
  await page.evaluate(async()=>{state.groups[0].sites[0].faviconUrl='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="green"/></svg>');await saveGroups();render();});
  await page.waitForFunction(()=>document.querySelector('.site-avatar img')?.naturalWidth===16);
  await page.evaluate(()=>{ globalThis.screenshotGroups=state.groups; state.groups=JSON.parse(JSON.stringify(state.groups.slice(0,1))); state.groups[0].name='Docs & research'; state.groups[0].sites.forEach((s,i)=>s.name=['Documentation','Project notes','Reference'][i]); render(); });
  await page.screenshot({path:root+'/docs/screenshots/main.png'});
  await page.evaluate(()=>{ state.groups=globalThis.screenshotGroups; delete globalThis.screenshotGroups; render(); });
 });
 const saved=await page.evaluate(async()=>JSON.stringify((await chrome.storage.local.get('siteGroups')).siteGroups));await ctx.close();ctx=await launch();sw=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');const reopened=await ctx.newPage();await reopened.goto(`chrome-extension://${id}/popup.html`);
 await check('Browser restart retains local groups/order/data',async()=>assert.equal(await reopened.evaluate(async()=>JSON.stringify((await chrome.storage.local.get('siteGroups')).siteGroups)),saved));
 assert.deepEqual(errors,[]);results.push({name:'Uncaught popup errors',status:'PASS'});
 const out={browser:'Bundled Chromium headless',browserVersion:ctx.browser()?.version(),date:'2026-10-29',results,unknown:['Native context-menu click dispatch','Toolbar bubble behavior in branded Google Chrome','Physical drag gesture ordering','In-place upgrade from baseline in same path']};
 fs.writeFileSync(root+'/docs/BROWSER_CHECK_RESULTS.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
})().catch(e=>{console.error(e.stack);process.exitCode=1;fs.writeFileSync(root+'/docs/BROWSER_CHECK_RESULTS.json',JSON.stringify({results,error:e.message},null,2));}).finally(async()=>{if(ctx)await ctx.close();if(server)server.close();});
