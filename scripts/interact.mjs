/**
 * QA de interacción (Playwright): navegación, anclas, FAQ, formulario de demostración,
 * menú móvil, página de modelo y prefers-reduced-motion.
 *   OUT=./shots node scripts/interact.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.URL || "http://localhost:3011";
const OUT = process.env.OUT || "./shots";
const browser = await chromium.launch();
const out = [];

/** Espera a que el ancla quede bajo la barra (64 px) en vez de medir tras un tiempo fijo. */
const settled = (page, sel) =>
  page
    .waitForFunction((s) => Math.abs(document.querySelector(s).getBoundingClientRect().top - 64) < 3, sel, { timeout: 6000 })
    .then(() => true)
    .catch(() => false);

// ---------- Escritorio: anclas, desplegable, FAQ, formulario ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  // Lenis (y GSAP) se cargan tras `load` y un hueco libre: se espera a que existan.
  await page.waitForFunction(() => !!window.__lenis, null, { timeout: 10000 });

  await page.click("nav.nav__links a[href='#faq']");
  out.push("nav→faq asentado=" + (await settled(page, "#faq")) + " top=" + (await page.evaluate(() => Math.round(document.querySelector("#faq").getBoundingClientRect().top))));

  await page.click(".faq__item:nth-child(3) .faq__q");
  await page.waitForTimeout(800);
  out.push(
    "faq item 3 expanded=" +
      (await page.evaluate(() => document.querySelector(".faq__item:nth-child(3) .faq__q").getAttribute("aria-expanded")))
  );

  await page.evaluate(() => window.__lenis.scrollTo(0, { immediate: true }));
  await page.waitForTimeout(400);
  await page.hover(".nav__dd-btn");
  await page.waitForTimeout(700);
  out.push("dropdown items=" + (await page.locator(".nav__dd-item").count()));

  await page.keyboard.press("Escape");
  await page.click(".hero__ctas a[href='#coleccion']");
  out.push("hero cta→coleccion asentado=" + (await settled(page, "#coleccion")) + " top=" + (await page.evaluate(() => Math.round(document.querySelector("#coleccion").getBoundingClientRect().top))));

  // Cursor contextual sobre la fotografía de producto.
  await page.evaluate(() => document.querySelector("#coleccion").scrollIntoView());
  await page.waitForTimeout(1200);
  await page.hover(".product__media");
  await page.waitForTimeout(600);
  out.push(
    "cursor sobre producto: estado=" +
      (await page.getAttribute(".cursor", "data-state")) +
      " etiqueta=" +
      (await page.textContent(".cursor__label"))
  );

  // Momento inmersivo: la foto termina a sangre y el titular queda visible.
  await page.evaluate(() => {
    const el = document.querySelector(".immersive");
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.05;
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
  });
  await page.waitForTimeout(1400);
  out.push(
    "inmersivo: clip=" +
      (await page.evaluate(() => getComputedStyle(document.querySelector(".immersive__frame")).clipPath)) +
      " titulo visible=" +
      (await page.evaluate(() => {
        const inner = document.querySelector(".immersive__title .split-line__inner");
        return getComputedStyle(inner).transform === "none" || getComputedStyle(inner).transform.endsWith(", 0)");
      }))
  );

  // Formulario de demostración: arma el texto en el navegador, sin envío.
  await page.evaluate(() => document.querySelector("#consulta").scrollIntoView());
  await page.waitForTimeout(1200);
  await page.fill("input[name=name]", "Ana Pérez");
  await page.fill("input[name=email]", "ana@ejemplo.pe");
  await page.fill("textarea[name=message]", "¿Qué firmeza me conviene si duermo de lado?");
  const requests = [];
  page.on("request", (r) => r.method() === "POST" && requests.push(r.url()));
  await page.click(".form__submit");
  await page.waitForTimeout(600);
  out.push("form result visible=" + (await page.locator(".form__result").isVisible()) + " posts=" + requests.length);

  out.push("errores escritorio: " + (errs.length ? errs.join(" | ") : "ninguno"));
  await page.close();
}

// ---------- Móvil: menú ----------
{
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.click(".nav__burger");
  await page.waitForTimeout(900);
  out.push("menú abierto=" + (await page.evaluate(() => document.querySelector(".nav").classList.contains("is-open"))));
  await page.screenshot({ path: `${OUT}/mobile-menu.png` });
  await page.click(".nav__menu a[href='#nosotros']");
  // El scroll suave dura 1.4 s y puede añadir una pasada de corrección: se espera a que asiente.
  const ok = await settled(page, "#nosotros");
  out.push(
    "menú→nosotros abierto=" +
      (await page.evaluate(() => document.querySelector(".nav").classList.contains("is-open"))) +
      " asentado=" +
      ok +
      " top=" +
      (await page.evaluate(() => Math.round(document.querySelector("#nosotros").getBoundingClientRect().top)))
  );
  out.push("errores móvil: " + (errs.length ? errs.join(" | ") : "ninguno"));
  await page.close();
}

// ---------- Página de modelo: navegación entre modelos ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(`${BASE}/colchones/esencial/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  out.push("modelo h1=" + (await page.textContent("h1")).trim());
  await page.click(".mhero__ctas a[href='#construccion']");
  out.push("→construcción asentado=" + (await settled(page, "#construccion")) + " top=" + (await page.evaluate(() => Math.round(document.querySelector("#construccion").getBoundingClientRect().top))));
  await page.click(".others__grid .other__link");
  await page.waitForTimeout(2500);
  out.push("otro modelo url=" + page.url().replace(BASE, "") + " h1=" + (await page.textContent("h1")).trim());
  out.push("errores modelo: " + (errs.length ? errs.join(" | ") : "ninguno"));
  await page.close();
}

// ---------- prefers-reduced-motion ----------
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    // El nodo permanece en el DOM (evita "Invalid scope" en GSAP) pero debe estar oculto.
    preloaderVisible: (() => {
      const el = document.querySelector(".preloader");
      return !!el && getComputedStyle(el).display !== "none";
    })(),
    lenis: !!window.__lenis,
    h1: getComputedStyle(document.querySelector(".hero__title .split-line__inner")).transform,
    heroVisible: getComputedStyle(document.querySelector(".hero__media")).opacity,
  }));
  out.push("reduced-motion " + JSON.stringify(r));
  out.push("errores reduced: " + (errs.length ? errs.join(" | ") : "ninguno"));
  await page.close();
}

console.log(out.join("\n"));
await browser.close();
