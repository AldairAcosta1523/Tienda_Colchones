/**
 * Pruebas unitarias de la búsqueda (src/lib/busqueda.ts) sobre el catálogo real.
 *   node scripts/busqueda-unit.mjs   (o npm run test:busqueda)
 *
 * Node 24 ejecuta TypeScript sin compilar; el gancho de resolución solo traduce el alias «@/» y
 * los imports sin extensión de los .ts. Las cuentas de U3 son las de /tienda/?q= antes del
 * buscador predictivo: si cambian, cambia lo que la tienda enseña.
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

const SRC = new URL("../src/", import.meta.url);
registerHooks({
  resolve(spec, ctx, next) {
    let url = null;
    if (spec.startsWith("@/")) url = new URL(spec.slice(2), SRC);
    else if (/^\.\.?\//.test(spec) && ctx.parentURL?.endsWith(".ts") && !/\.\w+$/.test(spec)) url = new URL(spec, ctx.parentURL);
    if (url)
      for (const ext of [".ts", ".tsx"]) {
        const f = fileURLToPath(url) + ext;
        if (existsSync(f)) return { url: pathToFileURL(f).href, format: "module-typescript", shortCircuit: true };
      }
    return next(spec, ctx);
  },
});
const B = await import("@/lib/busqueda");
const C = await import("@/data/catalog");

const cuenta = (q) => C.productos.filter((p) => B.coincide(p, B.analizar(q))).length;
const slugs = (q) => {
  const s = B.sugerir(q);
  return s.estado === "resultados" ? s.productos.map((x) => x.producto.slug) : [];
};
const atajos = (q) => {
  const s = B.sugerir(q);
  return s.estado === "resultados" ? s.atajos : [];
};
const marcado = (texto, q) => B.resaltar(texto, B.analizar(q)).map((x) => (x.marca ? `[${x.t}]` : x.t)).join("");

test("U0 el catálogo se carga", () => {
  assert.equal(C.productos.length, 24);
  assert.equal(C.productosDeCategoria("colchones").length, 18);
  assert.equal(C.precio(1590), "S/ 1,590");
});

test("U1 normalizar", () => {
  assert.equal(B.normalizar("LÁTEX Natural"), "latex natural");
  assert.equal(B.normalizar("160x200"), "160 200");
  assert.equal(B.normalizar("160 × 200"), "160 200");
  assert.equal(B.normalizar("Compás"), "compas");
  assert.equal(B.hayConsulta("a"), false);
  assert.equal(B.hayConsulta(" l a "), true);
});

test("U2 analizar", () => {
  const a = B.analizar("colchón Queen firme");
  assert.deepEqual(a.medidas, ["Queen"]);
  assert.deepEqual(a.terminos.map((t) => t.raiz), ["colchon", "firme"]);
  assert.deepEqual(B.analizar("super king").medidas, ["Super King"]);
  const m = B.analizar("160x200");
  assert.deepEqual(m.medidas, ["Queen"]);
  assert.equal(m.terminos.length, 0);
  assert.equal(B.analizar("muelles").terminos[0].sinonimo?.raiz, "resort");
  // Solo palabras vacías y sin medida: se buscan tal cual.
  assert.deepEqual(B.analizar("de la").terminos.map((t) => t.original), ["de", "la"]);
});

test("U3 mismas cuentas que la tienda", () => {
  const antes = { latex: 4, sabanas: 1, compas: 1, "colchon premium": 8, almohadas: 2, firme: 11, "media firme": 7, lino: 2, colchones: 18, base: 4, zzz: 0 };
  for (const [q, n] of Object.entries(antes)) assert.equal(cuenta(q), n, q);
  const conQueen = C.productos.filter((p) => p.variantes.some((v) => v.nombre === "Queen")).length;
  assert.equal(conQueen, 22);
  assert.equal(cuenta("queen"), conQueen);
  assert.equal(cuenta("160"), conQueen);
  assert.equal(cuenta("160x200"), conQueen);
  assert.equal(cuenta("memory"), 4);
  assert.equal(cuenta("muelles"), 8);
  assert.deepEqual(B.sugerir("LÁTEX"), B.sugerir("latex").estado === "resultados" ? { ...B.sugerir("latex"), consulta: "LÁTEX", analisis: B.analizar("LÁTEX") } : null);
  assert.deepEqual(slugs("LÁTEX"), slugs("latex"));
  // Un análisis vacío deja pasar todo: la tienda sin ?q= no filtra.
  assert.equal(cuenta(""), C.productos.length);
});

test("U4 orden de relevancia", () => {
  assert.equal(slugs("terra")[0], "terra");
  assert.equal(slugs("terra")[1], "sabanas-lino");
  assert.deepEqual(slugs("esencial"), ["esencial", "lienzo", "compas", "nido", "pausa"]);
  assert.equal(slugs("compa")[0], "compas");
  assert.equal(slugs("compas")[0], "compas");
  assert.deepEqual(slugs("latex"), ["terra", "bosque", "aurora", "cumbre"]);
  assert.deepEqual(slugs("almohadas"), ["almohada-nube", "almohada-lino"]);
  assert.deepEqual(slugs("colchon premium"), ["signature", "aurora", "bosque", "nocturno", "marea", "sereno"]);
  assert.deepEqual(slugs("queen"), ["esencial", "natura", "signature", "lienzo", "compas", "nido"]);
});

test("U5 atajos", () => {
  const firme = atajos("firme").map((x) => x.texto);
  assert.deepEqual(firme, ["Firmeza firme", "Firmeza media-firme"]);
  assert.ok(!firme.includes("Firmeza media"));
  assert.deepEqual(atajos("media firme").map((x) => x.texto), ["Firmeza media-firme"]);
  const queen = atajos("queen");
  assert.equal(queen[0].href, "/colchones/?medida=Queen");
  assert.equal(queen[0].n, 18);
  assert.equal(queen[0].detalle, "160 × 200 cm");
  assert.ok(atajos("lino").some((x) => x.texto === "Ropa de cama" && x.href === "/tienda/?categoria=textil"));
  const latex = atajos("latex");
  assert.deepEqual(latex.map((x) => [x.texto, x.n, x.href]), [["Látex", 2, "/colchones/?construccion=latex"]]);
  assert.deepEqual(atajos("colchon premium").map((x) => x.texto), ["Premium"]);
  assert.equal(atajos("esencial")[0].texto, "Esenciales");
  assert.equal(atajos("almohadas")[0].texto, "Almohadas");
});

test("U6 estados", () => {
  const ini = B.sugerir("a");
  assert.equal(ini.estado, "inicial");
  assert.equal(ini.frecuentes.length, 5);
  for (const x of ini.frecuentes) assert.match(x.href, /^\/(colchones|tienda)\/(\?[a-z]+=[\w%-]+)?$/);
  const vacio = B.sugerir("zzz");
  assert.equal(vacio.estado, "vacio");
  assert.equal(vacio.alternativas.length, 4);
  const r = B.sugerir("latex");
  assert.equal(r.estado, "resultados");
  assert.equal(r.total, 4);
  assert.equal(r.productos[0].href, "/producto/terra/");
  assert.ok(r.productos.every((x) => typeof x.desde === "number" && x.meta.length > 0));
  assert.equal(B.hrefResultados(" latex "), "/tienda/?q=latex");
  assert.equal(B.hrefResultados("  "), "/tienda/");
});

test("U7 resaltado", () => {
  assert.equal(marcado("Colchones de látex", "LATEX"), "Colchones de [látex]");
  assert.equal(marcado("Compás", "compa"), "[Compá]s");
  assert.equal(marcado("Juego de sábanas de lino", "sabanas lino"), "Juego de [sábanas] de [lino]");
  assert.equal(marcado("Media-firme", "firme"), "Media-[firme]");
  assert.equal(marcado("Almohada Nube", "almohadas"), "[Almohada] Nube");
  // Solo al inicio de palabra: «compa» no marca dentro de «acompaña».
  assert.equal(marcado("Te acompaña", "compa"), "Te acompaña");
});

test("U8 lo agotado baja", () => {
  const base = C.productoPorSlug("lienzo");
  const disponible = { ...base, slug: "prueba-a", nombre: "Prueba Uno", orden: 2 };
  const agotado = { ...base, slug: "prueba-b", nombre: "Prueba Dos", orden: 1, variantes: base.variantes.map((v) => ({ ...v, stock: 0 })) };
  const s = B.sugerir("prueba", { lista: [agotado, disponible] });
  assert.equal(s.estado, "resultados");
  assert.deepEqual(s.productos.map((x) => x.producto.slug), ["prueba-a", "prueba-b"]);
  assert.equal(s.productos[1].agotado, true);
});

test("U9 todos los enlaces de atajos existen", () => {
  const colchones = C.productosDeCategoria("colchones");
  const medidas = C.medidasDisponibles(colchones);
  const vistos = new Set();
  for (const q of ["a", "zzz", "latex", "queen", "king", "plaza y media", "dos plazas", "una plaza", "super king", "firme", "suave", "media", "premium", "confort", "esencial", "hibrido", "espuma", "muelles", "memory", "lino", "base", "almohada", "colchones"]) {
    const s = B.sugerir(q, { maxAtajos: 20 });
    const lista = s.estado === "inicial" ? s.frecuentes : s.estado === "vacio" ? s.alternativas : s.atajos;
    for (const x of lista) {
      vistos.add(x.clave);
      const u = new URL(x.href, "http://x");
      const [clave, valor] = [...u.searchParams][0] ?? [];
      if (x.tipo === "coleccion") assert.ok(C.colecciones.some((c) => c.id === valor), x.href);
      if (x.tipo === "construccion") assert.ok(valor in C.NOMBRE_CONSTRUCCION, x.href);
      if (x.tipo === "firmeza") assert.ok(C.FIRMEZAS.includes(valor), x.href);
      if (x.tipo === "medida") assert.ok(medidas.includes(valor), x.href);
      if (x.tipo === "categoria") assert.ok(u.pathname === "/colchones/" || C.categorias.some((c) => c.id === valor && clave === "categoria"), x.href);
      assert.ok(x.n > 0, x.href);
    }
  }
  assert.ok(vistos.size >= 15, `atajos vistos: ${vistos.size}`);
});

test("U10 rapidez", () => {
  // 18.000 consultas en cinco tandas; cuenta la mejor tanda ×5: con la máquina ocupada por otra
  // cosa (un build, otro navegador) una sola medida no dice nada del código.
  const qs = ["l", "la", "lat", "late", "latex", "colchon premium", "queen", "media firme", "zzz"];
  B.sugerir("calentar");
  const tandas = [];
  for (let t = 0; t < 5; t++) {
    const t0 = performance.now();
    for (let i = 0; i < 400; i++) for (const q of qs) B.sugerir(q);
    tandas.push(performance.now() - t0);
  }
  const ms = Math.min(...tandas) * 5;
  // El presupuesto real es por pulsación: muy por debajo de un fotograma (16 ms). Hoy cada consulta
  // tarda ~0,02 ms; el límite de 0,2 ms deja margen para máquinas cargadas o CI y aun así detecta
  // una regresión de un orden de magnitud.
  const porConsulta = ms / 18000;
  assert.ok(porConsulta < 0.2, `${porConsulta.toFixed(3)} ms por consulta (tandas: ${tandas.map((x) => x.toFixed(0)).join(", ")})`);
});
