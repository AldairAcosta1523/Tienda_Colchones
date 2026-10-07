/**
 * Auditoría de accesibilidad (axe-core, WCAG 2.1 AA) de todas las páginas, en escritorio y móvil.
 *   URL=http://localhost:3013 node scripts/a11y.mjs
 *
 * Recorre cada página hasta el final antes de auditar, para que todas las entradas animadas
 * hayan terminado (si no, axe mediría el contraste de textos a medio fundido).
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base = (process.env.URL || "http://localhost:3013").replace(/\/$/, "");
const rutas = (process.env.PATHS || "/,/tienda/,/colchones/,/comparar/,/favoritos/,/guia/,/producto/esencial/,/producto/brisa/,/producto/almohada-nube/,/nosotros/,/faq/,/contacto/,/carrito/,/checkout/,/politicas/envio/").split(",");
const browser = await chromium.launch();
const vistas = [
  { nombre: "escritorio", viewport: { width: 1440, height: 900 } },
  { nombre: "móvil", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

const resumen = new Map();
for (const v of vistas) {
  const ctx = await browser.newContext({ viewport: v.viewport, isMobile: v.isMobile, hasTouch: v.hasTouch });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("almara:intro", "1"); } catch {} });
  const page = await ctx.newPage();
  for (const ruta of rutas) {
    await page.goto(`${base}${ruta}`, { waitUntil: "networkidle" });
    const alto = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= alto; y += 600) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
    for (const viol of r.violations) {
      const k = `${viol.id} · ${viol.impact}`;
      const e = resumen.get(k) ?? { ayuda: viol.help, sitios: [] };
      for (const n of viol.nodes.slice(0, 3)) e.sitios.push(`${v.nombre} ${ruta} → ${n.target.join(" ")}${n.any?.[0]?.message ? ` (${n.any[0].message.slice(0, 110)})` : ""}`);
      resumen.set(k, e);
    }
  }
  await ctx.close();
}
await browser.close();

if (!resumen.size) console.log("Sin incumplimientos WCAG 2.1 AA");
for (const [k, e] of resumen) {
  console.log(`\n${k}: ${e.ayuda}`);
  [...new Set(e.sitios)].slice(0, 8).forEach((s) => console.log(`   ${s}`));
}
process.exit(resumen.size ? 1 : 0);
