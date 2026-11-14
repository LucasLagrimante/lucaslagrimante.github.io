#!/usr/bin/env node
/**
 * QA de browser do portfólio (cards de domínio), desktop 1440 e mobile 390.
 *
 * Uso:
 *   QA_BASE=http://127.0.0.1:8769/ node scripts/qa_eloara_browser.cjs
 *   QA_OUT=/tmp/qa node scripts/qa_eloara_browser.cjs   # screenshots/JSON fora do repo
 *   QA_SHOTS=0 node scripts/qa_eloara_browser.cjs       # só métricas
 *
 * Playwright: usa `playwright` do projeto se existir; senão tenta PW_MODULE
 * e, por último, o cache do npx. Nunca fixa um hash de npx.
 */
const fs = require("fs");
const path = require("path");

const BASE = process.env.QA_BASE || "http://127.0.0.1:8769/";
const OUT = path.resolve(process.env.QA_OUT || "docs/qa/eloara");
const SHOTS = process.env.QA_SHOTS !== "0";

function loadPlaywright() {
  const tries = [process.env.PW_MODULE, "playwright", "playwright-core"].filter(Boolean);
  const npxRoot = path.join(process.env.HOME || "", ".npm", "_npx");
  try {
    for (const dir of fs.readdirSync(npxRoot)) tries.push(path.join(npxRoot, dir, "node_modules", "playwright"));
  } catch {}
  const errors = [];
  for (const id of tries) {
    try {
      return require(id);
    } catch (e) {
      errors.push(`${id}: ${e.code || e.message}`);
    }
  }
  throw new Error("Playwright não encontrado. Instale com `npm i -D playwright` ou defina PW_MODULE.\n" + errors.join("\n"));
}

const { chromium } = loadPlaywright();
const sel = (name, mobile) => path.join(OUT, `${mobile ? "mobile" : "desktop"}-${name}.png`);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox"] });
  const results = [];
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
        deviceScaleFactor: 2,
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      if (mobile) {
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      }
      const errors = [], failed = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("response", (r) => { if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() }); });

      await page.goto(BASE, { waitUntil: "load" });
      for (const section of ["work", "domains"]) {
        await page.locator(`#${section}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        if (SHOTS) await page.locator(`#${section}`).screenshot({ path: sel(section, mobile) });
      }
      // lazy loading: percorre a grade até o fim e espera todos os logos decodificarem
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForFunction(
        () => [...document.querySelectorAll(".domain-logo")].every((i) => i.complete && i.naturalWidth > 0),
        undefined,
        { timeout: 10000 }
      ).catch(() => {});

      await page.locator(".domain-eloara").focus();
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        dpr: devicePixelRatio,
        touch: navigator.maxTouchPoints,
        cards: document.querySelectorAll(".domain-card").length,
        images: [...document.querySelectorAll(".domain-logo")].map((x) => ({ src: x.getAttribute("src"), loaded: x.complete && x.naturalWidth > 0 })),
        focus: getComputedStyle(document.activeElement).outlineStyle,
        eloara: document.querySelector(".domain-eloara").innerText,
        gridColumns: getComputedStyle(document.querySelector(".domain-grid")).gridTemplateColumns.split(" ").length,
      }));
      await page.locator("#lang-toggle").click();
      metrics.pt = await page.locator(".domain-eloara").innerText();
      results.push({ base: BASE, mobile, metrics, errors, failed });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const file = path.join(OUT, "browser.json");
  fs.writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));

  const bad = results.some(
    (x) => x.errors.length || x.failed.length || x.metrics.scroll > x.metrics.client || x.metrics.images.some((i) => !i.loaded)
  );
  if (bad) process.exitCode = 1;
  console.log(bad ? `FALHOU — detalhes em ${file}` : `OK — ${results.length} viewports, ${results[0].metrics.cards} cards`);
})().catch((e) => { console.error(e); process.exitCode = 1; });
