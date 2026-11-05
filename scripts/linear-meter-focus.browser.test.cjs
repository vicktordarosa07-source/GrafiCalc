const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const chrome = process.env.CHROME_BIN;
if (!chrome || !fs.existsSync(chrome)) throw new Error("Set CHROME_BIN to the installed Chrome executable.");

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer(port, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error("local test server exited before readiness");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(500) });
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("local test server did not become ready");
}

async function main() {
  const port = await reservePort();
  const fixtureName = `__linear_focus_test_${process.pid}_${Date.now()}`;
  const fixtureDir = path.join(root, "public", fixtureName);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "graficalc-linear-focus-data-"));
  const browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), "graficalc-linear-focus-chrome-"));
  let server;
  try {
    fs.mkdirSync(fixtureDir);
    for (const file of ["index.html", "styles.css", "app.mjs", "calculation-base.mjs", "input-format.mjs", "number-input.mjs", "catalogo-loja.seed.js", "catalogo-loja.seed.mjs"]) {
      fs.copyFileSync(path.join(root, file), path.join(fixtureDir, file));
    }
    fs.cpSync(path.join(root, "assets"), path.join(fixtureDir, "assets"), { recursive: true });
    const appPath = path.join(fixtureDir, "app.mjs");
    let appSource = fs.readFileSync(appPath, "utf8");
    appSource = appSource.replace(/\r\n/g, "\n");
    appSource = appSource.replace("async function initApp() {\n  await loadStoreMasterSeed();", 'async function initApp() {\n  window.__focusAuditStage = "init-start";\n  await loadStoreMasterSeed();\n  window.__focusAuditStage = "seed-loaded";');
    appSource = appSource.replace("  await bootstrapSharedState();\n  await hydrateServerSecuritySession();", '  window.__focusAuditStage = "before-shared-bootstrap";\n  await bootstrapSharedState();\n  window.__focusAuditStage = "after-shared-bootstrap";\n  await hydrateServerSecuritySession();\n  window.__focusAuditStage = "after-security-bootstrap";');
    appSource = appSource.replace("  finishBootstrapUi();\n}", '  finishBootstrapUi();\n  window.__focusAuditStage = "initialized";\n}');
    appSource = appSource.replace("const SHARED_SYNC_INTERVAL_MS = 20000;", "const SHARED_SYNC_INTERVAL_MS = 100000000;");
    appSource = appSource.replace("function persist() {", "function persist() { persistLocalOnly(); return;");
    fs.writeFileSync(appPath, appSource);

    const urlRoot = `/public/${fixtureName}`;
    fs.writeFileSync(path.join(fixtureDir, "login.html"), `<!doctype html><meta charset="utf-8"><title>Local test login</title><script defer src="${urlRoot}/login.js"></script><pre id="login-result">starting</pre>`);
    fs.writeFileSync(path.join(fixtureDir, "login.js"), `
      (async () => {
        const result = document.getElementById("login-result");
        try {
          const response = await fetch("/api/auth/developer-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "linear-focus-test", password: "LinearFocus#Test123" }) });
          if (!response.ok) throw new Error("test-login-http-" + response.status);
          localStorage.setItem("graficalc-developer-persistent-login-v1", JSON.stringify({ enabled: true, username: "Helder Pedro da Rosa", savedAt: new Date().toISOString() }));
          localStorage.setItem("graficalc-config-section-v1", "bases");
          sessionStorage.setItem("graficalc-config-unlocked-v1", "true");
          location.replace("${urlRoot}/index.html");
        } catch (error) { result.textContent = "FAIL: " + String(error.message || error); }
      })();
    `);

    const sourceHtml = fs.readFileSync(path.join(fixtureDir, "index.html"), "utf8");
    assert.match(sourceHtml, /<script\s+type="module"\s+src="\.\/app\.mjs[^>]*><\/script>/i, "workspace source must load app.mjs as an ES module");
    const instrumentedHtml = sourceHtml.replace(/(<script\s+type="module"\s+src="\.\/app\.mjs[^>]*><\/script>)/i, '<script>window.__auditError="";window.addEventListener("error",event=>{window.__auditError="window-error:"+event.message;const result=document.querySelector("#linear-focus-result");if(result)result.textContent="FAIL:"+window.__auditError});window.addEventListener("unhandledrejection",event=>{window.__auditError="unhandled-rejection:"+String(event.reason);const result=document.querySelector("#linear-focus-result");if(result)result.textContent="FAIL:"+window.__auditError});</script>$1<script defer src="./__linear-focus-harness.js"></script><pre id="linear-focus-result">not-run</pre>');
    assert.notEqual(instrumentedHtml, sourceHtml, "browser instrumentation must preserve and observe the real module script");
    fs.writeFileSync(path.join(fixtureDir, "index.html"), instrumentedHtml);
    fs.writeFileSync(path.join(fixtureDir, "__linear-focus-harness.js"), `
      const waitFor = (read) => new Promise((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
          const value = read();
          if (value) return resolve(value);
          if (Date.now() - start > 12000) return reject(new Error("timeout-waiting-for-config"));
          setTimeout(tick, 100);
        };
        tick();
      });
      (async () => {
        if (window.__auditError) {
          document.querySelector("#linear-focus-result").textContent = "FAIL:" + window.__auditError;
          return;
        }
        document.querySelector("#linear-focus-result").textContent = "started";
        try {
          await waitFor(() => window.__focusAuditStage === "initialized" && document.querySelector("#app-shell") && !document.querySelector("#app-shell").classList.contains("is-auth-mode"));
          const verifyTableTab = async ({ tab, row, targetField, nextField, nextSelector, label }) => {
            document.querySelector('[data-tab-target="' + tab + '"]').click();
            await waitFor(() => document.querySelector('[data-tab-panel="' + tab + '"].is-active'));
            const field = await waitFor(() => [...document.querySelectorAll(row + ' input[name="' + (targetField || "description") + '"]')].find((candidate) => candidate.getClientRects().length > 0));
            const panel = document.querySelector('[data-tab-panel="' + tab + '"].is-active');
            const visibleStops = [...panel.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]")].filter((candidate) => !candidate.disabled && candidate.tabIndex >= 0 && !candidate.closest('[hidden], [inert], [aria-hidden="true"]') && candidate.getClientRects().length > 0);
            const nextBefore = visibleStops[visibleStops.indexOf(field) + 1];
            field.focus();
            const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
            field.dispatchEvent(tabEvent);
            await Promise.resolve();
            const activeRow = document.activeElement?.closest(row);
            const targetMatched = nextSelector ? document.activeElement?.matches(nextSelector) : document.activeElement?.name === nextField;
            if (!targetMatched || !activeRow || activeRow.dataset[Object.keys(activeRow.dataset).find((key) => key.endsWith("RowIndex"))] !== field.closest(row).dataset[Object.keys(field.closest(row).dataset).find((key) => key.endsWith("RowIndex"))]) {
              throw new Error("tab-focus-not-restored:" + label + ":" + (document.activeElement?.tagName + "/" + document.activeElement?.getAttribute("name")) + ":expected=" + (nextBefore?.tagName + "/" + nextBefore?.getAttribute("name") + "/" + nextBefore?.id));
            }
          };
          const getVisibleStops = (scope) => {
            const candidates = [...scope.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]")]
              .filter((candidate) => {
                const closedDetails = candidate.closest("details:not([open])");
                const hiddenByClosedDetails = closedDetails && !(candidate.matches("summary") && candidate.parentElement === closedDetails);
                return !candidate.disabled && candidate.tabIndex >= 0 && !candidate.matches('input[type="hidden"]') && !candidate.closest('[hidden], [inert], [aria-hidden="true"]') && !hiddenByClosedDetails && candidate.getClientRects().length > 0;
              });
            const radioGroups = new Map();
            for (const candidate of candidates) {
              if (!candidate.matches('input[type="radio"][name]')) continue;
              let formGroups = radioGroups.get(candidate.form);
              if (!formGroups) { formGroups = new Map(); radioGroups.set(candidate.form, formGroups); }
              const group = formGroups.get(candidate.name) || [];
              group.push(candidate);
              formGroups.set(candidate.name, group);
            }
            const skippedRadios = new Set();
            for (const groups of radioGroups.values()) {
              for (const group of groups.values()) {
                const tabRadio = group.find((radio) => radio.checked) || group[0];
                for (const radio of group) if (radio !== tabRadio) skippedRadios.add(radio);
              }
            }
            return candidates.filter((candidate) => !skippedRadios.has(candidate));
          };
          const nativeDispatchEvent = EventTarget.prototype.dispatchEvent;
          window.__suppressTabCommitEvent = false;
          EventTarget.prototype.dispatchEvent = function(event) {
            if (window.__suppressTabCommitEvent && event.type === "change" && this.matches?.("input, select, textarea")) return true;
            return nativeDispatchEvent.call(this, event);
          };
          const assertPanelTabOrder = async (scope, label) => {
            const originalStops = getVisibleStops(scope);
            if (originalStops.length < 2) throw new Error("keyboard-panel-has-too-few-controls:" + label);
            const stopIdentity = (element, index) => {
              const row = element.closest("tr");
              const rowIndex = row?.dataset.rowIndex || row?.dataset.colorRowIndex || row?.dataset.credentialRowIndex || row?.dataset.m2RowIndex || row?.dataset.linearMeterRowIndex || row?.dataset.readyRowIndex || row?.dataset.resinRowIndex || row?.dataset.cardRowIndex || row?.dataset.flyerRowIndex || row?.dataset.blockRowIndex || "";
              const rowTab = row?.dataset.blockTab || "";
              return element.id ? "id:" + element.id : [element.tagName, element.getAttribute("name") || "", rowTab, rowIndex, element.getAttribute("aria-label") || "", element.textContent.trim().slice(0, 50), index].join("|");
            };
            const expected = originalStops.map(stopIdentity);
            window.__suppressTabCommitEvent = true;
            for (let index = 0; index < expected.length - 1; index += 1) {
              const stops = getVisibleStops(scope);
              const current = stops.find((candidate, candidateIndex) => stopIdentity(candidate, candidateIndex) === expected[index]);
              if (!current) throw new Error("keyboard-control-disappeared:" + label + ":" + index);
              current.focus();
              current.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
              await Promise.resolve();
              const after = getVisibleStops(scope);
              const activeIndex = after.findIndex((candidate, candidateIndex) => candidate === document.activeElement && stopIdentity(candidate, candidateIndex) === expected[index + 1]);
              if (activeIndex !== index + 1) throw new Error("keyboard-tab-order-forward:" + label + ":" + index + ":active=" + (document.activeElement?.id || document.activeElement?.getAttribute("name") || document.activeElement?.tagName) + ":expected=" + expected[index + 1]);
            }
            for (let index = expected.length - 1; index > 0; index -= 1) {
              const stops = getVisibleStops(scope);
              const current = stops.find((candidate, candidateIndex) => stopIdentity(candidate, candidateIndex) === expected[index]);
              if (!current) throw new Error("keyboard-control-disappeared-reverse:" + label + ":" + index);
              current.focus();
              current.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
              await Promise.resolve();
              const after = getVisibleStops(scope);
              const activeIndex = after.findIndex((candidate, candidateIndex) => candidate === document.activeElement && stopIdentity(candidate, candidateIndex) === expected[index - 1]);
              if (activeIndex !== index - 1) throw new Error("keyboard-tab-order-reverse:" + label + ":" + index + ":active=" + (document.activeElement?.id || document.activeElement?.getAttribute("name") || document.activeElement?.tagName) + ":expected=" + expected[index - 1]);
            }
            window.__suppressTabCommitEvent = false;
          };
          const calculatorTabs = ["calculo", "impressos", "credenciais", "metroLinear", "m2", "prontos", "resinados", "cartoes", "panfletos", "blocosSulfite"];
          for (const tab of calculatorTabs) {
            const tabButton = document.querySelector('[data-tab-target="' + tab + '"]');
            if (!tabButton || !tabButton.getClientRects().length) throw new Error("calculator-tab-unavailable:" + tab);
            tabButton.click();
            const panel = await waitFor(() => document.querySelector('[data-tab-panel="' + tab + '"].is-active'));
            await assertPanelTabOrder(panel, "calculator-" + tab);
          }
          const quoteTab = document.querySelector('[data-tab-target="novoOrcamento"]');
          if (!quoteTab || !quoteTab.getClientRects().length) throw new Error("new-quote-tab-unavailable-for-dev-fixture");
          quoteTab.click();
          const quotePanel = await waitFor(() => document.querySelector('[data-tab-panel="novoOrcamento"].is-active'));
          await assertPanelTabOrder(quotePanel, "new-quote-builder");
          const quoteEditors = [
            ["apostila", "new-quote-booklet-editor"], ["impresso", "new-quote-color-editor"],
            ["credencial", "new-quote-credential-editor"], ["m2", "new-quote-m2-editor"],
            ["metroLinear", "new-quote-linear-editor"], ["pronto", "new-quote-ready-editor"],
            ["resinado", "new-quote-resin-editor"], ["cartao", "new-quote-card-editor"],
            ["panfleto", "new-quote-flyer-editor"], ["bloco", "new-quote-block-editor"],
            ["livre", "new-quote-free-editor"],
          ];
          for (const [service, editorId] of quoteEditors) {
            const serviceButton = await waitFor(() => {
              const button = document.querySelector('[data-new-quote-service="' + service + '"]');
              return button && button.getClientRects().length ? button : null;
            });
            serviceButton.click();
            const editor = await waitFor(() => {
              const candidate = document.getElementById(editorId);
              return candidate && !candidate.hidden && candidate.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]").length ? candidate : null;
            });
            await assertPanelTabOrder(editor, "new-quote-editor-" + service);
          }
          document.querySelector('[data-tab-target="configuracao"]').click();
          const basesSection = await waitFor(() => {
            const button = document.querySelector('[data-config-section="bases"]');
            return button && button.getClientRects().length ? button : null;
          });
          basesSection.click();
          const field = await waitFor(() => document.querySelector('[data-config-prefix="linear-meter"][data-config-key="products.canvas.rate"]'));
          field.focus();
          field.value = "";
          for (const digit of "123") {
            field.value += digit;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            if (document.activeElement !== field || !field.isConnected) throw new Error("focus-lost-while-typing:" + digit);
          }
          await verifyTableTab({ tab: "cartoes", row: "tr[data-card-row-index]", nextField: "printType", label: "cards" });
          await verifyTableTab({ tab: "cartoes", row: "tr[data-card-row-index]", targetField: "artCreationFee", nextSelector: "summary", label: "cards-finish-control" });
          await verifyTableTab({ tab: "panfletos", row: "tr[data-flyer-row-index]", nextField: "printType", label: "flyers" });
          await verifyTableTab({ tab: "blocosSulfite", row: "tr[data-block-tab][data-block-row-index]", nextSelector: "summary", label: "blocks-paper-control" });
          document.querySelector('[data-tab-target="cartoes"]').click();
          await waitFor(() => document.querySelector('[data-tab-panel="cartoes"].is-active'));
          const clearRowsButton = await waitFor(() => {
            const button = document.querySelector("#clear-card-rows-button");
            return button && button.getClientRects().length ? button : null;
          });
          clearRowsButton.focus();
          clearRowsButton.click();
          const confirmDialog = await waitFor(() => {
            const modal = document.querySelector("#confirm-modal");
            return modal && !modal.hidden ? modal.querySelector('[role="dialog"]') : null;
          });
          confirmDialog.querySelector("#confirm-modal-cancel").click();
          await Promise.resolve();
          if (document.activeElement !== clearRowsButton) throw new Error("confirm-dialog-did-not-restore-focus");
          const developerAccessButton = document.querySelector("#developer-access-button");
          const beforeDeveloperModal = document.activeElement;
          developerAccessButton.click();
          const dialog = await waitFor(() => {
            const modal = document.querySelector("#developer-access-modal");
            return modal && !modal.hidden ? modal.querySelector('[role="dialog"]') : null;
          });
          const modalStops = [...dialog.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]")]
            .filter((candidate) => !candidate.disabled && candidate.tabIndex >= 0 && candidate.getClientRects().length > 0);
          if (document.activeElement !== modalStops[0]) throw new Error("modal-initial-focus-not-first");
          modalStops.at(-1).focus();
          modalStops.at(-1).dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
          if (document.activeElement !== modalStops[0]) throw new Error("modal-tab-did-not-wrap");
          modalStops[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
          if (document.activeElement !== modalStops.at(-1)) throw new Error("modal-shift-tab-did-not-wrap");
          document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
          if (!document.querySelector("#developer-access-modal").hidden) throw new Error("developer-dialog-did-not-close-on-escape");
          await Promise.resolve();
          if (document.activeElement !== beforeDeveloperModal) throw new Error("developer-dialog-did-not-restore-focus-on-escape");
          developerAccessButton.click();
          const reopenedDialog = await waitFor(() => {
            const modal = document.querySelector("#developer-access-modal");
            return modal && !modal.hidden ? modal.querySelector('[role="dialog"]') : null;
          });
          reopenedDialog.querySelector('[data-developer-modal-close]').click();
          await Promise.resolve();
          if (document.activeElement !== beforeDeveloperModal) throw new Error("developer-dialog-did-not-restore-focus-on-close");
          document.querySelector("#linear-focus-result").textContent = "PASS: Tab/Shift+Tab traversed all 10 calculator panels, the new-quote builder and all 11 inline editors; metro-linear retained focus; row controls and dialogs restored/wrapped focus";
        } catch (error) {
          const result = document.querySelector("#linear-focus-result");
          const config = document.querySelector("#config-sections");
          result.textContent = "FAIL: " + String(error.message || error) + " | stage=" + (window.__focusAuditStage || "script-not-started") + " | shell=" + (document.querySelector("#app-shell")?.className || "?") + " | user=" + (document.querySelector("#current-user-label")?.textContent || "?") + " | config=" + (config?.innerText.slice(0, 120) || "missing") + " | sync=" + (document.querySelector("#sync-status")?.textContent.trim() || "?");
        }
      })();
    `);

    server = spawn(process.execPath, ["server.js"], {
      cwd: root,
      stdio: ["ignore", "ignore", "ignore"],
      env: {
        ...process.env,
        PORT: String(port),
        HOST: "127.0.0.1",
        GRAFICALC_DATA_DIR: dataDir,
        GRAFICALC_SESSION_SECRET: "F4kQ9vT2mR7xB3pL8zN6cH1sW5yD0aGH",
        GRAFICALC_DEVELOPER_USERNAME: "linear-focus-test",
        GRAFICALC_DEVELOPER_PASSWORD: "LinearFocus#Test123",
        SUPABASE_URL: " ",
        SUPABASE_SERVICE_ROLE_KEY: " ",
        GRAFICALC_TENANT_SLUG: "",
      },
    });
    await waitForServer(port, server);

    const browser = spawnSync(chrome, [
      "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--disable-background-networking", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--enable-logging=stderr",
      `--user-data-dir=${browserProfile}`, "--virtual-time-budget=40000", "--window-size=1440,1000", "--dump-dom",
      `http://127.0.0.1:${port}${urlRoot}/login.html`,
    ], { encoding: "utf8", timeout: 110000, maxBuffer: 6000000 });
    assert.equal(browser.status, 0, `Chrome exited unsuccessfully: ${String(browser.stderr).slice(-500)}`);
    const result = browser.stdout.match(/<pre id="linear-focus-result">([^<]*)<\/pre>/)?.[1] || "no-result";
    assert.match(result, /^PASS:/, `linear-meter focus browser test failed: ${result} | dom=${browser.stdout.slice(-2500)} | chrome=${String(browser.stderr).slice(-1200)}`);
    console.log(result);
  } finally {
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise((resolve) => server.once("exit", resolve));
    }
    fs.rmSync(fixtureDir, { recursive: true, force: true });
    fs.rmSync(dataDir, { recursive: true, force: true });
    fs.rmSync(browserProfile, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
