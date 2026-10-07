/**
 * Búsqueda del catálogo: la usan las sugerencias de la cabecera y la tienda (`/tienda/?q=`).
 *
 * Un solo criterio de coincidencia para las dos, así que «Ver los N resultados» siempre promete lo
 * mismo que luego enseña la tienda. Módulo puro: sin React ni Next, para poder probarlo con Node
 * (`scripts/busqueda-unit.mjs`). Los índices se construyen en la primera búsqueda, no al cargar:
 * la cabecera está en todas las páginas y casi nadie llega a buscar.
 */
import {
  agotado,
  categorias,
  colecciones,
  colchonesDeColeccion,
  FIRMEZAS,
  MEDIDAS,
  NOMBRE_CONSTRUCCION,
  NOMBRE_CORTO_CONSTRUCCION,
  precioDesde,
  precioParaFiltro,
  productos,
  productosDeCategoria,
  textoMedida,
  type CategoriaId,
  type Construccion,
  type MedidaId,
  type Producto,
} from "@/data/catalog";

export const MIN_CARACTERES = 2;

/**
 * Minúsculas, sin tildes y sin signos. «160x200» y «160 × 200» quedan igual que «160 200»: es como
 * la gente escribe una medida.
 */
export function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)\s*[x\u00d7]\s*(\d)/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Con menos de dos letras cualquier cosa coincide: no se sugiere nada todavía. */
export const hayConsulta = (q: string) => normalizar(q).replace(/ /g, "").length >= MIN_CARACTERES;

export type Termino = { original: string; raiz: string; sinonimo?: { original: string; raiz: string } };
export type Analisis = { texto: string; medidas: string[]; terminos: Termino[] };

const VACIAS = new Set(["de", "del", "la", "las", "el", "los", "y", "o", "con", "para", "en", "a", "un", "una", "por", "cm"]);

/** Cómo lo dice la gente → cómo lo dice el catálogo. */
const SINONIMOS: Record<string, string> = {
  muelle: "resortes",
  muelles: "resortes",
  memory: "viscoelastica",
  visco: "viscoelastica",
  viscoelastico: "viscoelastica",
  somier: "base",
  tarima: "base",
  cojin: "almohada",
  cojines: "almohada",
};

/** Plural fuera solo en palabras largas: «latex» o «base» no deben perder letras. */
const raiz = (t: string) => (t.length > 4 ? t.replace(/(es|s)$/, "") : t);

const termino = (t: string): Termino => {
  const s = SINONIMOS[t];
  return { original: t, raiz: raiz(t), sinonimo: s ? { original: s, raiz: raiz(s) } : undefined };
};

// Por ancho: la clave "090" no es un índice entero y Object.entries la dejaría la última.
const MEDIDAS_POR_ANCHO = (Object.entries(MEDIDAS) as [MedidaId, (typeof MEDIDAS)[MedidaId]][]).sort((a, b) => a[1].ancho - b[1].ancho);

// Sin lookbehind: Safari anterior a 16.4 no lo entiende y rompería el módulo entero.
const frase = (texto: string) => new RegExp(`(^| )${texto}(?= |$)`, "g");

let FRASES_MEDIDA: [RegExp, string][] | null = null;
// Todas las frases en una sola expresión: casi ninguna consulta lleva medida y así se descarta
// con una prueba en vez de dieciocho.
let ALGUNA_MEDIDA: RegExp | null = null;

/**
 * Frases de medida en orden de prueba: nombres (el más largo primero, así «super king» no deja un
 * «king» suelto), luego «ancho largo» y luego el ancho solo. Se buscan como palabras enteras.
 */
function frasesMedida() {
  if (FRASES_MEDIDA) return FRASES_MEDIDA;
  const datos = MEDIDAS_POR_ANCHO.map(([, m]) => m);
  FRASES_MEDIDA = [
    ...[...datos]
      .sort((a, b) => normalizar(b.nombre).length - normalizar(a.nombre).length)
      .map((m) => [frase(normalizar(m.nombre)), m.nombre] as [RegExp, string]),
    ...datos.map((m) => [frase(`${m.ancho} ${m.largo}`), m.nombre] as [RegExp, string]),
    ...datos.map((m) => [frase(String(m.ancho)), m.nombre] as [RegExp, string]),
  ];
  ALGUNA_MEDIDA = new RegExp(FRASES_MEDIDA.map(([re]) => `(?:${re.source})`).join("|"));
  return FRASES_MEDIDA;
}

/** Separa la consulta en medidas de cama y términos de texto. */
export function analizar(q: string): Analisis {
  const texto = normalizar(q);
  let resto = texto;
  const medidas: string[] = [];
  const frases = frasesMedida();
  for (const [re, nombre] of ALGUNA_MEDIDA!.test(resto) ? frases : []) {
    re.lastIndex = 0;
    if (!re.test(resto)) continue;
    re.lastIndex = 0;
    if (!medidas.includes(nombre)) medidas.push(nombre);
    resto = resto.replace(re, " ");
  }
  const todas = resto.split(" ").filter(Boolean);
  const utiles = todas.filter((t) => !VACIAS.has(t));
  // «de la» a secas se busca tal cual; «cama de 160» ya dice lo que quiere con la medida.
  const palabras = utiles.length ? utiles : medidas.length ? [] : todas;
  return { texto, medidas, terminos: palabras.map(termino) };
}

/* ------------------------------------------------------------- Coincidencia */

type Campos = { nombre: string; fuerte: string; debil: string; descriptivo: string; agotado: boolean };

// Por objeto y no por slug: así un producto de prueba con el mismo slug no hereda textos ajenos.
const CAMPOS = new WeakMap<Producto, Campos>();

const nombreCategoria = (id: CategoriaId) => categorias.find((c) => c.id === id)?.nombre ?? "";

function campos(p: Producto): Campos {
  let c = CAMPOS.get(p);
  if (c) return c;
  const coleccion = p.coleccion ? (colecciones.find((x) => x.id === p.coleccion)?.nombre ?? "") : "";
  const construccion = p.construccion ? `${NOMBRE_CONSTRUCCION[p.construccion]} ${NOMBRE_CORTO_CONSTRUCCION[p.construccion]}` : "";
  // Fuerte: lo que el producto ES (nombre, categoría, colección, construcción, firmeza); ahí basta
  // la raíz. Débil: lo que se dice de él; ahí se pide la palabra tal cual, para que «sabanas» no
  // encuentre cualquier texto que mencione una sábana de pasada.
  c = {
    nombre: normalizar(p.nombre),
    fuerte: normalizar(`${p.nombre} ${nombreCategoria(p.categoria)} ${coleccion} ${construccion} ${p.firmeza ?? ""}`),
    debil: normalizar(`${p.resumen} ${p.descripcion} ${p.beneficios.join(" ")}`),
    descriptivo: normalizar(`${p.resumen} ${p.beneficios.join(" ")}`),
    agotado: agotado(p),
  };
  CAMPOS.set(p, c);
  return c;
}

const tiene = (c: Campos, t: { original: string; raiz: string }) => c.fuerte.includes(t.raiz) || c.debil.includes(t.original);

/** ¿El producto responde a la consulta? Un análisis vacío deja pasar todo. */
export function coincide(p: Producto, a: Analisis) {
  if (!a.medidas.every((m) => p.variantes.some((v) => v.nombre === m))) return false;
  if (!a.terminos.length) return true;
  const c = campos(p);
  return a.terminos.every((t) => tiene(c, t) || (!!t.sinonimo && tiene(c, t.sinonimo)));
}

/** Empieza palabra: posición 0 o detrás de un espacio del texto normalizado. */
// Con indexOf y sin concatenar: se llama cientos de veces por tecla y cada `" " + t` era basura.
function empiezaPalabra(texto: string, t: string) {
  for (let i = texto.indexOf(t); i !== -1; i = texto.indexOf(t, i + 1)) if (i === 0 || texto.charCodeAt(i - 1) === 32) return true;
  return false;
}

const VARIANTES = new WeakMap<Termino, string[]>();
function variantesDe(t: Termino) {
  let v = VARIANTES.get(t);
  if (!v) VARIANTES.set(t, (v = [...new Set([t.raiz, t.original, t.sinonimo?.raiz, t.sinonimo?.original].filter((x): x is string => !!x))]));
  return v;
}

/** Relevancia: el nombre manda; luego lo que el producto es; luego lo que se dice de él. */
export function puntuar(p: Producto, a: Analisis) {
  const c = campos(p);
  let total = 0;
  for (const t of a.terminos) {
    let mejor = 0;
    for (const v of variantesDe(t)) {
      const s =
        c.nombre === v
          ? 120
          : empiezaPalabra(c.nombre, v)
            ? 100
            : c.nombre.includes(v)
              ? 60
              : empiezaPalabra(c.fuerte, v)
                ? 50
                : empiezaPalabra(c.descriptivo, v)
                  ? 20
                  : c.fuerte.includes(v) || c.debil.includes(v)
                    ? 8
                    : 0;
      mejor = Math.max(mejor, s);
    }
    total += mejor;
  }
  if (a.texto && a.texto === c.nombre) total += 200;
  if (c.agotado) total -= 15;
  return total;
}

/* ------------------------------------------------------------------ Atajos */

export type Atajo = {
  clave: string;
  tipo: "categoria" | "coleccion" | "construccion" | "firmeza" | "medida";
  texto: string;
  detalle?: string;
  href: string;
  n: number;
  unidad: "modelos" | "productos";
  /** Palabras que nombran el atajo: al menos un término tiene que estar aquí. */
  nucleo: string;
  /** Palabras que lo acompañan sin nombrarlo («colchón» en «colchón premium»). */
  contexto: string;
};

const ALIAS_CATEGORIA: Record<CategoriaId, string> = {
  colchones: "colchon colchones",
  almohadas: "almohada almohadas cojin",
  textil: "ropa de cama sabanas lino protector funda textil",
  bases: "base bases somier tarima",
};

let ATAJOS: Atajo[] | null = null;

/** Tabla de atajos, sacada de los datos: si cambia el catálogo, cambian solos. */
function atajos(): Atajo[] {
  if (ATAJOS) return ATAJOS;
  const colchones = productosDeCategoria("colchones");
  const lista: Atajo[] = [];
  for (const c of categorias) {
    lista.push({
      clave: `categoria:${c.id}`,
      tipo: "categoria",
      texto: c.nombre,
      href: c.id === "colchones" ? "/colchones/" : `/tienda/?categoria=${c.id}`,
      n: productosDeCategoria(c.id).length,
      unidad: c.id === "colchones" ? "modelos" : "productos",
      nucleo: normalizar(`${c.nombre} ${ALIAS_CATEGORIA[c.id]}`),
      contexto: "",
    });
  }
  for (const c of colecciones) {
    lista.push({
      clave: `coleccion:${c.id}`,
      tipo: "coleccion",
      texto: c.nombre,
      href: `/colchones/?coleccion=${c.id}`,
      n: colchonesDeColeccion(c.id).length,
      unidad: "modelos",
      nucleo: normalizar(c.nombre),
      contexto: "colchon colchones coleccion",
    });
  }
  for (const k of Object.keys(NOMBRE_CONSTRUCCION) as Construccion[]) {
    const n = colchones.filter((p) => p.construccion === k).length;
    if (!n) continue;
    lista.push({
      clave: `construccion:${k}`,
      tipo: "construccion",
      texto: NOMBRE_CONSTRUCCION[k],
      href: `/colchones/?construccion=${k}`,
      n,
      unidad: "modelos",
      nucleo: normalizar(`${NOMBRE_CONSTRUCCION[k]} ${NOMBRE_CORTO_CONSTRUCCION[k]}`),
      contexto: "colchon colchones construccion",
    });
  }
  for (const f of FIRMEZAS) {
    const n = colchones.filter((p) => p.firmeza === f).length;
    if (!n) continue;
    lista.push({
      clave: `firmeza:${f}`,
      tipo: "firmeza",
      texto: `Firmeza ${f.toLowerCase()}`,
      href: `/colchones/?firmeza=${encodeURIComponent(f)}`,
      n,
      unidad: "modelos",
      nucleo: normalizar(f),
      contexto: "colchon colchones firmeza",
    });
  }
  for (const [id, m] of MEDIDAS_POR_ANCHO) {
    const n = colchones.filter((p) => p.variantes.some((v) => v.nombre === m.nombre)).length;
    if (!n) continue;
    lista.push({
      clave: `medida:${m.nombre}`,
      tipo: "medida",
      texto: m.nombre,
      detalle: textoMedida(id),
      href: `/colchones/?medida=${encodeURIComponent(m.nombre)}`,
      n,
      unidad: "modelos",
      nucleo: normalizar(`${m.nombre} ${m.ancho} ${m.ancho}x${m.largo}`),
      contexto: "colchon colchones medida cama",
    });
  }
  return (ATAJOS = lista);
}

type Indice = { x: Atajo; contexto: string[]; palabras: string[] };
let INDICE: Indice[] | null = null;

// Las palabras ya en raíz, una vez: se consultan en cada tecla.
const indice = () =>
  (INDICE ??= atajos().map((x) => ({ x, contexto: x.contexto.split(" ").filter(Boolean).map(raiz), palabras: x.nucleo.split(" ").map(raiz) })));

function atajosPara(a: Analisis, max: number): Atajo[] {
  const elegidos: { x: Atajo; exacto: boolean }[] = [];
  for (const { x, contexto, palabras } of indice()) {
    const porMedida = x.tipo === "medida" && a.medidas.includes(x.texto);
    // Raíces con las que los términos entran en el núcleo; los demás tienen que ser contexto
    // (por igualdad, no prefijo: «firme» no puede colarse por «firmeza»).
    let raices: string[] | null = null;
    let porTexto = a.terminos.length > 0;
    for (const t of a.terminos) {
      const r = empiezaPalabra(x.nucleo, t.raiz) ? t.raiz : t.sinonimo && empiezaPalabra(x.nucleo, t.sinonimo.raiz) ? t.sinonimo.raiz : null;
      if (r) (raices ??= []).push(r);
      else if (!contexto.includes(t.raiz)) {
        porTexto = false;
        break;
      }
    }
    if (!raices) porTexto = false;
    if (!porMedida && !porTexto) continue;
    // Exacto: lo que nombra el atajo abre su núcleo («firme» → Firme, no Media-firme). Se
    // comparan solo los términos del núcleo: «colchón» en «colchón firme» es contexto.
    const exacto = porMedida || (!!raices && raices.join(" ") === palabras.slice(0, raices.length).join(" "));
    elegidos.push({ x, exacto });
  }
  return elegidos
    .sort((r, s) => Number(s.exacto) - Number(r.exacto) || s.x.n - r.x.n)
    .slice(0, max)
    .map((r) => r.x);
}

/* -------------------------------------------------------------- Sugerencias */

export type SugProducto = { producto: Producto; href: string; meta: string; desde: number; agotado: boolean };

export type Sugerencias =
  | { estado: "inicial"; frecuentes: Atajo[] }
  | { estado: "resultados"; consulta: string; analisis: Analisis; productos: SugProducto[]; atajos: Atajo[]; total: number }
  | { estado: "vacio"; consulta: string; alternativas: Atajo[] };

/** Atajos editoriales para el panel vacío; las cuentas y los enlaces salen de la tabla. */
const FRECUENTES = ["medida:Queen", "construccion:latex", "firmeza:Firme", "categoria:almohadas", "categoria:textil"];

/** Separador «·» que se parte antes, nunca después: el punto no se queda solo al final de línea. */
export const SEP = " \u00b7\u00a0";

/** Línea de contexto bajo el nombre, como en la tarjeta de la tienda. */
export function metaProducto(p: Producto) {
  if (p.categoria === "colchones" && p.coleccion && p.construccion && p.firmeza) {
    const coleccion = colecciones.find((c) => c.id === p.coleccion)?.nombre ?? "";
    return `${coleccion}${SEP}${NOMBRE_CORTO_CONSTRUCCION[p.construccion]}${SEP}Firmeza ${p.firmeza.toLowerCase()}`;
  }
  if (p.categoria === "almohadas" && p.firmeza) return `${nombreCategoria(p.categoria)}${SEP}Firmeza ${p.firmeza.toLowerCase()}`;
  return nombreCategoria(p.categoria);
}

// Sin medida en la consulta, la fila de un producto no depende de ella: se arma una vez y se
// reutiliza en cada tecla. Con medida («queen»), el precio y el agotado son los de esa medida,
// igual que en /tienda/?medida=Queen.
const FILAS = new WeakMap<Producto, SugProducto>();
function base(p: Producto): SugProducto {
  let f = FILAS.get(p);
  if (!f) FILAS.set(p, (f = { producto: p, href: `/producto/${p.slug}/`, meta: metaProducto(p), desde: precioDesde(p), agotado: agotado(p) }));
  return f;
}
function fila(p: Producto, medidas: string[] = []): SugProducto {
  if (!medidas.length) return base(p);
  const desde = precioParaFiltro(p, medidas, true) ?? precioParaFiltro(p, medidas) ?? precioDesde(p);
  const sinStock = !p.variantes.some((v) => medidas.includes(v.nombre) && v.stock > 0);
  return { ...base(p), desde, agotado: sinStock };
}

export function sugerir(
  q: string,
  { maxProductos = 6, maxAtajos = 3, lista = productos }: { maxProductos?: number; maxAtajos?: number; lista?: Producto[] } = {}
): Sugerencias {
  const analisis = analizar(q);
  // Lo mismo que hayConsulta(q), sin normalizar dos veces.
  if (analisis.texto.replace(/ /g, "").length < MIN_CARACTERES) {
    const tabla = atajos();
    return { estado: "inicial", frecuentes: FRECUENTES.map((k) => tabla.find((x) => x.clave === k)).filter((x): x is Atajo => !!x) };
  }
  const consulta = q.trim();
  const encontrados = lista
    .filter((p) => coincide(p, analisis))
    .map((p) => ({ p, s: puntuar(p, analisis) }))
    .sort((a, b) => b.s - a.s || a.p.orden - b.p.orden);
  const directos = atajosPara(analisis, maxAtajos);
  if (!encontrados.length && !directos.length) {
    return { estado: "vacio", consulta, alternativas: atajos().filter((x) => x.tipo === "categoria") };
  }
  return {
    estado: "resultados",
    consulta,
    analisis,
    productos: encontrados.slice(0, maxProductos).map(({ p }) => fila(p, analisis.medidas)),
    atajos: directos,
    total: encontrados.length,
  };
}

/* ---------------------------------------------------------------- Resaltado */

/**
 * Trozos del texto original con lo que coincide marcado. Solo marca al inicio de palabra (en
 * «Compás», «compa» sí; en «acompaña», no) y conserva tildes y mayúsculas del original.
 */
export function resaltar(texto: string, a: Analisis): { t: string; marca: boolean }[] {
  // Normaliza carácter a carácter y guarda de qué carácter original sale cada uno.
  let norm = "";
  const origen: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    const n = texto[i]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, " ");
    for (const ch of n) {
      norm += ch;
      origen.push(i);
    }
  }
  const marcas = new Array<boolean>(texto.length).fill(false);
  const marcar = (t: string) => {
    let hubo = false;
    for (let desde = norm.indexOf(t); desde !== -1; desde = norm.indexOf(t, desde + 1)) {
      if (desde > 0 && norm[desde - 1] !== " ") continue;
      for (let k = desde; k < desde + t.length; k++) marcas[origen[k]] = true;
      hubo = true;
    }
    return hubo;
  };
  // La palabra tal cual gana a la raíz: «sábanas» se marca entera, no «sábana» + «s».
  for (const t of a.terminos) {
    const opciones = [t.original, t.raiz, t.sinonimo?.original, t.sinonimo?.raiz].filter((x): x is string => !!x);
    for (const o of opciones) if (marcar(o)) break;
  }
  for (const m of a.medidas) marcar(normalizar(m));

  const trozos: { t: string; marca: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ultimo = trozos[trozos.length - 1];
    if (ultimo && ultimo.marca === marcas[i]) ultimo.t += texto[i];
    else trozos.push({ t: texto[i], marca: marcas[i] });
  }
  return trozos;
}

/** Destino de «Ver todos»: la tienda con la consulta tal cual la escribió la persona. */
export const hrefResultados = (q: string) => (q.trim() ? `/tienda/?q=${encodeURIComponent(q.trim())}` : "/tienda/");
