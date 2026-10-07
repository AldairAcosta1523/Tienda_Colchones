/**
 * Regresiones de rendimiento y carga: guía sin saltos en móvil, rejilla del servidor conservada al
 * hidratar, bandera de movimiento en el primer fotograma, cabecera con Lenis, anclas en móvil,
 * precio por medida en el buscador y listas vacías sin salto.
 *   URL=http://localhost:3011 node scripts/regresion-qa.mjs
 */
import { chromium } from "playwright";
const B = (process.env.URL || "http://localhost:3011").replace(/\/$/, "");
const b = await chromium.launch(); const out = []; let f = 0;
const ok = (c, m, d = "") => { out.push(`${c ? "  ok  " : " FALLA"} ${m}${d ? " · " + d : ""}`); if (!c) f++; };
const cls = async (p) => p.evaluate(() => new Promise((r) => { let s = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) s += e.value; }).observe({ type: "layout-shift", buffered: true }); setTimeout(() => r(s), 2500); }));

// /guia/ en móvil: sin ensanchar la página ni saltos
for (const w of [412, 360]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75 });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let maxW = 0; await p.exposeFunction("_w", (x) => { maxW = Math.max(maxW, x); });
  await p.addInitScript(() => { const t = () => { window._w?.(document.documentElement.scrollWidth); requestAnimationFrame(t); }; requestAnimationFrame(t); });
  await p.goto(B + "/guia/", { waitUntil: "load" }); const c = await cls(p);
  ok(maxW <= w + 1 && c < 0.02, `guía ${w}px: sin ensanchar ni saltar`, `ancho máx ${maxW}, CLS ${c.toFixed(3)}`);
  await ctx.close();
}
// /colchones/ y /tienda/: la rejilla del servidor no se reemplaza al hidratar
for (const ruta of ["/colchones/", "/tienda/"]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window._quitadas = 0; new MutationObserver((ms) => { for (const m of ms) for (const n of m.removedNodes) if (n.nodeType === 1 && (n.matches?.(".pcard, li") && n.querySelector?.(".pcard") || n.matches?.(".pcard"))) window._quitadas++; }).observe(document, { childList: true, subtree: true }); });
  await p.goto(B + ruta, { waitUntil: "load" }); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => ({ quitadas: window._quitadas, orden: document.querySelector("#tienda-orden")?.textContent?.trim(), n: document.querySelectorAll(".tienda__grid .pcard").length }));
  const c = await cls(p);
  ok(r.quitadas === 0 && r.n === 12 && /Recomendado/.test(r.orden) && c < 0.01, `${ruta}: la rejilla del servidor se conserva al hidratar`, JSON.stringify({ ...r, cls: +c.toFixed(3) }));
  // Con filtro en la URL se aplica tras hidratar
  await p.goto(B + ruta + "?medida=Queen&max=1500", { waitUntil: "load" }); await p.waitForTimeout(2000);
  const precios = await p.locator(".pcard__importe").allTextContents();
  ok(precios.length > 0 && precios.every((t) => parseInt(t.replace(/\D/g, "")) <= 1500), `${ruta}?medida=Queen&max=1500 se aplica tras hidratar`, precios.slice(0, 4).join(" | "));
  await ctx.close();
}
// Bandera de movimiento antes del primer pintado
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  // El primer requestAnimationFrame corre justo antes del primer fotograma: ahí la clase ya debe estar.
  await p.addInitScript(() => {
    requestAnimationFrame(() => { window._enPrimerFotograma = document.documentElement.className; });
  });
  await p.goto(B + "/", { waitUntil: "load" }); await p.waitForTimeout(500);
  const c = await p.evaluate(() => window._enPrimerFotograma || "");
  ok(c.split(" ").includes("motion") && c.split(" ").includes("intro"), "html.motion e html.intro ya están en el primer fotograma", c.split(" ").filter((x) => !x.includes("module")).join(" "));
  await p.close();
}
// Cabecera con Lenis: bajando no reaparece
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(B + "/", { waitUntil: "load" }); await p.waitForFunction(() => !!window.__lenis, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(800); let reapariciones = 0, visto = false;
  for (let i = 0; i < 14; i++) {
    await p.mouse.wheel(0, 260); await p.waitForTimeout(140);
    const h = await p.evaluate(() => document.querySelector(".nav").classList.contains("is-hidden"));
    if (h) visto = true; else if (visto) reapariciones++;
  }
  await p.waitForTimeout(900);
  const finalOculta = await p.evaluate(() => document.querySelector(".nav").classList.contains("is-hidden"));
  ok(visto && reapariciones === 0 && finalOculta, "cabecera: bajando con Lenis no reaparece", `reapariciones ${reapariciones}, al final oculta ${finalOculta}`);
  await p.mouse.wheel(0, -300); await p.waitForTimeout(900);
  ok(!(await p.evaluate(() => document.querySelector(".nav").classList.contains("is-hidden"))), "cabecera: al subir vuelve");
  await p.close();
}
// Ancla en móvil tras llegar por /#faq
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(B + "/#faq", { waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.evaluate(() => { const a = [...document.querySelectorAll('a[href="#coleccion"], a[href="/#coleccion"]')].pop(); a?.click(); });
  await p.waitForTimeout(6000);
  const top = await p.evaluate(() => Math.round(document.querySelector("#coleccion").getBoundingClientRect().top));
  ok(Math.abs(top - 80) <= 12, "móvil: ancla #coleccion desde /#faq llega", `top ${top}`);
  await ctx.close();
}
// Buscador: precio por medida y meta sin cortar en escritorio
{
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto(B + "/tienda/", { waitUntil: "load" }); await p.waitForTimeout(1200);
  await p.locator('.nav__acciones button[aria-label="Buscar productos"]').click();
  await p.keyboard.type("queen", { delay: 40 }); await p.waitForTimeout(500);
  const fila = (await p.locator('.sug [role="option"]').filter({ hasText: "Esencial" }).first().innerText()).replace(/\s+/g, " ");
  ok(/1,890/.test(fila), "buscador «queen»: Esencial a precio Queen", fila.slice(0, 90));
  const cortadas = await p.evaluate(() => [...document.querySelectorAll(".sug--cabecera .sug__meta")].filter((m) => m.scrollHeight > m.clientHeight + 1 || m.scrollWidth > m.clientWidth + 1).length);
  ok(cortadas === 0, "buscador: ninguna línea de contexto cortada en escritorio", `cortadas ${cortadas}`);
  await p.keyboard.press("Enter"); await p.waitForTimeout(2000);
  const tPrecio = (await p.locator(".pcard").filter({ hasText: "Esencial" }).first().locator(".pcard__importe").innerText()).trim();
  ok(/1,890/.test(tPrecio), "/tienda/?q=queen enseña el precio Queen", tPrecio);
  await p.goto(B + "/tienda/?q=colchon%20premium", { waitUntil: "load" }); await p.waitForTimeout(1500);
  const primeros = await p.locator(".pcard__nombre").allInnerTexts();
  ok(primeros[1] !== "Ritmo", "/tienda/?q=colchon premium ordena por relevancia", primeros.slice(0, 4).join(", "));
  await p.close();
}
// Favoritos vacío: sin salto del pie
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  for (const r of ["/favoritos/", "/comparar/"]) { await p.goto(B + r, { waitUntil: "load" }); const c = await cls(p); ok(c < 0.02, `${r} vacío: sin salto`, `CLS ${c.toFixed(3)}`); }
  await ctx.close();
}
await b.close(); console.log(out.join("\n")); console.log(f ? `\n${f} fallo(s)` : "\nTodo en orden");
process.exitCode = f ? 1 : 0;
