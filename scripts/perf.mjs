/**
 * Medición de fluidez al desplazarse.
 *
 * Recorre la página con eventos de rueda reales (los que consume Lenis) y anota la duración de
 * cada fotograma junto a la sección que había en pantalla. Devuelve, por sección, el fotograma
 * más lento, la media y cuántos fotogramas pasan de 32 ms (por debajo de 30 fps).
 *
 *   OUT=./shots node scripts/perf.mjs
 *   WEBGL=off node scripts/perf.mjs    → aísla el coste que no es del 3D
 */
import { chromium } from "playwright";

const BASE = process.env.URL || "http://localhost:3011";
const NO_WEBGL = process.env.WEBGL === "off";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

if (NO_WEBGL) {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...r) {
      return String(t).startsWith("webgl") ? null : orig.call(this, t, ...r);
    };
  });
}

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
// Lenis y GSAP se cargan tras `load` y un hueco libre: la medición empieza cuando existen.
await page.waitForFunction(() => !!window.__lenis && !!window.__ST, null, { timeout: 10000 });

// Grabador: un fotograma = un rAF. Se etiqueta con la sección visible en ese momento.
await page.evaluate(() => {
  window.__frames = [];
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({
    entryTypes: ["longtask"],
  });
  const secciones = [...document.querySelectorAll("main > section, footer")];
  let prev = performance.now();
  const tick = (t) => {
    const mitad = window.innerHeight / 2;
    const visible = secciones.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= mitad && r.bottom >= mitad;
    });
    window.__frames.push([t - prev, visible ? visible.className.split(" ")[0] : "?"]);
    prev = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

// Recorrido completo con rueda, a ritmo constante.
const alto = await page.evaluate(() => document.documentElement.scrollHeight);
await page.mouse.move(720, 450);
const pasos = Math.ceil(alto / 260);
for (let i = 0; i < pasos; i++) {
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(55);
}
await page.waitForTimeout(600);

const datos = await page.evaluate(() => ({ frames: window.__frames, long: window.__long }));
const porSeccion = new Map();
for (const [dur, sec] of datos.frames) {
  if (dur > 500) continue; // descartes por pausas del navegador
  const e = porSeccion.get(sec) || { n: 0, suma: 0, max: 0, lentos: 0 };
  e.n++;
  e.suma += dur;
  e.max = Math.max(e.max, dur);
  if (dur > 32) e.lentos++;
  porSeccion.set(sec, e);
}

console.log(`modo: ${NO_WEBGL ? "SIN WebGL (aísla el 3D)" : "con 3D"}`);
console.log(`${"sección".padEnd(14)} ${"frames".padStart(6)} ${"media".padStart(7)} ${"peor".padStart(7)} ${"<30fps".padStart(7)}`);
for (const [sec, e] of [...porSeccion.entries()].sort((a, b) => b[1].suma / b[1].n - a[1].suma / a[1].n)) {
  const pct = ((e.lentos / e.n) * 100).toFixed(0);
  console.log(`${sec.padEnd(14)} ${String(e.n).padStart(6)} ${(e.suma / e.n).toFixed(1).padStart(6)}ms ${e.max.toFixed(0).padStart(6)}ms ${(pct + "%").padStart(7)}`);
}
const largas = datos.long.filter((d) => d > 50);
console.log(`tareas largas (>50ms): ${largas.length}${largas.length ? " → " + largas.slice(0, 8).join(", ") + "ms" : ""}`);
console.log(`ScrollTriggers activos: ${await page.evaluate(() => window.__ST.getAll().length)}`);

await browser.close();
