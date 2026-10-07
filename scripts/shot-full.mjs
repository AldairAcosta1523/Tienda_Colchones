/** Captura de página completa por viewport: OUT=./shots URL=... node scripts/shot-full.mjs */
import { chromium } from "playwright";
import fs from "node:fs";

const base = (process.env.URL || "http://localhost:3011").replace(/\/$/, "");
const paths = (process.env.PATHS || "/").split(",");
const out = process.env.OUT || "./shots";
const vps = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const p of paths) {
  for (const vp of vps) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    // Recorre la página para disparar los reveals antes de capturar.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += vp.height * 0.8) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(220);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    const slug = p.replace(/\//g, "_") || "_";
    await page.screenshot({ path: `${out}/full${slug}${vp.name}.png`, fullPage: true });
    console.log(`${slug} ${vp.name} ${h}px`);
    await ctx.close();
  }
}
await browser.close();
