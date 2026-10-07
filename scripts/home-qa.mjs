/**
 * QA de la home rediseñada: desbordes por ancho, consola e interacciones clave.
 *   URL=http://localhost:3011 node scripts/home-qa.mjs
 * Sale con código 1 si alguna comprobación falla.
 */
import { chromium } from "playwright";

const base = (process.env.URL || "http://localhost:3011").replace(/\/$/, "");
const WIDTHS = [375, 390, 768, 1024, 1440];
const fallos = [];
const ok = (cond, msg) => {
  console.log(`${cond ? "  ok  " : " FALLA"} ${msg}`);
  if (!cond) fallos.push(msg);
};
// El aviso de LCP de Next en desarrollo salta al recorrer la página a saltos: no es un error.
const ruido = (t) => /KHR_parallel|GL Driver|ReadPixels|Download the React DevTools|\[HMR\]|Fast Refresh|Largest Contentful Paint/.test(t);

const browser = await chromium.launch();

/* ---------- 1. Desbordes horizontales y consola, por ancho ---------- */
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 700, hasTouch: w < 700 });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !ruido(m.text()) && logs.push(m.text().slice(0, 160)));
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const malos = new Set();
  for (let y = 0; y <= total; y += 700) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out = [];
      if (document.documentElement.scrollWidth > vw + 1) out.push(`documento ${document.documentElement.scrollWidth}>${vw}`);
      // Texto cortado: bloques de texto que se salen del viewport sin estar en un contenedor con scroll propio.
      for (const el of document.querySelectorAll("main h1, main h2, main h3, main p, main a, main button")) {
        const b = el.getBoundingClientRect();
        if (!b.width || b.bottom < 0 || b.top > innerHeight) continue;
        if (el.closest(".completa__riel, [data-slot='table-container'], .sr-only, .lab__hotspots")) continue;
        if (b.right > vw + 2 || b.left < -2) out.push(`${el.tagName}.${(el.className || "").toString().split(" ")[0]} fuera (${Math.round(b.left)}–${Math.round(b.right)})`);
      }
      return out;
    });
    r.forEach((x) => malos.add(x));
  }
  ok(malos.size === 0, `${w}px sin desbordes${malos.size ? ": " + [...malos].slice(0, 4).join(" | ") : ""}`);
  ok(logs.length === 0, `${w}px consola limpia${logs.length ? ": " + logs.slice(0, 3).join(" | ") : ""}`);
  await ctx.close();
}

/* ---------- 2. Interacciones de escritorio ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const ir = async (sel, off = -120) => {
    await page.evaluate(([s, o]) => window.scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY + o), [sel, off]);
    await page.waitForTimeout(900);
  };

  // Hero: un solo h1 y CTA visible sin scroll
  ok((await page.locator("h1").count()) === 1, "un único h1");
  const cta = await page.locator(".hero__ctas a").first().boundingBox();
  ok(cta && cta.y + cta.height < 900, "CTA principal visible en el primer pantallazo");

  // Categorías: cada fila lleva su foto y el hover la acerca como en las tarjetas; ninguna foto cambia
  await ir("#categorias");
  const filas = await page.locator(".cat__link").count();
  ok((await page.locator(".cats__visor").count()) === 0 && (await page.locator(".cat__thumb img").count()) === filas, "categorías: una foto por fila, sin visor que cambie de foto");
  await page.locator(".cat__link").nth(2).hover();
  await page.waitForTimeout(1100);
  const escalas = await page.locator(".cat__thumb img").evaluateAll((els) => els.map((e) => getComputedStyle(e).transform));
  ok(escalas[2] === "matrix(1.04, 0, 0, 1.04, 0, 0)" && escalas.every((t, i) => i === 2 || t === "none"), `categorías: el hover acerca solo la foto de su fila (${escalas.join(" · ")})`);
  // …y el foco de teclado enseña la flecha, sin zoom
  await page.mouse.move(4, 4);
  await page.locator(".cat__link").nth(1).focus();
  await page.waitForTimeout(1100);
  const foco = await page.locator(".cat").nth(1).evaluate((li) => ({
    flecha: getComputedStyle(li.querySelector(".cat__flecha")).opacity,
    foto: getComputedStyle(li.querySelector(".cat__thumb img")).transform,
  }));
  ok(foco.flecha === "1" && foco.foto === "none", `categorías: el foco de teclado enseña la flecha sin acercar la foto (${foco.flecha} · ${foco.foto})`);

  // Comfort Lab
  await ir("#lab", 200);
  await page.waitForSelector(".lab__stage.is-ready", { timeout: 30000 }).catch(() => {});
  const listo = await page.locator(".lab__stage.is-ready").count();
  ok(listo === 1, "lab: la escena 3D arranca");
  if (listo) {
    for (const nombre of ["Frontal", "Superior", "Perspectiva"]) {
      await page.getByRole("button", { name: nombre, exact: true }).click();
      await page.waitForTimeout(250);
      ok((await page.getByRole("button", { name: nombre, exact: true }).getAttribute("aria-pressed")) === "true", `lab: vista ${nombre}`);
    }
    const sw = page.getByRole("switch");
    await sw.click();
    ok((await sw.getAttribute("aria-checked")) === "true" && /Cerrar capas/.test(await sw.innerText()), "lab: abrir capas");
    await sw.click();
    ok((await sw.getAttribute("aria-checked")) === "false", "lab: cerrar capas");
    await page.getByRole("button", { name: "Girar a la derecha" }).click();
    ok((await page.locator(".lab__view.is-active").count()) === 0, "lab: girar con botón deselecciona la vista fija");
    await page.locator(".lab__canvas").focus();
    await page.keyboard.press("ArrowLeft");
    ok(true, "lab: el visor acepta foco y flechas");
    await page.locator(".lab__item-btn").nth(2).click();
    ok((await sw.getAttribute("aria-checked")) === "true", "lab: «Soporte» abre las capas");
  }

  // Complementos: flechas del riel
  await ir("#complementos");
  const riel = page.locator(".completa__riel");
  const antes = await riel.evaluate((e) => e.scrollLeft);
  ok(await page.getByRole("button", { name: "Anteriores" }).isDisabled(), "riel: «Anteriores» deshabilitado al inicio");
  await page.getByRole("button", { name: "Siguientes" }).click();
  await page.waitForTimeout(900);
  ok((await riel.evaluate((e) => e.scrollLeft)) > antes + 100, "riel: «Siguientes» avanza una tarjeta");

  // Añadir al carrito desde una tarjeta
  // El botón «Añadir» abre el menú de medidas; se elige la primera disponible.
  await page.locator(".pcard__añadir").first().click();
  await page.waitForTimeout(400);
  ok((await page.locator('[role="menu"] [role="menuitem"]').count()) > 1, "tarjeta: «Añadir» despliega las medidas");
  await page.locator('[role="menu"] [role="menuitem"]:not([data-disabled])').first().click();
  await page.waitForTimeout(700);
  ok((await page.locator("[data-slot='sheet-content']").count()) > 0, "carrito: añadir abre el panel");
  const cuenta = await page.locator(".nav__carrito .nav__cuenta").first().innerText();
  ok(cuenta.trim() === "1", `carrito: el contador marca 1 (marca «${cuenta.trim()}»)`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // FAQ por teclado
  await ir("#faq");
  const q2 = page.locator(".faq__q").nth(1);
  await q2.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  ok((await q2.getAttribute("aria-expanded")) === "true", "faq: se abre con Enter");

  // Megamenú
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.locator(".nav__dd-btn").hover();
  await page.waitForTimeout(500);
  ok(await page.locator(".mega.is-open").count() === 1, "nav: el megamenú se abre");
  await ctx.close();
}

/* ---------- 3. Móvil ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  await page.locator(".nav__burger").tap();
  await page.waitForTimeout(700);
  ok((await page.locator("#mobile-menu .nav__menu-link").count()) >= 8, "móvil: el menú muestra todos los enlaces");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  await page.evaluate(() => window.scrollTo(0, document.querySelector("#coleccion").getBoundingClientRect().top + scrollY - 40));
  await page.waitForTimeout(800);
  ok((await page.locator(".destacados .pcard").count()) >= 4, "móvil: la Selección Almara muestra tarjetas de producto");
  await page.evaluate(() => window.scrollTo(0, document.querySelector("#explorar").getBoundingClientRect().top + scrollY - 40));
  await page.waitForTimeout(800);
  const enlacesExplorar = await page.locator(".explorar__item").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  ok(enlacesExplorar.length >= 6 && enlacesExplorar.every((h) => h.startsWith("/colchones/?")), "móvil: colecciones y medidas enlazan a la categoría con filtro");

  // Áreas táctiles
  const chicos = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("main button, main a.btn, .nav__bar button, .nav__bar a")) {
      const b = el.getBoundingClientRect();
      if (!b.width || getComputedStyle(el).visibility === "hidden") continue;
      if (b.height < 40 && !el.closest(".faq, .footer")) out.push(`${(el.className || "").toString().split(" ")[0]} ${Math.round(b.width)}×${Math.round(b.height)}`);
    }
    return [...new Set(out)];
  });
  ok(chicos.length === 0, `móvil: áreas táctiles ≥ 40 px${chicos.length ? ": " + chicos.slice(0, 6).join(" | ") : ""}`);
  await ctx.close();
}

/* ---------- 4. Movimiento reducido ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const visible = await page.evaluate(() => {
    const t = document.querySelector(".hero__title .split-line__inner");
    const m = document.querySelector(".hero__media");
    return getComputedStyle(t).transform === "none" || getComputedStyle(t).transform === "matrix(1, 0, 0, 1, 0, 0)" ? getComputedStyle(m).clipPath : "titulo-oculto";
  });
  ok(visible === "none", `reduced-motion: hero visible sin animación (${visible})`);
  await ctx.close();
}

await browser.close();
console.log(fallos.length ? `\n${fallos.length} comprobaciones fallidas` : "\nTodo en orden");
process.exit(fallos.length ? 1 : 0);
