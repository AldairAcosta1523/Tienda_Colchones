/**
 * QA de animaciones ligadas al scroll.
 *
 * Coloca cada sección en posiciones concretas del viewport (bajando y volviendo a subir),
 * captura la pantalla y anota los valores calculados de las propiedades animadas.
 *   OUT=./shots node scripts/scrub.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.URL || "http://localhost:3011";
const OUT = process.env.OUT || "./shots";
fs.mkdirSync(OUT, { recursive: true });

/** Secciones a comprobar: selector, propiedad observada y fracciones del viewport. */
const CASES = [
  { name: "immersive", sel: ".immersive", watch: [[".immersive__frame", "clipPath"], [".immersive__img", "transform"]], stops: [0.9, 0.6, 0.3, 0.05, -0.4] },
  { name: "guide", sel: ".guide", watch: [[".guide__veil", "transform"]], stops: [0.95, 0.7, 0.45, 0.2, -0.3] },
  { name: "final", sel: ".final", watch: [[".final__media", "transform"]], stops: [0.9, 0.5, 0.1] },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

/** Sitúa el borde superior de la sección en `frac` de la altura del viewport. */
async function place(sel, frac) {
  await page.evaluate(
    ([sel, frac]) => {
      const el = document.querySelector(sel);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const y = Math.max(0, top - window.innerHeight * frac);
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
    },
    [sel, frac]
  );
  await page.waitForTimeout(450);
}

for (const c of CASES) {
  for (const [i, frac] of c.stops.entries()) {
    await place(c.sel, frac);
    const values = await page.evaluate(
      (watch) =>
        watch.map(([sel, prop]) => {
          const el = document.querySelector(sel);
          if (!el) return `${sel}: (ausente)`;
          const v = getComputedStyle(el)[prop];
          return `${sel}.${prop} = ${String(v).slice(0, 80)}`;
        }),
      c.watch
    );
    console.log(`${c.name} @ top=${frac} ->\n  ${values.join("\n  ")}`);
    await page.screenshot({ path: `${OUT}/scrub-${c.name}-${i}.png` });
  }
  // Vuelta hacia arriba: comprueba que la animación es reversible.
  await place(c.sel, 0.9);
  const back = await page.evaluate(
    (watch) => watch.map(([sel, prop]) => `${sel}.${prop} = ${String(getComputedStyle(document.querySelector(sel))[prop]).slice(0, 80)}`),
    c.watch
  );
  console.log(`${c.name} (de vuelta arriba) ->\n  ${back.join("\n  ")}`);
  await page.screenshot({ path: `${OUT}/scrub-${c.name}-back.png` });
}

console.log("errores:", errs.length ? errs.join(" | ") : "ninguno");
await browser.close();
