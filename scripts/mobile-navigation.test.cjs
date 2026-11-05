const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const {spawnSync}=require("node:child_process");
const root=path.join(__dirname,"..");
const css=fs.readFileSync(path.join(root,"styles.css"),"utf8");
const app=fs.readFileSync(path.join(root,"app.mjs"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const first=css.indexOf("/* MOBILE MENU V3 - authoritative final override */");
const last=css.indexOf("/* Native mobile section picker replaces the long horizontal tab rail. */");
assert.ok(first>=0&&last>first,"responsive override must follow legacy CSS");
const scoped=css.slice(last);
for(const selector of [
'.page-shell:not(.is-auth-mode) .app-menu-shell.app-menu-shell--v3 .tab-bar.tab-bar--v3',
'.page-shell:not(.is-auth-mode):not([data-active-tab="home"]) .app-menu-shell.app-menu-shell--v3 .tab-bar.tab-bar--v3',
'.page-shell:not(.is-auth-mode) .app-menu-shell.app-menu-shell--v3.is-expanded .tab-bar.tab-bar--v3',
'.page-shell:not(.is-auth-mode):not([data-active-tab="home"]) .app-menu-shell.app-menu-shell--v3.is-expanded .tab-bar.tab-bar--v3'
]) assert.ok(scoped.includes(selector),"mobile sidebar selector missing: "+selector);
assert.match(scoped,/display:\s*none\s*!important\s*;/);
assert.match(app,/option\.disabled = !allowed/);
assert.match(app,/mobileTabSelect\?\.addEventListener\("change"/);
assert.match(html,/<select id="mobile-tab-select"/);
assert.doesNotMatch(app,/\b(?:button|appHomeShortcut)\.blur\(\)/,"tab navigation must preserve keyboard focus after activation");
assert.match(app,/function isVisibleTabStop\(element\)/,"managed navigation must use the complete visible tab order");
assert.match(app,/querySelectorAll\("a\[href\], button, input, select, textarea, summary, \[tabindex\]"\)/,"managed navigation must include buttons and disclosure controls");
assert.match(app,/if \(isModalScope && \(nextIndex < 0 \|\| nextIndex >= stops\.length\)\)/,"modal Tab navigation must wrap within the dialog");
assert.match(app,/function restoreModalFocus\(previousFocus\)/,"closing a modal must restore focus or move it to a visible fallback");
assert.match(app,/if \(developerAccessModal && !developerAccessModal\.hidden\) \{\s*closeDeveloperAccessModal\(\);/,"Escape must close the developer access dialog");
const linearMeterHandlerStart=app.indexOf('if (prefix === "linear-meter") {');
const linearMeterHandlerEnd=app.indexOf('if (prefix === "m2-finish") {',linearMeterHandlerStart);
assert.ok(linearMeterHandlerStart>=0&&linearMeterHandlerEnd>linearMeterHandlerStart,"linear-meter config input handler missing");
const linearMeterHandler=app.slice(linearMeterHandlerStart,linearMeterHandlerEnd);
assert.match(linearMeterHandler,/persistConfigDraft\(\)/,"linear-meter edits must be persisted to the draft");
assert.doesNotMatch(linearMeterHandler,/renderConfig\s*\(/,"linear-meter typing must not replace its focused config form");
assert.match(app,/\["linearMeter",\s*"tr\[data-linear-meter-row-index\]",\s*"linearMeterRowIndex"\]/,"linear-meter rows must retain stable focus descriptors");
assert.match(app,/linearMeter:\s*`tr\[data-linear-meter-row-index=/,"linear-meter focus descriptor must resolve after table rerenders");
for(const [type,indexKey] of [["card","cardRowIndex"],["flyer","flyerRowIndex"]]){
  assert.match(app,new RegExp(`\\["${type}",\\s*"tr\\[data-${type}-row-index\\]",\\s*"${indexKey}"\\]`),`${type} rows must retain stable focus descriptors`);
  assert.ok(app.includes(`${type}: \`tr[data-${type}-row-index="\${descriptor.rowIndex}"]\``),`${type} focus descriptors must resolve after table rerenders`);
}
assert.match(app,/const blockRow = element\.closest\("tr\[data-block-tab\]\[data-block-row-index\]"\)/,"block rows must be included in stable focus descriptors");
assert.match(app,/tr\[data-block-tab="\$\{CSS\.escape\(descriptor\.tab \|\| ""\)\}"\]\[data-block-row-index="\$\{CSS\.escape\(descriptor\.rowIndex \|\| ""\)\}"\]/,"block focus must resolve by tab and row after table rerenders");
const cachedChromium=(()=>{
  const browserCache=process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,"ms-playwright");
  if(!browserCache||!fs.existsSync(browserCache)) return [];
  try{
    return fs.readdirSync(browserCache)
      .filter(name=>/^chromium-\d+$/.test(name))
      .sort((a,b)=>Number(b.slice("chromium-".length))-Number(a.slice("chromium-".length)))
      .flatMap(name=>[
        path.join(browserCache,name,"chrome-win64","chrome.exe"),
        path.join(browserCache,name,"chrome-win","chrome.exe")
      ]);
  }catch{return [];}
})();
const chrome=[process.env.CHROME_BIN,...cachedChromium,
  process.env.PROGRAMFILES&&path.join(process.env.PROGRAMFILES,"Google","Chrome","Application","chrome.exe"),
  process.env["PROGRAMFILES(X86)"]&&path.join(process.env["PROGRAMFILES(X86)"],"Google","Chrome","Application","chrome.exe"),
  process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,"Google","Chrome","Application","chrome.exe"),
  "/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"].filter(Boolean).find(v=>fs.existsSync(v));
if(!chrome){console.log("mobile-navigation: layout and linear-meter focus guards passed; headless Chrome unavailable");process.exit(0);}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"graficalc-layout-"));
try{
  fs.copyFileSync(path.join(root,"styles.css"),path.join(temp,"styles.css"));
  const fixture=[
'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">',
'<link rel="stylesheet" href="styles.css"></head><body>',
'<div class="page-shell" data-active-tab="home">',
'<div class="app-menu-shell app-menu-shell--v3 is-expanded">',
'<div id="picker" class="mobile-nav-control"><label for="mobile-tab-select">Seção atual</label><select id="mobile-tab-select"><option>Home</option></select></div>',
'<nav id="nav" class="tab-bar tab-bar--v3"><button class="tab-button">Home</button></nav></div>',
'<main id="panels" class="tab-panels"><section class="tab-panel is-active"><h2>Home</h2></section></main></div>',
'<pre id="result">not-ready</pre>',
'<script>addEventListener("load",()=>{const n=document.getElementById("nav"),p=document.getElementById("picker"),m=document.getElementById("panels");document.getElementById("result").textContent=[getComputedStyle(n).display,getComputedStyle(p).display,Math.round(m.getBoundingClientRect().width),innerWidth].join("|")})</script>',
'</body></html>'].join("");
  const file=path.join(temp,"test.html");
  fs.writeFileSync(file,fixture);
  for(const width of [390,768,1440]){
    const run=spawnSync(chrome,["--headless","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--allow-file-access-from-files","--virtual-time-budget=1200","--window-size="+width+",820","--dump-dom",file],{encoding:"utf8",timeout:45000,maxBuffer:4000000});
    assert.equal(run.status,0,"headless Chrome failed "+String(run.stderr).slice(-250));
    const match=run.stdout.match(/<pre id="result">([^<]+)<\/pre>/);
    assert.ok(match&&match[1]!=="not-ready","computed style unavailable at "+width);
    const [nav,picker,contentWidth,viewport]=match[1].split("|");
    if(width<=1180){assert.equal(nav,"none","legacy sidebar visible at "+width);assert.notEqual(picker,"none","native mobile picker hidden at "+width);}
    else{assert.notEqual(nav,"none","desktop sidebar unexpectedly hidden");assert.equal(picker,"none","mobile picker visible on desktop");}
    assert.ok(Number(contentWidth)>0&&Number(contentWidth)<=Number(viewport)+1,"workspace overflow at "+width);
  }
  const focusRun=spawnSync(process.execPath,[path.join(root,"scripts","linear-meter-focus.browser.test.cjs")],{encoding:"utf8",timeout:90000,maxBuffer:12000,env:{...process.env,CHROME_BIN:chrome}});
  assert.equal(focusRun.status,0,"actual GrafiCalc focus browser test failed: "+String(focusRun.stderr||focusRun.stdout).slice(-1000));
  console.log("mobile-navigation: responsive layout passed (390px, 768px, 1440px); "+focusRun.stdout.trim());
}finally{fs.rmSync(temp,{recursive:true,force:true});}
