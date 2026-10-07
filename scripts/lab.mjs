/**
 * QA del Comfort Lab (3D): comprueba que WebGL pinta de verdad, y prueba arrastre, vistas,
 * hotspots, despiece, pausa fuera de pantalla, móvil y el fallback sin WebGL.
 *   OUT=./shots node scripts/lab.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.URL || "http://localhost:3011";
const OUT = process.env.OUT || "./shots";
fs.mkdirSync(OUT, { recursive: true });
const out = [];

// SwiftShader: WebGL por software para que el headless pinte sin GPU.
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function open(ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(`[${m.type()}] ${m.text()}`));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  return { ctx, page, errs };
}

async function toLab(page, frac = 0.08) {
  await page.evaluate((frac) => {
    const el = document.querySelector(".lab__stage");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * frac;
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
  }, frac);
}

/**
 * Porcentaje de píxeles no transparentes del canvas: prueba de que hay render real.
 *
 * La escena pinta bajo demanda y el contexto no conserva el búfer, así que leerlo sin un
 * repintado en ese mismo fotograma devuelve vacío aunque en pantalla se vea el modelo. Por eso
 * se empuja el modelo unos píxeles justo antes de medir.
 */
const coverage = async (page) => {
  const caja = await page.locator(".lab__canvas").boundingBox();
  if (caja) {
    await page.mouse.move(caja.x + caja.width * 0.86, caja.y + caja.height * 0.28);
    await page.mouse.down();
    await page.mouse.move(caja.x + caja.width * 0.86 + 3, caja.y + caja.height * 0.28, { steps: 2 });
    await page.mouse.up();
    await page.waitForTimeout(120);
  }
  return page.evaluate(async () => {
    const c = document.querySelector(".lab__canvas");
    if (!c) return -1;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const probe = document.createElement("canvas");
    probe.width = 160;
    probe.height = 100;
    const ctx = probe.getContext("2d");
    ctx.drawImage(c, 0, 0, probe.width, probe.height);
    const d = ctx.getImageData(0, 0, probe.width, probe.height).data;
    let filled = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) filled++;
    return Math.round((filled / (d.length / 4)) * 100);
  });
};

const hotspots = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".lab__hotspot")].map((b) => `${b.getAttribute("aria-label").split(":")[0]}=${b.dataset.visible}`).join(" ")
  );

// ---------- Escritorio ----------
{
  const { ctx, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  out.push("three cargado antes de acercarse: " + (await page.evaluate(() => !!document.querySelector(".lab__stage.is-ready"))));
  await toLab(page);
  await page.waitForSelector(".lab__stage.is-ready", { timeout: 15000 });
  await page.waitForTimeout(1800);
  out.push("listo=true cobertura canvas=" + (await coverage(page)) + "%");
  out.push("hotspots (perspectiva): " + (await hotspots(page)));
  await page.screenshot({ path: `${OUT}/lab-01-perspectiva.png` });

  // Arrastre: comparar el frame antes y después.
  const before = await page.locator(".lab__canvas").screenshot();
  const box = await page.locator(".lab__canvas").boundingBox();
  // Se arrastra desde una zona vacía del canvas (en el centro hay un hotspot).
  await page.mouse.move(box.x + box.width * 0.86, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.22, { steps: 16 });
  await page.mouse.up();
  await page.waitForTimeout(1300);
  const after = await page.locator(".lab__canvas").screenshot();
  out.push("arrastre cambia el frame=" + !before.equals(after) + " pista oculta=" + (await page.evaluate(() => document.querySelector(".lab__hint").classList.contains("is-hidden"))));
  await page.screenshot({ path: `${OUT}/lab-02-arrastre.png` });

  for (const [label, file] of [["Frontal", "lab-03-frontal"], ["Superior", "lab-04-superior"]]) {
    await page.click(`.lab__view:has-text("${label}")`);
    await page.waitForTimeout(1600);
    out.push(`vista ${label}: pressed=` + (await page.getAttribute(`.lab__view:has-text("${label}")`, "aria-pressed")) + " · " + (await hotspots(page)));
    await page.screenshot({ path: `${OUT}/${file}.png` });
  }

  // Hotspot desde el panel → cámara + despiece.
  await page.click('.lab__item-btn:has-text("Soporte")');
  await page.waitForTimeout(2200);
  out.push(
    "panel Soporte: expanded=" +
      (await page.getAttribute('.lab__item-btn:has-text("Soporte")', "aria-expanded")) +
      " despiece=" +
      (await page.getAttribute(".lab__view--explode", "aria-pressed")) +
      " · " +
      (await hotspots(page))
  );
  await page.screenshot({ path: `${OUT}/lab-05-soporte-despiece.png` });

  // Hotspot sobre el modelo (botón real en el DOM).
  await page.click('.lab__item-btn:has-text("Confort")');
  await page.waitForTimeout(1800);
  const hs = page.locator('.lab__hotspot[data-visible="true"]').first();
  out.push("hotspots visibles sobre el modelo=" + (await page.locator('.lab__hotspot[data-visible="true"]').count()));
  await hs.click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/lab-06-confort.png` });

  // La rueda sobre el canvas debe seguir desplazando la página.
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(1200);
  out.push("rueda sobre el canvas desplaza la página=" + ((await page.evaluate(() => window.scrollY)) > y0 + 100));

  out.push("errores escritorio: " + (errs.length ? errs.join(" | ") : "ninguno"));
  await ctx.close();
}

// ---------- Móvil ----------
{
  const { ctx, page, errs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await toLab(page, 0.12);
  await page.waitForSelector(".lab__stage.is-ready", { timeout: 15000 });
  await page.waitForTimeout(1800);
  out.push("móvil: cobertura=" + (await coverage(page)) + "% touch-action=" + (await page.evaluate(() => getComputedStyle(document.querySelector(".lab__canvas")).touchAction)));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  out.push("móvil: overflow horizontal=" + overflow + "px");
  await page.screenshot({ path: `${OUT}/lab-07-movil.png` });
  out.push("errores móvil: " + (errs.length ? errs.join(" | ") : "ninguno"));
  await ctx.close();
}

// ---------- Sin WebGL ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (String(type).startsWith("webgl")) return null;
      return orig.call(this, type, ...rest);
    };
  });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await toLab(page);
  await page.waitForSelector(".lab__fallback", { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.click('.lab__item-btn:has-text("Materiales")');
  out.push(
    "sin WebGL: fallback visible=" +
      (await page.locator(".lab__fallback").isVisible()) +
      " panel funciona=" +
      (await page.getAttribute('.lab__item-btn:has-text("Materiales")', "aria-expanded"))
  );
  await page.screenshot({ path: `${OUT}/lab-08-sin-webgl.png` });
  out.push("errores sin WebGL: " + (errs.length ? errs.join(" | ") : "ninguno"));
  await ctx.close();
}

console.log(out.join("\n"));
await browser.close();
