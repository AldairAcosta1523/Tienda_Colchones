/**
 * QA del buscador predictivo de la cabecera (escritorio) y del menú móvil, sobre la build de producción.
 *   URL=http://localhost:3011 node scripts/buscador-qa.mjs
 *
 * Comprueba el patrón combobox + listbox (teclado, ratón, táctil, Escape frente a Radix), que
 * «Ver los N resultados» prometa lo que luego enseña la tienda, que el panel no desplace la página
 * y que en móvil los resultados queden por encima del teclado.
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = (process.env.URL || "http://localhost:3011").replace(/\/$/, "");
const browser = await chromium.launch();
const out = [];
let fallos = 0;
const check = (nombre, ok, detalle = "") => {
  if (!ok) fallos++;
  out.push(`${ok ? "ok  " : "FALLA"} · ${nombre}${detalle ? " · " + detalle : ""}`);
};
const errs = [];
// El antivirus del usuario inyecta su script en local; sus avisos no son de la web.
const anotarErrores = (page, etiqueta = "") => {
  page.on("pageerror", (e) => errs.push(etiqueta + e.message));
  page.on("console", (m) => m.type() === "error" && !m.text().includes("kaspersky-labs.com") && errs.push(etiqueta + m.text()));
};
const AXE = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

const CAMPO = ".nav__buscador [role=combobox]";
const BOTON = '.nav__acciones button[aria-label="Buscar productos"]';
// La lista se busca por aria-controls: así se comprueba también que apunta a algo real.
const lista = (page, campo = CAMPO) =>
  page.evaluate((sel) => {
    const input = document.querySelector(sel);
    const lb = input && document.getElementById(input.getAttribute("aria-controls"));
    if (!lb) return null;
    const ops = [...lb.querySelectorAll("[role=option]")];
    return {
      rol: lb.getAttribute("role"),
      visible: !!lb.offsetParent && !lb.closest("[hidden]"),
      expandido: input.getAttribute("aria-expanded"),
      activa: input.getAttribute("aria-activedescendant"),
      valor: input.value,
      opciones: ops.map((o) => ({ id: o.id, texto: o.textContent.replace(/\s+/g, " ").trim(), href: o.getAttribute("href"), clase: o.className, sel: o.getAttribute("aria-selected") })),
    };
  }, campo);
const productos = (l) => l.opciones.filter((o) => o.clase.includes("sug__opcion--producto"));
const verTodos = (l) => l.opciones.find((o) => o.clase.includes("sug__opcion--todos"));
const numero = (t) => parseInt((t || "").match(/\d+/)?.[0] ?? "NaN", 10);

const nuevaPagina = async (opciones = {}, etiqueta = "") => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opciones });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("almara:intro", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  anotarErrores(page, etiqueta);
  return { ctx, page };
};
const abrir = async (page) => {
  await page.click(BOTON);
  await page.locator(CAMPO).waitFor({ state: "visible", timeout: 5000 });
};
const escribir = async (page, texto) => {
  await page.locator(CAMPO).fill("");
  await page.locator(CAMPO).pressSequentially(texto, { delay: 40 });
};

// =================================================================== ESCRITORIO
{
  const { ctx, page } = await nuevaPagina();
  for (const ruta of ["/tienda/", "/"]) {
    await page.goto(BASE + ruta, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    // D1
    await abrir(page);
    const foco = await page.evaluate(() => document.activeElement?.getAttribute("role"));
    const l1 = await lista(page);
    const chips = await page.locator(".sug__opcion--chip:visible").count();
    check(`D1 ${ruta}: Buscar enfoca el combobox con lista real y búsquedas frecuentes`, foco === "combobox" && l1?.rol === "listbox" && l1.expandido === "true" && chips === 5, JSON.stringify({ foco, rol: l1?.rol, exp: l1?.expandido, chips }));
    // D2
    await escribir(page, "latex");
    const aTiempo = await page
      .waitForFunction((sel) => {
        const i = document.querySelector(sel);
        const lb = document.getElementById(i.getAttribute("aria-controls"));
        return lb.querySelectorAll(".sug__opcion--producto").length >= 2;
      }, CAMPO, { timeout: 300 })
      .then(() => true, () => false);
    const l2 = await lista(page);
    const ps = productos(l2);
    const todos = verTodos(l2);
    const imgs = await page.$$eval(".sug__opcion--producto img", (xs) => xs.map((x) => x.getAttribute("alt")));
    const marcas = await page.$$eval("mark.sug__marca", (xs) => xs.map((x) => x.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
    check(
      `D2 ${ruta}: «latex» sugiere en menos de 300 ms, con atajo, productos y «Ver los 4»`,
      aTiempo &&
        ps.length >= 2 &&
        ps.length <= 6 &&
        /Terra/.test(ps[0].texto) &&
        l2.opciones.some((o) => o.href === "/colchones/?construccion=latex") &&
        l2.opciones.at(-1) === todos &&
        /Ver los 4 resultados/.test(todos?.texto) &&
        todos?.href === "/tienda/?q=latex" &&
        imgs.length === ps.length &&
        imgs.every((a) => a === "") &&
        ps.every((p) => /desde S\//.test(p.texto)) &&
        marcas.includes("latex"),
      JSON.stringify({ aTiempo, n: ps.length, primero: ps[0]?.texto.slice(0, 30), todos: todos?.texto, marcas: marcas.slice(0, 3) })
    );
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  await ctx.close();
}

{
  const { ctx, page } = await nuevaPagina();
  await page.goto(BASE + "/tienda/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  // D12 (se mide durante todo el bloque D3–D6): CLS sin entrada reciente y h1 quieto.
  await page.evaluate(() => {
    window.__cls = 0;
    window.__t0 = performance.now();
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput && e.startTime > window.__t0) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const h1Antes = await page.evaluate(() => document.querySelector("main h1").getBoundingClientRect().top);
  await abrir(page);
  await escribir(page, "latex");
  await page.waitForTimeout(300);

  // D3
  const l = await lista(page);
  const ids = l.opciones.map((o) => o.id);
  await page.keyboard.press("ArrowDown");
  let s = await lista(page);
  const d3a = s.activa === ids[0] && s.opciones[0].sel === "true";
  await page.keyboard.press("ArrowUp");
  s = await lista(page);
  const d3b = s.activa === ids.at(-1);
  await page.keyboard.press("Home");
  s = await lista(page);
  const d3c = s.activa === ids[0];
  await page.keyboard.press("End");
  s = await lista(page);
  const d3d = s.activa === ids.at(-1);
  await page.keyboard.press("ArrowLeft");
  s = await lista(page);
  const d3e = s.activa === null;
  await page.keyboard.press("Home");
  s = await lista(page);
  const caret = await page.locator(CAMPO).evaluate((i) => i.selectionStart);
  const d3f = s.activa === null && caret === 0 && s.opciones.every((o) => o.sel === "false");
  check("D3 teclado: abajo, arriba (vuelta), Inicio/Fin, izquierda suelta la opción, Inicio sin opción mueve el cursor", d3a && d3b && d3c && d3d && d3e && d3f, JSON.stringify({ d3a, d3b, d3c, d3d, d3e, d3f, caret }));

  // D6
  await page.keyboard.press("End");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  s = await lista(page);
  const d6a = !s.visible && s.expandido === "false" && s.valor === "latex";
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const banda = await page.locator(".nav__buscador").count();
  const focoBoton = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Buscar productos");
  check("D6 Escape: el primero cierra la lista y conserva el texto; el segundo cierra la banda y vuelve a «Buscar»", d6a && banda === 0 && focoBoton, JSON.stringify({ d6a, banda, focoBoton }));

  const cls = await page.evaluate(() => window.__cls);
  const h1Despues = await page.evaluate(() => document.querySelector("main h1").getBoundingClientRect().top);
  check("D12 abrir, escribir y cerrar no mueve la página (CLS 0, h1 quieto)", cls === 0 && Math.abs(h1Despues - h1Antes) < 0.5, `cls=${cls}, h1 ${h1Antes} → ${h1Despues}`);

  // D9
  await abrir(page);
  await page.hover("a.nav__dd-btn");
  await page.waitForTimeout(400);
  check("D9 con la banda abierta, «Colchones» no despliega el megamenú", (await page.locator(".mega.is-open").count()) === 0);

  // D8
  await page.locator(CAMPO).click();
  await escribir(page, "latex");
  await page.waitForTimeout(200);
  await page.locator("main h1").dispatchEvent("pointerdown");
  await page.waitForTimeout(200);
  s = await lista(page);
  const d8a = !s.visible && (await page.locator(".nav__buscador").count()) === 1;
  await page.locator(CAMPO).evaluate((i) => i.blur());
  await page.locator(CAMPO).focus();
  await page.waitForTimeout(200);
  s = await lista(page);
  check("D8 un clic fuera cierra la lista pero no la banda; volver al campo la reabre", d8a && s.visible, JSON.stringify({ d8a, despues: s.visible }));

  // D14
  const centro = await page.evaluate(() => {
    const r = document.querySelector(".sug").getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!el?.closest(".sug");
  });
  check("D14 el panel queda por encima de la página", centro);

  // D16
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  const axe = await new AxeBuilder({ page }).include(".nav__buscador").withTags(AXE).analyze();
  check("D16 axe sin incumplimientos con la lista abierta y una opción activa", axe.violations.length === 0, axe.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join(" | "));

  // D4
  s = await lista(page);
  const activa = s.opciones.find((o) => o.id === s.activa);
  await page.evaluate(() => (window.__sinRecarga = true));
  await page.keyboard.press("Enter");
  const llego = await page.waitForURL(`${BASE}/producto/terra/`, { timeout: 10000 }).then(() => true, () => false);
  await page.waitForTimeout(500);
  const sinRecarga = await page.evaluate(() => window.__sinRecarga === true);
  check(
    "D4 Enter en el producto activo navega sin recargar y cierra la banda",
    activa?.href === "/producto/terra/" && llego && sinRecarga && (await page.locator(".nav__buscador").count()) === 0,
    JSON.stringify({ activa: activa?.href, llego, sinRecarga })
  );

  // D5
  const cuentas = [];
  for (const q of ["latex", "queen", "almohadas", "colchon premium", "media firme", "160x200"]) {
    await page.goto(BASE + "/tienda/", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await abrir(page);
    await escribir(page, q);
    await page.waitForTimeout(250);
    const prometidos = numero(verTodos(await lista(page))?.texto);
    await page.keyboard.press("Enter");
    await page.waitForURL((u) => u.pathname === "/tienda/" && u.searchParams.get("q") === q, { timeout: 10000 }).catch(() => {});
    await page.waitForFunction((n) => parseInt(document.querySelector(".tienda__cuenta")?.textContent.match(/\d+/)?.[0] ?? "-1") === n, prometidos, { timeout: 5000 }).catch(() => {});
    const enTienda = numero(await page.locator(".tienda__cuenta").innerText());
    cuentas.push(`${q}: ${prometidos}/${enTienda}`);
    if (prometidos !== enTienda || Number.isNaN(prometidos)) cuentas.push("✗");
  }
  check("D5 «Ver los N resultados» coincide con la cuenta de /tienda/?q=", !cuentas.includes("✗"), cuentas.join(", "));

  // D7
  await page.goto(BASE + "/tienda/", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await abrir(page);
  await escribir(page, "latex");
  await page.waitForTimeout(300);
  const segunda = page.locator(".sug__opcion--producto").nth(1);
  const caja = await segunda.boundingBox();
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 4 });
  await page.waitForTimeout(1000);
  const sel = await segunda.getAttribute("aria-selected");
  const escala = await segunda.locator(".sug__img").evaluate((i) => new DOMMatrix(getComputedStyle(i).transform).a);
  const href = await segunda.getAttribute("href");
  await segunda.click();
  const fue = await page.waitForURL(`${BASE}${href}`, { timeout: 10000 }).then(() => true, () => false);
  check("D7 el cursor activa la fila, la foto se acerca como en la tarjeta y el clic navega", sel === "true" && Math.abs(escala - 1.04) < 0.005 && fue, JSON.stringify({ sel, escala, href, fue }));

  // D10, D11
  await page.goto(BASE + "/tienda/", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await abrir(page);
  await escribir(page, "zzzz");
  const avisado = await page
    .waitForFunction(() => /Sin resultados/.test(document.querySelector(".nav__buscador [role=status]")?.textContent ?? ""), null, { timeout: 1000 })
    .then(() => true, () => false);
  s = await lista(page);
  const vacio = await page.locator(".sug__vacio").innerText().catch(() => "");
  check("D10 sin resultados: mensaje fuera de la lista, cuatro categorías y aviso para lectores", /«zzzz»/.test(vacio) && s.opciones.length === 4 && !s.opciones.some((o) => /Ver los/.test(o.texto)) && avisado, JSON.stringify({ vacio, n: s.opciones.length, avisado }));
  const textos = async (q) => {
    await escribir(page, q);
    await page.waitForTimeout(250);
    return (await lista(page)).opciones.filter((o) => !o.clase.includes("todos")).map((o) => o.texto);
  };
  const mayus = await textos("LÁTEX");
  const minus = await textos("latex");
  await textos("compas");
  const compas = productos(await lista(page))[0]?.texto ?? "";
  check("D11 «LÁTEX» = «latex» y «compas» encuentra Compás primero", JSON.stringify(mayus) === JSON.stringify(minus) && /^Compás/.test(compas), compas.slice(0, 30));
  await ctx.close();
}

// D13: pantalla baja con la cabecera compacta.
{
  const { ctx, page } = await nuevaPagina({ viewport: { width: 1024, height: 640 } });
  await page.goto(BASE + "/tienda/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(600);
  // La cabecera se esconde al bajar; el foco en «Buscar» la trae (como en interaccion-qa).
  await page.locator(BOTON).focus();
  await page.keyboard.press("Enter");
  await page.locator(CAMPO).waitFor({ state: "visible" });
  await escribir(page, "colchones");
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const p = document.querySelector(".sug--cabecera");
    return { bottom: p.getBoundingClientRect().bottom, alto: innerHeight, sh: p.scrollHeight, ch: p.clientHeight, compacta: document.querySelector(".nav").classList.contains("is-scrolled") };
  });
  const y0 = await page.evaluate(() => window.scrollY);
  const caja = await page.locator(".sug--cabecera").boundingBox();
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(700);
  const y1 = await page.evaluate(() => window.scrollY);
  const panelBajo = await page.evaluate(() => document.querySelector(".sug--cabecera").scrollTop);
  check("D13 1024×640: el panel cabe en la ventana, se desplaza por dentro y la rueda no mueve la página", r.compacta && r.bottom <= r.alto && r.sh > r.ch && y1 === y0 && panelBajo > 0, JSON.stringify({ ...r, y0, y1, panelBajo }));
  await ctx.close();
}

// D15: movimiento reducido.
{
  const { ctx, page } = await nuevaPagina({ reducedMotion: "reduce" });
  await page.goto(BASE + "/tienda/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await abrir(page);
  await escribir(page, "latex");
  await page.waitForTimeout(250);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  const t = await page.locator('.sug__opcion[aria-selected="true"] .sug__img').evaluate((i) => getComputedStyle(i).transform);
  check("D15 con movimiento reducido la foto activa no se escala", t === "none", t);
  await ctx.close();
}

// ======================================================================= MÓVIL
{
  const { ctx, page } = await nuevaPagina({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, "[móvil] ");
  const MCAMPO = "#mobile-menu [role=combobox]";
  const mlista = () => lista(page, MCAMPO);
  const mescribir = async (t) => {
    await page.locator(MCAMPO).fill("");
    await page.locator(MCAMPO).pressSequentially(t, { delay: 30 });
    await page.waitForTimeout(250);
  };
  await page.goto(BASE + "/tienda/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // M1
  await page.tap(BOTON);
  await page.waitForTimeout(800);
  const m1 = await page.evaluate(() => ({
    menu: !!document.querySelector("#mobile-menu") && getComputedStyle(document.querySelector("#mobile-menu")).visibility !== "hidden",
    foco: document.activeElement?.getAttribute("role"),
  }));
  check("M1 la lupa de la cabecera abre el menú con el buscador enfocado", m1.menu && m1.foco === "combobox", JSON.stringify(m1));

  // M2
  const m2 = await page.locator(MCAMPO).evaluate((i) => {
    const px = parseFloat(getComputedStyle(i).fontSize);
    const c = getComputedStyle(i, "::placeholder").color.match(/[\d.]+/g).map(Number);
    const a = c[3] ?? 1;
    const fondo = [0x1f, 0x2d, 0x27];
    const mezcla = fondo.map((f, k) => c[k] * a + f * (1 - a));
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [l1, l2] = [lum(mezcla), lum(fondo)].sort((x, y) => y - x);
    return { px, contraste: (l1 + 0.05) / (l2 + 0.05) };
  });
  check("M2 campo de 16 px (sin zoom en iOS) y marcador legible sobre el bosque", m2.px >= 16 && m2.contraste >= 4.5, `${m2.px}px, ${m2.contraste.toFixed(2)}:1`);

  // M3
  await mescribir("almohada");
  let s = await mlista();
  const fondos = await page.evaluate((sel) => {
    const lb = document.getElementById(document.querySelector(sel).getAttribute("aria-controls"));
    return [...lb.querySelectorAll("[role=option]")].slice(0, 3).map((o) => Math.round(o.getBoundingClientRect().bottom));
  }, MCAMPO);
  const enlaces = await page.locator(".nav__menu-link").count();
  check("M3 «almohada»: los resultados sustituyen al menú y las tres primeras filas quedan sobre el teclado", enlaces === 0 && /^Almohada Nube/.test(s.opciones[0]?.texto) && fondos.length === 3 && fondos.every((b) => b <= 508), JSON.stringify({ enlaces, primera: s.opciones[0]?.texto.slice(0, 20), fondos }));

  // M4
  await mescribir("colchones");
  await page.evaluate(() => document.querySelector("#mobile-menu").style.setProperty("--teclado", "336px"));
  await page.evaluate(() => {
    const m = document.querySelector(".nav__menu-inner");
    m.scrollTop = m.scrollHeight;
  });
  await page.waitForTimeout(300);
  const ultima = await page.evaluate((sel) => {
    const lb = document.getElementById(document.querySelector(sel).getAttribute("aria-controls"));
    return Math.round([...lb.querySelectorAll("[role=option]")].at(-1).getBoundingClientRect().bottom);
  }, MCAMPO);
  check("M4 con el teclado abierto (336 px) la última fila se puede subir por encima", ultima <= 508, `bottom=${ultima}`);

  // M5
  const m5 = await page.evaluate((sel) => {
    const m = document.querySelector(".nav__menu-inner");
    m.scrollTop = 0;
    m.scrollTop += 200;
    const top = document.querySelector(sel).getBoundingClientRect().top;
    const x = document.querySelector('#mobile-menu [data-slot="sheet-close"]');
    const r = x.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { top: Math.round(top), aspa: x === el || x.contains(el), desplazado: m.scrollTop };
  }, MCAMPO);
  check("M5 al desplazar, el campo se queda fijo en su sitio y el aspa sigue encima", Math.abs(m5.top - 96) <= 1 && m5.aspa && m5.desplazado > 0, JSON.stringify(m5));
  await page.evaluate(() => document.querySelector("#mobile-menu").style.removeProperty("--teclado"));

  // M6
  await page.locator(MCAMPO).focus();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const m6a = {
    valor: await page.locator(MCAMPO).inputValue().catch(() => "?"),
    menu: await page.locator("#mobile-menu").count(),
    enlaces: await page.locator(".nav__menu-link").count(),
  };
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  const m6b = await page.locator("#mobile-menu").count();
  check("M6 Escape con texto lo borra y vuelve el menú; un segundo Escape cierra el menú", m6a.valor === "" && m6a.menu === 1 && m6a.enlaces >= 9 && m6b === 0, JSON.stringify({ ...m6a, cerrado: m6b === 0 }));

  // M9 (antes de navegar): el primer arrastre sobre los resultados baja el teclado.
  await page.tap(BOTON);
  await page.waitForTimeout(800);
  await mescribir("almohada");
  await page.locator(MCAMPO).focus();
  // Con un toque de verdad: Lenis lee touches[0] y un touchmove vacío no existe fuera de las pruebas.
  const zona = await page.locator(".sug--menu").boundingBox();
  const toque = { identifier: 1, clientX: zona.x + 40, clientY: zona.y + 40 };
  await page.locator(".sug--menu").dispatchEvent("touchmove", { touches: [toque], targetTouches: [toque], changedTouches: [toque] });
  await page.waitForTimeout(150);
  const desenfocado = await page.evaluate((sel) => document.activeElement !== document.querySelector(sel), MCAMPO);
  check("M9 arrastrar sobre los resultados quita el foco del campo (baja el teclado)", desenfocado);

  // M10
  const axe = await new AxeBuilder({ page }).include("#mobile-menu").withTags(AXE).analyze();
  check("M10 axe sin incumplimientos en el menú con resultados", axe.violations.length === 0, axe.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join(" | "));

  // M7
  await page.locator('#mobile-menu .sug__opcion--producto[href="/producto/almohada-nube/"]').tap();
  const llego = await page.waitForURL(`${BASE}/producto/almohada-nube/`, { timeout: 10000 }).then(() => true, () => false);
  await page.waitForTimeout(800);
  const m7 = await page.evaluate(() => ({ menu: !!document.querySelector("#mobile-menu"), menuOpen: document.documentElement.classList.contains("menu-open") }));
  await page.tap(BOTON);
  await page.waitForTimeout(800);
  const valorReabierto = await page.locator(MCAMPO).inputValue().catch(() => "?");
  check("M7 tocar un producto navega, cierra el menú y deja el buscador vacío", llego && !m7.menu && !m7.menuOpen && valorReabierto === "", JSON.stringify({ llego, ...m7, valorReabierto }));

  // M8
  await mescribir("queen");
  const prometidos = numero(verTodos(await mlista())?.texto);
  await page.keyboard.press("Enter");
  await page.waitForURL((u) => u.pathname === "/tienda/" && u.searchParams.get("q") === "queen", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(900);
  const enTienda = numero(await page.locator(".tienda__cuenta").innerText().catch(() => ""));
  check("M8 «queen» + Enter abre la tienda con los mismos 22 resultados", prometidos === 22 && enTienda === 22 && new URL(page.url()).search === "?q=queen", `${prometidos} / ${enTienda} · ${page.url()}`);
  await ctx.close();
}

check("sin errores de consola ni de página", errs.length === 0, errs.slice(0, 4).join(" | "));

console.log(out.join("\n"));
console.log(`\n${fallos === 0 ? "TODO OK" : fallos + " FALLOS"} · ${out.length} comprobaciones`);
await browser.close();
process.exit(fallos ? 1 : 0);
