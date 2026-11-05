const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");

const chromePath = process.env.CHROME_BIN || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const route = process.env.AUTH_ROUTE || "/entrar";
const viewportWidth = Number(process.env.AUTH_WIDTH || 390);
const viewportHeight = Number(process.env.AUTH_HEIGHT || 844);
const isMobile = viewportWidth <= 820;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "graficalc-auth-layout-"));
// Give each Chrome run its own DevTools port so a child process left behind by
// Windows cleanup cannot make the next run attach to a stale viewport/session.
const port = 20000 + (process.pid % 30000);
function parseRgb(value) {
  const match = String(value).match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`unsupported computed color: ${value}`);
  return match[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
}

function relativeLuminance(color) {
  const channels = typeof color === "string" ? parseRgb(color) : color;
  const linear = channels.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

function minimumGradientContrast(foreground, gradient) {
  const stops = [...gradient.matchAll(/rgba?\(([^)]+)\)/g)].map((match) => match[0]);
  if (stops.length < 2) throw new Error(`expected computed gradient stops, got ${gradient}`);
  let minimum = Infinity;
  for (let index = 0; index < stops.length - 1; index += 1) {
    const start = parseRgb(stops[index]);
    const end = parseRgb(stops[index + 1]);
    for (let step = 0; step <= 100; step += 1) {
      const progress = step / 100;
      const color = start.map((channel, channelIndex) => channel + (end[channelIndex] - channel) * progress);
      minimum = Math.min(minimum, contrastRatio(foreground, color));
    }
  }
  return minimum;
}

const browser = spawn(chromePath, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--remote-allow-origins=*",
  `--remote-debugging-port=${port}`, `--window-size=${viewportWidth},${viewportHeight}`, `--user-data-dir=${profile}`, `http://localhost:3210${route}`,
], { stdio: "ignore" });

async function waitForTarget() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const target = targets.find((item) => item.type === "page" && item.url.includes(route));
      if (target) return target;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Chrome DevTools page target did not become ready");
}

function sendCdp(socket, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Chrome command timed out: ${method}`)), 5000);
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    };
    socket.addEventListener("message", onMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluateValue(socket, id, expression) {
  const result = await sendCdp(socket, id, "Runtime.evaluate", { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Chrome evaluation failed");
  return result.result?.value;
}

async function pressTab(socket, id, shiftKey = false) {
  const modifiers = shiftKey ? 8 : 0;
  await sendCdp(socket, id, "Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers });
  await sendCdp(socket, id + 1, "Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers });
}

async function verifyTabSequence(socket, { route, firstSelector, expected, firstId }) {
  const descriptor = "(() => { const el=document.activeElement; if(el instanceof HTMLInputElement)return el.name; if(el instanceof HTMLButtonElement)return el.getAttribute('aria-label')||el.textContent.trim(); if(el instanceof HTMLAnchorElement)return el.pathname; return el.tagName; })()";
  const first = await evaluateValue(socket, firstId, `(() => { const el=document.querySelector(${JSON.stringify(firstSelector)}); el?.focus(); return document.activeElement===el ? (${descriptor}) : null; })()`);
  assert.equal(first, expected[0], `${route} should start keyboard flow at ${expected[0]}`);
  let id = firstId + 1;
  for (const expectedControl of expected.slice(1)) {
    await pressTab(socket, id);
    id += 2;
    const active = await evaluateValue(socket, id++, descriptor);
    assert.equal(active, expectedControl, `${route} Tab should move to ${expectedControl}, got ${active}`);
    const focusIndicator = await evaluateValue(socket, id++, "(() => { const style=getComputedStyle(document.activeElement); return { boxShadow:style.boxShadow, outlineStyle:style.outlineStyle, outlineWidth:style.outlineWidth }; })()");
    const visibleFocus = focusIndicator.boxShadow !== "none" || (focusIndicator.outlineStyle !== "none" && Number.parseFloat(focusIndicator.outlineWidth) > 0);
    assert.ok(visibleFocus, `${route} should show a visible keyboard focus indicator on ${expectedControl}: ${JSON.stringify(focusIndicator)}`);
  }
  for (const expectedControl of expected.slice(0, -1).reverse()) {
    await pressTab(socket, id, true);
    id += 2;
    const active = await evaluateValue(socket, id++, descriptor);
    assert.equal(active, expectedControl, `${route} Shift+Tab should move to ${expectedControl}, got ${active}`);
  }
  console.log(`PASS: ${route} real Tab/Shift+Tab order and visible focus (${expected.length} controls)`);
}

async function verifySignupMaskBehavior(socket) {
  const insertText = async (id, text) => sendCdp(socket, id, "Input.insertText", { text });
  const readInput = (name) => `(() => { const el=document.querySelector('input[name="${name}"]'); return { value:el.value, start:el.selectionStart, end:el.selectionEnd, focused:document.activeElement===el }; })()`;
  await evaluateValue(socket, 80, "(() => { const el=document.querySelector('input[name=cpfCnpj]'); el.value=''; el.focus(); el.setSelectionRange(0,0); return true; })()");
  let id = 81;
  const waitForInput = async (name, predicate) => {
    let state;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      state = await evaluateValue(socket, id++, readInput(name));
      if (predicate(state)) return state;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return state;
  };
  for (const digit of "12345678901") {
    await insertText(id++, digit);
    const expectedDigits = [..."12345678901"].indexOf(digit);
    // Read back the input after each browser insertion instead of relying on a
    // fixed delay; this keeps React's formatted value/caret update deterministic.
    const state = await waitForInput("cpfCnpj", (current) => current.focused && current.value.replace(/\D/g, "").length >= expectedDigits + 1);
    assert.ok(state.focused, "signup CPF mask should retain input focus during sequential typing");
  }
  let documentInput = await waitForInput("cpfCnpj", (current) => current.value === "123.456.789-01" && current.focused);
  assert.equal(documentInput.value, "123.456.789-01", "signup CPF mask should format sequential typing");
  assert.equal(documentInput.start, documentInput.value.length, "signup CPF mask should keep caret after sequential typing");
  assert.equal(documentInput.focused, true, "signup CPF mask should retain input focus");
  const selected = await evaluateValue(socket, id++, "(() => { const el=document.querySelector('input[name=cpfCnpj]'); el.focus(); el.setSelectionRange(5,6); return {start:el.selectionStart,end:el.selectionEnd,focused:document.activeElement===el}; })()");
  assert.deepEqual(selected, { start: 5, end: 6, focused: true }, "signup CPF test should select the intended middle digit");
  await insertText(id++, "9");
  documentInput = await waitForInput("cpfCnpj", (current) => current.value === "123.496.789-01" && current.focused);
  assert.equal(documentInput.value, "123.496.789-01", "signup CPF mask should preserve replacement inside the value");
  assert.equal(documentInput.start, 6, "signup CPF mask should preserve caret next to an insertion in the middle");

  await evaluateValue(socket, id++, "(() => { const el=document.querySelector('input[name=telefone]'); el.value=''; el.focus(); el.setSelectionRange(0,0); return true; })()");
  for (const digit of "48996594085") {
    await insertText(id++, digit);
    const state = await waitForInput("telefone", (current) => current.focused && current.value.replace(/\D/g, "").length >= [..."48996594085"].indexOf(digit) + 1);
    assert.ok(state.focused, "signup phone mask should retain input focus during sequential typing");
  }
  const phoneInput = await waitForInput("telefone", (current) => current.value === "(48) 99659-4085" && current.focused);
  assert.equal(phoneInput.value, "(48) 99659-4085", "signup phone mask should format sequential typing");
  assert.equal(phoneInput.start, phoneInput.value.length, "signup phone mask should keep caret after sequential typing");
  assert.equal(phoneInput.focused, true, "signup phone mask should retain input focus");
  console.log("PASS: signup document/phone masks preserve focus and caret during real typing and mid-value insertion");
}

async function main() {
  let failure;
  try {
    const target = await waitForTarget();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await new Promise((resolve) => {
      const onMessage = (event) => {
        if (JSON.parse(event.data).id !== 2) return;
        socket.removeEventListener("message", onMessage);
        const response = JSON.parse(event.data);
        if (response.error) return reject(new Error(response.error.message || "Chrome device emulation failed"));
        resolve();
      };
      socket.addEventListener("message", onMessage);
      socket.send(JSON.stringify({ id: 2, method: "Emulation.setDeviceMetricsOverride", params: { width: viewportWidth, height: viewportHeight, screenWidth: viewportWidth, screenHeight: viewportHeight, deviceScaleFactor: 1, mobile: isMobile } }));
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    let pageReady = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      pageReady = await evaluateValue(socket, 100 + attempt, `Boolean(document.querySelector(${JSON.stringify(".auth-page")}))`);
      if (pageReady) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!pageReady) throw new Error(`${route} did not render its auth shell before the visual check`);
    const expectedColumns = isMobile ? 1 : 2;
    let layoutReady = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      layoutReady = await evaluateValue(socket, 200 + attempt, `(() => { const e=document.querySelector('.auth-page'); const c=getComputedStyle(e); return c.display==='grid' && c.gridTemplateColumns.split(' ').length===${expectedColumns}; })()`);
      if (layoutReady) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!layoutReady) throw new Error(`${route} responsive auth CSS did not settle into the expected ${expectedColumns}-column layout`);
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Chrome evaluation timed out")), 5000);
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.id !== 1) return;
        clearTimeout(timeout);
        if (message.error) return reject(new Error(message.error.message || "Chrome evaluation failed"));
        if (message.result?.exceptionDetails) {
          const exception = message.result.exceptionDetails;
          return reject(new Error(exception.exception?.description || exception.text || "Chrome evaluation threw an exception"));
        }
        const value = message.result?.result?.value;
        if (value === undefined) return reject(new Error("Chrome evaluation returned no serializable value"));
        resolve(value);
      });
      socket.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          returnByValue: true,
          expression: `JSON.stringify((() => {
            const selectors = ['html','body','.auth-page','.brand-panel','.brand-panel img','.brand-copy h1','.form-panel','.form-heading h2','.auth-form','.field input','button[type="submit"]'];
            const logo=document.querySelector('.brand-panel img');
            const firstInput=document.querySelector('.field input');
            const priorFocus=document.activeElement;
            firstInput?.focus();
            const focusBorder=firstInput ? getComputedStyle(firstInput).borderTopColor : null;
            firstInput?.blur();
            if(priorFocus instanceof HTMLElement && priorFocus!==document.body) priorFocus.focus();
            const primary=document.querySelector('.button-primary');
            const eye=document.querySelector('.eye');
            const anchor=document.querySelector('.auth-page a');
            const muted=document.querySelector('.form-heading p');
            const label=document.querySelector('.field span');
            return { pathname: location.pathname, viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, authGrid: getComputedStyle(document.querySelector('.auth-page')).gridTemplateColumns, logoColor: logo ? getComputedStyle(logo).color : null, colors: { muted: muted ? getComputedStyle(muted).color : null, label: label ? getComputedStyle(label).color : null, link: anchor ? getComputedStyle(anchor).color : null, eyeText: eye ? getComputedStyle(eye).color : null, eyeBackground: eye ? getComputedStyle(eye).backgroundColor : null, primaryText: primary ? getComputedStyle(primary).color : null, primaryBackground: primary ? getComputedStyle(primary).backgroundImage : null, inputBorder: firstInput ? getComputedStyle(firstInput).borderTopColor : null, focusBorder }, nodes: selectors.map(selector => { const e=document.querySelector(selector); if(!e)return {selector,missing:true}; const r=e.getBoundingClientRect(); const c=getComputedStyle(e); return {selector,rect:{x:r.x,width:r.width,right:r.right},scrollWidth:e.scrollWidth,minWidth:c.minWidth,fontSize:c.fontSize}; }) };
          })())`,
        },
      }));
    });
    const metrics = JSON.parse(result);
    if (metrics.pathname !== route) {
      if (route === "/alterar-senha" && metrics.pathname === "/entrar") {
        console.log("SKIP: /alterar-senha requires an authenticated recovery session; unauthenticated request redirected to /entrar, so no change-password screenshot was captured");
        socket.close();
        return;
      }
      throw new Error(`${route} redirected to ${metrics.pathname}; refusing to label the destination as the requested page`);
    }
    assert.equal(metrics.viewport, viewportWidth, `incorrect emulated viewport for ${route}`);
    assert.equal(metrics.logoColor, "rgba(0, 0, 0, 0)", `${route} logo fallback color must be allowed by its exact CSP hash`);
    const colors = metrics.colors;
    for (const [name, foreground, background] of [
      ["muted copy", colors.muted, "rgb(255, 255, 255)"],
      ["field label", colors.label, "rgb(255, 255, 255)"],
      ["link", colors.link, "rgb(255, 255, 255)"],
      ...(colors.eyeText ? [["password visibility button", colors.eyeText, colors.eyeBackground]] : []),
    ]) {
      const ratio = contrastRatio(foreground, background);
      assert.ok(ratio >= 4.5, `${route} ${name} contrast ${ratio.toFixed(2)}:1 is below WCAG AA`);
    }
    const primaryContrast = minimumGradientContrast(colors.primaryText, colors.primaryBackground);
    assert.ok(primaryContrast >= 4.5, `${route} primary button gradient contrast ${primaryContrast.toFixed(2)}:1 is below WCAG AA`);
    const inputBorderContrast = contrastRatio(colors.inputBorder, "rgb(255, 255, 255)");
    assert.ok(inputBorderContrast >= 3, `${route} input border contrast ${inputBorderContrast.toFixed(2)}:1 is below WCAG non-text contrast`);
    const focusBorderContrast = contrastRatio(colors.focusBorder, "rgb(255, 255, 255)");
    assert.ok(focusBorderContrast >= 3, `${route} focused input border contrast ${focusBorderContrast.toFixed(2)}:1 is below WCAG non-text contrast`);
    console.log(`PASS: ${route} contrast; text ≥4.5:1, button gradient ≥${primaryContrast.toFixed(2)}:1, input boundary ≥${inputBorderContrast.toFixed(2)}:1`);
    assert.ok(metrics.documentWidth <= viewportWidth, `page has horizontal overflow at ${viewportWidth}px: ${JSON.stringify(metrics)}`);
    for (const node of metrics.nodes.filter((item) => [".auth-page", ".brand-panel img", ".brand-copy h1", ".form-panel", ".form-heading h2", ".auth-form", ".field input", 'button[type="submit"]'].includes(item.selector))) {
      assert.ok(node.rect.right <= viewportWidth + 1, `${route} ${node.selector} exceeds viewport: ${JSON.stringify(node.rect)}`);
    }
    if (isMobile) assert.equal(metrics.authGrid.split(" ").length, 1, `${route} should stack on mobile`);
    else assert.equal(metrics.authGrid.split(" ").length, 2, `${route} should use two desktop columns`);
    console.log(`PASS: ${route} at ${viewportWidth}px; no horizontal overflow; auth layout ${isMobile ? "stacked" : "two-column"}`);
    if (route === "/entrar") await verifyTabSequence(socket, {
      route, firstSelector: 'input[name="email"]', firstId: 4,
      expected: ["email", "password", "Mostrar senha", "Entrar", "/recuperar-senha", "/cadastro"],
    });
    if (route === "/cadastro") await verifyTabSequence(socket, {
      route, firstSelector: 'input[name="nome"]', firstId: 4,
      expected: ["nome", "empresa", "cpfCnpj", "telefone", "email", "password", "Mostrar senha", "confirmPassword", "Mostrar senha", "Criar minha conta", "/entrar"],
    });
    if (route === "/cadastro") await verifySignupMaskBehavior(socket);
    if (route === "/recuperar-senha") await verifyTabSequence(socket, {
      route, firstSelector: 'input[name="email"]', firstId: 4,
      expected: ["email", "/entrar", "Enviar link"],
    });
    await evaluateValue(socket, 500, "window.scrollTo(0, 0)");
    const screenshot = await new Promise((resolve) => {
      const onMessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.id !== 3) return;
        socket.removeEventListener("message", onMessage);
        resolve(message.result.data);
      };
      socket.addEventListener("message", onMessage);
      socket.send(JSON.stringify({ id: 3, method: "Page.captureScreenshot", params: { format: "png", captureBeyondViewport: false } }));
    });
    const outputDir = path.join(__dirname, "../output/playwright");
    fs.mkdirSync(outputDir, { recursive: true });
    const slug = metrics.pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
    fs.writeFileSync(path.join(outputDir, `${slug}-${viewportWidth}.png`), Buffer.from(screenshot, "base64"));
    socket.close();
  } catch (error) {
    failure = error;
  } finally {
    if (browser.exitCode === null && !browser.killed) browser.kill();
    if (browser.exitCode === null) await new Promise((resolve) => browser.once("exit", resolve));
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (cleanupError) {
      console.warn(`WARN: could not remove temporary Chrome profile ${path.basename(profile)}: ${cleanupError.code || cleanupError.message}`);
    }
  }
  if (failure) throw failure;
}

main().catch((error) => { console.error(error.stack || error.message || error); process.exitCode = 1; });
