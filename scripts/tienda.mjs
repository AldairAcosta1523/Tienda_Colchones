/**
 * QA de la capa de comercio: catálogo, filtros, variantes, carrito, persistencia y checkout.
 * Comprueba comportamiento real, no maquetación: que añadir sume, que el precio cuadre con el
 * catálogo y que el checkout no diga en ningún momento que ha cobrado algo.
 *   URL=http://localhost:3100 node scripts/tienda.mjs
 */
import { chromium } from "playwright";

const BASE = (process.env.URL || "http://localhost:3100").replace(/\/$/, "");
const browser = await chromium.launch();
const out = [];
let fallos = 0;
const check = (nombre, ok, detalle = "") => {
  if (!ok) fallos++;
  out.push(`${ok ? "ok  " : "FALLA"} · ${nombre}${detalle ? " · " + detalle : ""}`);
};

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));

// ---------- Catálogo y filtros ----------
await page.goto(`${BASE}/tienda/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const totalDeclarado = parseInt((await page.locator(".tienda__cuenta").innerText()).match(/\d+/)[0]);
const total = await page.locator(".pcard").count();
check("la primera página muestra 12 y anuncia el total", total === 12 && totalDeclarado > 12, `contados ${total}, declarados ${totalDeclarado}`);
await page.click(".tienda__mas button");
const cargoTodo = await page
  .waitForFunction((n) => document.querySelectorAll(".pcard").length === n && /[?&]n=/.test(location.search), totalDeclarado, { timeout: 15000 })
  .then(() => true, () => false);
check("«Cargar más» completa el catálogo y queda en la URL", cargoTodo, `contados ${await page.locator(".pcard").count()}, declarados ${totalDeclarado}`);

await page.goto(`${BASE}/colchones/`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const colchonesDeclarados = parseInt((await page.locator(".tienda__cuenta").innerText()).match(/\d+/)[0]);
check("la categoría /colchones/ tiene su propia página y más de tres modelos", colchonesDeclarados >= 15, `declarados ${colchonesDeclarados}`);
check("en /colchones/ no hay filtro de categoría pero sí de construcción", (await page.locator("legend", { hasText: "Categoría" }).count()) === 0 && (await page.locator("legend", { hasText: "Construcción" }).count()) > 0);

// Precio por variante: Queen ≤ S/ 1.500 no debe colar un modelo por su plaza y media
await page.goto(`${BASE}/colchones/?medida=Queen&max=1500`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const preciosQueen = await page.locator(".pcard__importe").allInnerTexts();
check("el filtro de precio se aplica a la variante Queen, no al «desde» global", preciosQueen.length > 0 && preciosQueen.every((t) => parseInt(t.replace(/\D/g, "")) <= 1500), preciosQueen.join(" | "));
{
  const btn = page.locator(".pcard").first().locator(".pcard__añadir");
  check("con medida filtrada la tarjeta añade esa medida sin menú", /Queen/.test(await btn.innerText()) && (await btn.getAttribute("aria-haspopup")) === null, await btn.innerText());
}
await page.click(".tienda__chips .chip >> nth=0");
await page.waitForTimeout(500);
check("quitar un chip actualiza la URL", !/medida=/.test(page.url()), page.url());

// Favoritos
await page.goto(`${BASE}/colchones/`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator(".pcard__fav").nth(1).click();
await page.waitForTimeout(300);
check("el corazón marca el favorito", (await page.locator(".pcard__fav").nth(1).getAttribute("aria-pressed")) === "true");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
check("favoritos persiste tras recargar", (await page.locator(".pcard__fav.is-activo").count()) === 1 && /1/.test(await page.locator(".nav__favoritos .nav__cuenta").innerText()));
await page.goto(`${BASE}/favoritos/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
check("la página de favoritos lista lo guardado", (await page.locator(".pcard").count()) === 1);

// Comparador con modelos nuevos
await page.goto(`${BASE}/colchones/?coleccion=confort`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator(".pcard__cmp").nth(0).click();
await page.locator(".pcard__cmp").nth(1).click();
await page.waitForTimeout(400);
check("la barra del comparador muestra la selección", (await page.locator(".cmp-barra__item").count()) === 2);
await page.goto(`${BASE}/comparar/`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const cabeceras = await page.locator(".cmp__nombre").allInnerTexts();
check("el comparador compara los modelos elegidos (no los tres originales)", cabeceras.length === 2 && !cabeceras.includes("Esencial") && !cabeceras.includes("Signature"), cabeceras.join(", "));
check("el comparador muestra precio en una misma medida con SKU", (await page.locator(".cmp__sku").count()) === 2);

// Guía de elección
await page.goto(`${BASE}/guia/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.locator(".chip--opcion", { hasText: "De lado" }).click();
await page.locator(".chip--opcion", { hasText: /^King$/ }).click();
await page.waitForTimeout(400);
const nGuia = await page.locator(".guiaq__grid .pcard").count();
check("la guía devuelve colchones del catálogo según postura y medida", nGuia > 0 && nGuia <= 6, `mostrados ${nGuia}`);

// Dos medidas del mismo modelo: dos líneas; la misma medida dos veces: una línea con cantidad 2
await page.goto(`${BASE}/tienda/`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.removeItem("almara:carrito"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);
// Añadir desde la tarjeta: abrir el menú de medidas y elegir la n-ésima.
// El panel del carrito se cierra ANTES de cada añadido, no después: así sigue abierto cuando
// se comprueban sus líneas.
const añadirMedida = async (n) => {
  if (await page.locator('.drawer__panel[data-state="open"]').count()) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }
  await page.locator(".pcard").first().locator(".pcard__añadir").click();
  await page.waitForTimeout(350);
  await page.locator('[role="menu"] [role="menuitem"]').nth(n).click();
  await page.waitForTimeout(500);
};
await añadirMedida(0);
await añadirMedida(1);
await añadirMedida(0);
check("dos medidas del mismo modelo son dos líneas y la repetida se consolida", (await page.locator(".dline").count()) === 2 && (await page.locator(".dline").first().locator(".qty__valor").innerText()).trim() === "2");
await page.evaluate(() => localStorage.removeItem("almara:carrito"));

// Teclado: Enter abre el menú, flecha abajo mueve el foco, Escape cierra y devuelve el foco
await page.goto(`${BASE}/tienda/`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.locator(".pcard").first().locator(".pcard__añadir").focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(350);
const abiertoTeclado = (await page.locator('[role="menu"]').count()) === 1;
await page.keyboard.press("ArrowDown");
const focoEnItem = await page.evaluate(() => document.activeElement?.getAttribute("role") === "menuitem");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const focoVuelve = await page.evaluate(() => document.activeElement?.classList.contains("pcard__añadir"));
check("el menú de medidas funciona con teclado y devuelve el foco", abiertoTeclado && focoEnItem && focoVuelve, JSON.stringify({ abiertoTeclado, focoEnItem, focoVuelve }));

// Añadir con teclado y cerrar el carrito: el foco vuelve al botón de la tarjeta
await page.locator(".pcard").first().locator(".pcard__añadir").focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(350);
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Enter");
await page.waitForTimeout(700);
const panelAbierto = (await page.locator('.drawer__panel[data-state="open"]').count()) === 1;
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
const focoTrasCarrito = await page.evaluate(() => document.activeElement?.classList.contains("pcard__añadir"));
check("tras añadir y cerrar el carrito, el foco vuelve a la tarjeta", panelAbierto && focoTrasCarrito, JSON.stringify({ panelAbierto, focoTrasCarrito }));
await page.evaluate(() => localStorage.removeItem("almara:carrito"));

await page.goto(`${BASE}/tienda/`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.fill(".tienda__buscar input", "lino");
await page.waitForFunction(() => /[?&]q=lino/.test(location.search), null, { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(300);
const buscados = await page.locator(".pcard").count();
check("la búsqueda cruza categorías", buscados > 0 && buscados < totalDeclarado, `contados ${buscados}`);

await page.fill(".tienda__buscar input", "zzzz");
// La búsqueda espera 250 ms antes de escribir en la URL: se espera al estado, no un tiempo fijo.
const vacioVisible = await page.locator(".tienda__vacio").waitFor({ state: "visible", timeout: 10000 }).then(() => true, () => false);
check("sin resultados hay estado vacío, no una rejilla en blanco", vacioVisible);

// ---------- Ficha: variantes y precio ----------
await page.goto(`${BASE}/producto/esencial/`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const precioInicial = (await page.locator(".pdp__importe").innerText()).trim();
check("el selector de medida es un radiogroup", (await page.locator('.pdp__variantes-lista[role="radiogroup"]').count()) === 1);
const variantes = page.locator(".pdp__variante:not(.is-agotada)");
await variantes.nth(await variantes.count() - 1).click();
await page.waitForTimeout(300);
const precioFinal = (await page.locator(".pdp__importe").innerText()).trim();
check("cambiar de medida cambia el precio", precioInicial !== precioFinal, `${precioInicial} → ${precioFinal}`);

// ---------- Añadir al carrito ----------
await page.click(".pdp__anadir, .pdp__añadir");
await page.waitForTimeout(800);
check("añadir abre el panel del carrito", await page.locator('.drawer__panel[data-state="open"]').isVisible());
const badge = (await page.locator(".nav__carrito .nav__cuenta").innerText().catch(() => "0")).trim();
check("el contador de la cabecera marca 1", badge === "1", `badge=${badge}`);
const importeLinea = (await page.locator(".dline__importe").first().innerText()).trim();
check("la línea del carrito repite el precio de la variante elegida", importeLinea === precioFinal, `${importeLinea} vs ${precioFinal}`);

// Cantidad
await page.click(".dline .qty__btn:last-child");
await page.waitForTimeout(400);
const badge2 = (await page.locator(".nav__carrito .nav__cuenta").innerText()).trim();
check("subir la cantidad actualiza el contador", badge2 === "2", `badge=${badge2}`);

// ---------- Accesibilidad del panel (la aporta el Sheet de shadcn) ----------
const dlg = page.locator('.drawer__panel[data-state="open"]');
// Radix ya no usa aria-modal: oculta el resto del árbol con aria-hidden, que las ayudas técnicas
// respetan mejor. Se comprueba el mecanismo real, no el atributo.
const modal = await page.evaluate(() => ({
  rol: document.querySelector('.drawer__panel[data-state="open"]')?.getAttribute("role"),
  restoOculto: document.querySelector("nav")?.closest('[aria-hidden="true"]') !== null,
  sinPuntero: getComputedStyle(document.body).pointerEvents === "none",
}));
check("el panel es un diálogo y aísla el resto de la página", modal.rol === "dialog" && modal.restoOculto && modal.sinPuntero, JSON.stringify(modal));
check("el foco entra en el panel al abrirse", await page.evaluate(() => !!document.activeElement?.closest(".drawer__panel")));
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
check("Escape cierra el panel", (await page.locator('.drawer__panel[data-state="open"]').count()) === 0);

// ---------- Persistencia ----------
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(900);
const badge3 = (await page.locator(".nav__carrito .nav__cuenta").innerText().catch(() => "-")).trim();
check("el carrito sobrevive a la recarga", badge3 === "2", `badge=${badge3}`);

// ---------- Página de carrito y totales ----------
await page.goto(`${BASE}/carrito/`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const totales = await page.locator(".carrito__totales").innerText();
check("el resumen muestra subtotal, envío y total", /Subtotal/i.test(totales) && /Env/i.test(totales) && /Total/i.test(totales));
check("el envío gratis se anuncia con su umbral real", /gratis|S\/\s*25|S\/\s*0/i.test(totales), totales.replace(/\n/g, " | "));

// ---------- Checkout: validación real ----------
await page.goto(`${BASE}/checkout/`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const textoCheckout = (await page.locator(".checkout").innerText()).toLowerCase();
check("el checkout avisa de que no cobra", /no procesa pagos|sin cobro|demostraci/.test(textoCheckout));
check("no hay campos de tarjeta", (await page.locator("input[name*='tarjeta'], input[autocomplete='cc-number']").count()) === 0);

await page.click(".checkout__enviar");
await page.waitForTimeout(500);
const errores = await page.locator(".ckfield__error").count();
check("enviar vacío marca errores en lugar de continuar", errores > 0, `${errores} campos`);
check("con errores no aparece el resultado", (await page.locator(".ckres").count()) === 0);

const campos = { nombre: "Ana Quispe", email: "ana@example.com", telefono: "987654321", direccion: "Av. Arequipa 1234", distrito: "Miraflores" };
for (const [name, valor] of Object.entries(campos)) {
  const input = page.locator(`.ckfield input[name='${name}']`);
  if (await input.count()) await input.fill(valor);
}
await page.click(".checkout__enviar");
await page.waitForTimeout(900);
const res = await page.locator(".ckres").count();
check("con datos válidos se genera el pedido preparado", res === 1);
if (res) {
  const t = (await page.locator(".ckres").innerText()).toLowerCase();
  check("el resultado NO dice compra/pago confirmado", !/(pago (confirmado|recibido|aprobado))|gracias por tu compra|pedido confirmado/.test(t));
  // Las integraciones pendientes se documentan en docs/INTEGRACIONES.md, no en la pantalla:
  // lo que debe quedar claro al comprador es que fue una simulación sin cobro.
  check("el resultado deja claro que es una simulación sin cobro", /simulaci|sin cobro/.test(t) && /no se env|no se cobra/.test(t));
}

// ---------- Móvil: filtros y barra de compra ----------
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await mctx.newPage();
mp.on("pageerror", (e) => errs.push("[móvil] " + e.message));
await mp.goto(`${BASE}/tienda/`, { waitUntil: "networkidle" });
await mp.waitForTimeout(700);
await mp.click(".tienda__filtros-btn");
await mp.waitForTimeout(500);
check("en móvil los filtros se abren en panel", await mp.locator('.filtros--panel[data-state="open"]').isVisible());
await mp.keyboard.press("Escape");
await mp.waitForTimeout(400);
await mp.goto(`${BASE}/producto/natura/`, { waitUntil: "networkidle" });
await mp.waitForTimeout(800);
check("en móvil hay barra de compra fija", await mp.locator(".pdp__barra").isVisible());

check("sin errores de consola ni de hidratación", errs.length === 0, errs.slice(0, 4).join(" | "));

console.log(out.join("\n"));
console.log(`\n${fallos === 0 ? "TODO OK" : fallos + " FALLOS"} · ${out.length} comprobaciones`);
await browser.close();
process.exit(fallos ? 1 : 0);
