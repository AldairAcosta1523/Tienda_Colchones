/**
 * Medición de carga inicial.
 *
 * Simula un equipo modesto (CPU 4× más lenta) y una red móvil, y anota lo que de verdad
 * percibe el usuario: cuándo aparece el contenido, cuánto se descarga y en qué.
 *
 *   node scripts/carga.mjs            → escritorio sin limitar
 *   MOVIL=1 node scripts/carga.mjs    → móvil con CPU y red limitadas
 */
import { chromium } from "playwright";

const BASE = process.env.URL || "http://localhost:3011";
const MOVIL = process.env.MOVIL === "1";

const browser = await chromium.launch();
const ctx = await browser.newContext(
  MOVIL
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1440, height: 900 } }
);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

if (MOVIL) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
    uploadThroughput: (1 * 1024 * 1024) / 8,
  });
}

// Peso descargado, por tipo
const bytes = {};
page.on("response", async (r) => {
  try {
    const h = await r.allHeaders();
    const len = Number(h["content-length"] || 0);
    const tipo = (h["content-type"] || "otro").split(";")[0];
    const grupo = tipo.includes("javascript")
      ? "JavaScript"
      : tipo.includes("css")
        ? "CSS"
        : tipo.includes("image")
          ? "imágenes"
          : tipo.includes("font")
            ? "fuentes"
            : tipo.includes("html")
              ? "HTML"
              : "otro";
    bytes[grupo] = (bytes[grupo] || 0) + len;
  } catch {
    /* respuesta ya descartada */
  }
});

await page.addInitScript(() => {
  window.__lcp = 0;
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__lcp = Math.round(e.startTime);
  }).observe({ type: "largest-contentful-paint", buffered: true });
});

const t0 = Date.now();
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

// Momento en el que el hero deja de estar tapado por el preloader
const heroVisible = await page
  .waitForFunction(
    () => {
      const pre = document.querySelector(".preloader");
      const oculto = !pre || getComputedStyle(pre).display === "none";
      const h1 = document.querySelector(".hero__title");
      return oculto && h1 && h1.getBoundingClientRect().height > 0;
    },
    null,
    { timeout: 30000 }
  )
  .then(() => Date.now() - t0)
  .catch(() => -1);

await page.waitForLoadState("networkidle");
const m = await page.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const fcp = performance.getEntriesByName("first-contentful-paint")[0];
  return {
    fcp: Math.round(fcp?.startTime || 0),
    lcp: window.__lcp,
    domInteractive: Math.round(nav.domInteractive),
    cargaCompleta: Math.round(nav.loadEventEnd),
  };
});

console.log(`perfil: ${MOVIL ? "MÓVIL (CPU 4× lenta, 4 Mbps)" : "escritorio sin limitar"}`);
console.log(`  primera pintura (FCP)      ${m.fcp} ms`);
console.log(`  mayor elemento (LCP)       ${m.lcp} ms`);
console.log(`  hero legible (tras cortina) ${heroVisible} ms`);
console.log(`  carga completa             ${m.cargaCompleta} ms`);
const total = Object.values(bytes).reduce((a, c) => a + c, 0);
console.log(`  descargado: ${(total / 1024).toFixed(0)} KB`);
for (const [k, v] of Object.entries(bytes).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(12)} ${(v / 1024).toFixed(0)} KB`);
}

await browser.close();
