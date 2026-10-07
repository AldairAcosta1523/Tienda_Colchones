/**
 * QA de navegación entre páginas (build de producción):
 *   npx next start -p 3013 && URL=http://localhost:3013 node scripts/nav-qa.mjs
 *
 * Para cada salto mide cuánto tarda en cambiar la URL y en quedar visible el h1, comprueba que
 * la página nueva empieza arriba y que la rueda del ratón desplaza desde ahí (y no desde la
 * posición de la página anterior, el fallo típico de Lenis con el router de Next).
 */
import { chromium } from "playwright";

const base = (process.env.URL || "http://localhost:3013").replace(/\/$/, "");
const fallos = [];
const ok = (cond, msg) => {
  console.log(`${cond ? "  ok  " : " FALLA"} ${msg}`);
  if (!cond) fallos.push(msg);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(e.message));
page.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 160)));

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

// Primero se baja en la home: así se nota si la página siguiente hereda el scroll.
await page.mouse.wheel(0, 2400);
await page.waitForTimeout(1200);

const saltos = [
  ["/tienda/", 'nav a[href="/tienda/"]'],
  ["/producto/esencial/", 'main a[href="/producto/esencial/"]:visible'],
  ["/nosotros/", 'nav a[href="/nosotros/"]'],
  ["/guia/", 'nav a[href="/guia/"]'],
  ["/colchones/", 'nav a[href="/colchones/"]'],
  ["/contacto/", 'nav a[href="/contacto/"]'],
  ["/", "a.nav__logo"],
];

for (const [ruta, sel] of saltos) {
  // La cabecera se esconde al bajar: un gesto corto hacia arriba la trae, como haría alguien.
  await page.mouse.wheel(0, -160);
  await page.waitForTimeout(700);
  const link = page.locator(sel).first();
  const t0 = Date.now();
  await link.click();
  await page.waitForURL(`${base}${ruta}`, { timeout: 15000 });
  const tUrl = Date.now() - t0;
  // h1 visible de verdad: opacidad 1 y sin desplazamiento pendiente de su revelado.
  await page.waitForFunction(
    () => {
      const h = document.querySelector("main h1");
      if (!h) return false;
      const r = h.getBoundingClientRect();
      const lines = h.querySelectorAll(".split-line > *, .split-line");
      const quieto = [...lines].every((l) => {
        const m = new DOMMatrix(getComputedStyle(l).transform);
        return Math.abs(m.m42) < 1;
      });
      return r.height > 0 && getComputedStyle(h).opacity === "1" && quieto;
    },
    null,
    { timeout: 15000 }
  );
  const tH1 = Date.now() - t0;
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(900);
  const y1 = await page.evaluate(() => window.scrollY);
  console.log(`  ${ruta.padEnd(22)} url ${String(tUrl).padStart(4)} ms · h1 ${String(tH1).padStart(4)} ms · scroll ${y0} → ${y1}`);
  ok(y0 < 5, `${ruta}: la página nueva empieza arriba (scrollY ${y0})`);
  ok(y1 > 150 && y1 < 900, `${ruta}: la rueda desplaza desde arriba (scrollY ${y1})`);
  ok(tH1 < 1500, `${ruta}: titular visible en menos de 1,5 s (${tH1} ms)`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

ok(errores.length === 0, `sin errores de consola${errores.length ? `: ${errores.join(" | ")}` : ""}`);
await browser.close();
console.log(fallos.length ? `\n${fallos.length} fallo(s)` : "\nTodo en orden");
process.exit(fallos.length ? 1 : 0);
