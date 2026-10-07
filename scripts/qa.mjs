/**
 * QA headless: recorre la página en 3 viewports, captura consola, overflow horizontal,
 * posiciones de ScrollTriggers y screenshots por tramo.
 *   OUT=./shots node scripts/qa.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";

const base = (process.env.URL || "http://localhost:3011/").replace(/\/$/, "");
const paths = (process.env.PATHS || "/,/colchones/esencial/,/colchones/natura/,/colchones/signature/").split(",");
const out = process.env.OUT || "./shots";
const settle = +(process.env.SETTLE || 700);
fs.mkdirSync(out, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "wide-short", width: 1790, height: 822, mobile: false },
  { name: "tablet", width: 834, height: 1112, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
];

const browser = await chromium.launch();
for (const path of paths) {
const url = base + path;
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: "networkidle" });
  const slug = path.replace(/\//g, "_") || "_";
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const ST = window.gsap?.plugins?.scrollTrigger || null;
    const sections = [...document.querySelectorAll("main > *, main section, .pin-spacer")].map((el) => ({
      cls: (el.className || "").toString().split(" ").slice(0, 2).join(" "),
      top: Math.round(el.getBoundingClientRect().top + window.scrollY),
      h: Math.round(el.getBoundingClientRect().height),
    }));
    return { total: document.documentElement.scrollHeight, sections };
  });
  const total = info.total;
  const steps = Math.ceil(total / (vp.height * 0.6));
  const overflow = [];
  for (let i = 0; i <= steps; i++) {
    const y = Math.min(total, i * vp.height * 0.6);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(settle);
    const o = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      const bad = [];
      if (sw > w + 1) {
        document.querySelectorAll("body *").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > w + 1 && r.width > 0 && getComputedStyle(el).visibility !== "hidden") bad.push(el.className?.toString().slice(0, 50) || el.tagName);
        });
      }
      return { sw, w, bad: [...new Set(bad)].slice(0, 8) };
    });
    if (o.sw > o.w + 1) overflow.push({ y, ...o });
    await page.screenshot({ path: `${out}/${slug}${vp.name}-${String(i).padStart(2, "0")}.png` });
  }

  console.log(`\n=== ${vp.name} ${vp.width}x${vp.height} · height ${total}px · steps ${steps}`);
  console.log("console:", logs.length ? logs.join("\n") : "clean");
  console.log("overflow:", overflow.length ? JSON.stringify(overflow.slice(0, 5)) : "none");
  if (process.env.VERBOSE) console.log("sections:", info.sections.map((s) => `${s.cls}@${s.top}(${s.h})`).join("  "));
  await ctx.close();
}
}
await browser.close();
