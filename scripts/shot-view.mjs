/** Captura del viewport (no de página completa) en uno o varios puntos de scroll.
 *  URL=... W=1440 H=900 SEL="#lab" OUT=./shots NAME=lab node scripts/shot-view.mjs */
import { chromium } from "playwright";
import fs from "node:fs";

const url = process.env.URL || "http://localhost:3011/";
const W = +(process.env.W || 1440);
const H = +(process.env.H || 900);
const out = process.env.OUT || "./shots";
const name = process.env.NAME || "view";
const sels = (process.env.SEL || "").split(",").filter(Boolean);
const offset = +(process.env.OFFSET || 0);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  isMobile: W < 700,
  hasTouch: W < 700,
});
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
if (!sels.length) {
  await page.screenshot({ path: `${out}/${name}-${W}.png` });
} else {
  for (const [i, sel] of sels.entries()) {
    const y = await page.evaluate(
      ([s, o]) => {
        const el = document.querySelector(s);
        return el ? el.getBoundingClientRect().top + window.scrollY + o : -1;
      },
      [sel, offset]
    );
    if (y < 0) {
      console.log(`no existe ${sel}`);
      continue;
    }
    // Se baja por tramos para que los reveals ligados al scroll se disparen como en uso real.
    const from = await page.evaluate(() => window.scrollY);
    for (let k = 1; k <= 6; k++) {
      await page.evaluate((yy) => window.scrollTo(0, yy), from + ((y - from) * k) / 6);
      await page.waitForTimeout(160);
    }
    await page.waitForTimeout(+(process.env.SETTLE || 1500));
    await page.screenshot({ path: `${out}/${name}-${W}-${i}.png` });
  }
}
if (logs.length) console.log(logs.join("\n"));
await browser.close();
