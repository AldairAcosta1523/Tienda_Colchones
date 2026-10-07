/**
 * Interacción de tarjetas, carrito, cabecera y comparador (teclado, táctil, foco, anchos).
 *   URL=http://localhost:3011 node scripts/interaccion-qa.mjs
 */
import { chromium } from "playwright";
const BASE = (process.env.URL || "http://localhost:3011").replace(/\/$/, "");
const b = await chromium.launch(); const out = []; let fallos = 0;
const ok = (c, m, d = "") => { out.push(`${c ? "  ok  " : " FALLA"} ${m}${d ? " · " + d : ""}`); if (!c) fallos++; };

// IA-1: ancho estable al confirmar (menú y medida única)
{
  const p = await b.newPage({ viewport: { width: 1366, height: 800 } });
  await p.goto(BASE + "/tienda/", { waitUntil: "load" }); await p.waitForTimeout(1500);
  const btn = p.locator(".pcard").first().locator(".pcard__añadir");
  const w0 = (await btn.boundingBox()).width;
  await btn.click(); await p.waitForTimeout(300);
  await p.locator('[role="menuitem"]').first().click(); await p.waitForTimeout(250);
  const w1 = (await btn.boundingBox()).width; const txt = await btn.innerText();
  ok(Math.abs(w1 - w0) < 0.5 && /Añadido/.test(txt), "menú: «Añadido» no cambia el ancho", `${w0.toFixed(1)} → ${w1.toFixed(1)}`);
  // IA-5: foco inicial en el título del carrito
  const foco = await p.evaluate(() => document.activeElement?.className || "");
  ok(/drawer__titulo/.test(foco), "carrito: el foco inicial va al título, no al +1", foco.slice(0, 60));
  const nombre = await btn.evaluate((el) => el.innerText);
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.activeElement?.classList.contains("pcard__añadir")), "carrito: al cerrar, el foco vuelve a la tarjeta");
  await p.goto(BASE + "/colchones/?medida=Plaza%20y%20media", { waitUntil: "load" }); await p.waitForTimeout(1500);
  const b2 = p.locator(".pcard").first().locator(".pcard__añadir");
  const v0 = (await b2.boundingBox()).width; await b2.click(); await p.waitForTimeout(250);
  const v1 = (await b2.boundingBox()).width;
  ok(Math.abs(v1 - v0) < 0.5, "medida única: «Añadido» no cambia el ancho", `${v0.toFixed(1)} → ${v1.toFixed(1)}`);
  await p.keyboard.press("Escape"); await p.waitForTimeout(2200);
  const accName2 = (await p.locator(".pcard").first().locator(".pcard__añadir").ariaSnapshot()).replace(/\s+/g, " ");
  const durante = await (async () => { await b2.click(); await p.waitForTimeout(200); const t = (await b2.ariaSnapshot()).replace(/\s+/g, " "); await p.keyboard.press("Escape"); return t; })();
  ok(/Añadir Plaza y media/.test(accName2) && !/Añadido/.test(accName2), "medida única: el nombre accesible solo incluye la etiqueta visible", `${accName2.slice(0, 70)} | ${durante.slice(0, 50)}`);
  await p.evaluate(() => localStorage.clear());
  await p.close();
}

// IA-2: segundo toque cierra el menú
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE + "/tienda/", { waitUntil: "load" }); await p.waitForTimeout(1500);
  const btn = p.locator(".pcard").first().locator(".pcard__añadir");
  await btn.scrollIntoViewIfNeeded(); await btn.tap(); await p.waitForTimeout(400);
  const abierto = await p.locator('[role="menu"]').count();
  await btn.tap(); await p.waitForTimeout(400);
  const cerrado = await p.locator('[role="menu"]').count();
  await btn.tap(); await p.waitForTimeout(400);
  const reabierto = await p.locator('[role="menu"]').count();
  ok(abierto === 1 && cerrado === 0 && reabierto === 1, "táctil: tocar el botón abre, vuelve a tocar y cierra", `${abierto}/${cerrado}/${reabierto}`);
  await ctx.close();
}

// IA-3: megamenú con teclado
{
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  await p.goto(BASE + "/tienda/", { waitUntil: "load" }); await p.waitForTimeout(1800);
  await p.locator(".nav__dd-btn").focus(); await p.waitForTimeout(400);
  const abre = await p.locator(".mega.is-open").count();
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  const cierraEsc = await p.locator(".mega.is-open").count();
  const focoEnBtn = await p.evaluate(() => document.activeElement?.classList.contains("nav__dd-btn"));
  ok(abre === 1 && cierraEsc === 0 && focoEnBtn, "megamenú: el foco lo abre, Escape lo cierra y deja el foco en «Colchones»");
  await p.keyboard.press("Tab"); await p.waitForTimeout(300);
  for (let i = 0; i < 12; i++) await p.keyboard.press("Tab");
  await p.waitForTimeout(400);
  const fueraNav = await p.evaluate(() => !document.activeElement?.closest("header"));
  const megaTrasSalir = await p.locator(".mega.is-open").count();
  ok(!fueraNav || megaTrasSalir === 0, "megamenú: se cierra cuando el foco sale de la cabecera", `foco fuera=${fueraNav}, abierto=${megaTrasSalir}`);
  // Cabecera escondida + foco dentro → visible
  await p.evaluate(() => window.scrollTo(0, 1600)); await p.waitForTimeout(300);
  await p.mouse.wheel(0, 400); await p.waitForTimeout(900);
  const oculta = await p.evaluate(() => document.querySelector(".nav").classList.contains("is-hidden"));
  await p.locator(".nav__logo").focus(); await p.waitForTimeout(700);
  const top = await p.evaluate(() => document.querySelector(".nav").getBoundingClientRect().top);
  ok(!oculta || top >= -1, "cabecera escondida: vuelve a verse cuando recibe el foco", `oculta=${oculta}, top=${Math.round(top)}`);
  await p.close();
}

// IA-4: la barra del comparador no tapa el foco
{
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  await p.goto(BASE + "/colchones/", { waitUntil: "load" }); await p.waitForTimeout(1500);
  await p.locator(".pcard__cmp").nth(0).click(); await p.locator(".pcard__cmp").nth(1).click(); await p.waitForTimeout(400);
  let tapados = 0;
  for (let i = 0; i < 70; i++) {
    await p.keyboard.press("Tab"); await p.waitForTimeout(40);
    const r = await p.evaluate(() => {
      const el = document.activeElement; const bar = document.querySelector(".cmp-barra");
      if (!el || !bar || bar.contains(el) || el === document.body) return false;
      const a = el.getBoundingClientRect(), c = bar.getBoundingClientRect();
      return a.bottom > c.top + 2 && a.top < c.bottom && a.right > c.left && a.left < c.right;
    });
    if (r) tapados++;
  }
  ok(tapados === 0, "barra del comparador: ningún control enfocado queda debajo", `tapados=${tapados}`);
  await p.evaluate(() => localStorage.clear());
  await p.close();
}

// Bajos: favoritos sin columna vacía, nota de precio sin partir
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + "/colchones/", { waitUntil: "load" }); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) await p.locator(".pcard__fav").nth(i).click();
  await p.goto(BASE + "/favoritos/", { waitUntil: "load" }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const g = document.querySelector(".favoritos__grid").getBoundingClientRect(); const c = [...document.querySelectorAll(".favoritos__grid .pcard")].map((x) => x.getBoundingClientRect()); return { cols: getComputedStyle(document.querySelector(".favoritos__grid")).gridTemplateColumns.split(" ").length, hueco: Math.round(g.right - Math.max(...c.map((x) => x.right))) }; });
  ok(r.cols === 3 && r.hueco < 2, "favoritos: tres guardados llenan la fila", JSON.stringify(r));
  await p.goto(BASE + "/colchones/?medida=Plaza%20y%20media&max=3000", { waitUntil: "load" }); await p.waitForTimeout(1500);
  const lineas = await p.evaluate(() => { const n = document.querySelector(".filtros .filtros__rango-nota .nowrap"); return n.getClientRects().length; });
  ok(lineas === 1, "filtro de precio: «Plaza y media» no se parte", `rects=${lineas}`);
  await p.evaluate(() => localStorage.clear());
  await p.close();
}
await b.close();
console.log(out.join("\n")); console.log(fallos ? `\n${fallos} fallo(s)` : "\nTodo en orden");
process.exitCode = fallos ? 1 : 0;
