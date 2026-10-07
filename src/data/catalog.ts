/**
 * Catálogo comercial de Almara.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * DATOS DE DEMOSTRACIÓN. Almara es una marca conceptual: no existe el negocio,
 * de modo que **precios, stock, medidas y plazos son de ejemplo**. Los colchones
 * viven en `colchones.ts` y los complementos aquí; los tipos y las medidas, en
 * `tipos.ts`. Sustituir el catálogo real es cambiar estos módulos y nada más:
 * ningún componente inventa datos ni los calcula a partir de promesas.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { colchones } from "./colchones";
import { MEDIDAS, textoMedida, type Categoria, type CategoriaId, type Coleccion, type ColeccionId, type MedidaId, type Producto, type Variante } from "./tipos";

export type { Categoria, CategoriaId, Coleccion, ColeccionId, Construccion, Firmeza, MedidaId, Producto, Variante } from "./tipos";
export { FIRMEZAS, MEDIDAS, NIVEL_FIRMEZA, textoMedida } from "./tipos";
export { NOMBRE_CONSTRUCCION, NOMBRE_CORTO_CONSTRUCCION } from "./colchones";

export const MONEDA = "S/";

/** Todo el catálogo son datos de muestra mientras no llegue el del cliente. */
export const CATALOGO_DEMO = true;

export const categorias: Categoria[] = [
  {
    id: "colchones",
    nombre: "Colchones",
    resumen: "Firmezas, construcciones y medidas.",
    imagen: { src: "/images/colchon-natura.jpg", alt: "Dormitorio con ropa de cama en tono salvia" },
  },
  {
    id: "almohadas",
    nombre: "Almohadas",
    resumen: "La altura correcta para tu postura.",
    imagen: { src: "/images/almohada-nube.jpg", alt: "Almohada blanca sobre una manta de punto" },
  },
  {
    id: "textil",
    nombre: "Ropa de cama",
    resumen: "Lino lavado y protección diaria.",
    imagen: { src: "/images/immersive-dormitorio.jpg", alt: "Cama con funda de lino terracota y ropa de cama a rayas color arena" },
  },
  {
    id: "bases",
    nombre: "Bases",
    resumen: "El soporte que el colchón necesita.",
    imagen: { src: "/images/base-madera.jpg", alt: "Cama con base de madera clara y mesilla" },
  },
];

export const colecciones: Coleccion[] = [
  { id: "esenciales", nombre: "Esenciales", resumen: "Construcciones sencillas y precios de entrada." },
  { id: "confort", nombre: "Confort", resumen: "Más altura y acogida: ensacados, látex y viscoelástica." },
  { id: "premium", nombre: "Premium", resumen: "Híbridos y materiales naturales con acabados de hotel." },
];

/** Variante de complemento con medida de cama. */
const v = (id: MedidaId, sku: string, precio: number, stock: number): Variante => ({
  id,
  nombre: MEDIDAS[id].nombre,
  sku: `${sku}-${id}`,
  medida: textoMedida(id),
  dimensiones: { ancho: MEDIDAS[id].ancho, largo: MEDIDAS[id].largo },
  precio,
  stock,
});

const complementos: Producto[] = [
  /* --------------------------------------------------------------- ALMOHADAS */
  {
    slug: "almohada-nube",
    nombre: "Almohada Nube",
    categoria: "almohadas",
    resumen: "Viscoelástica, se adapta y vuelve a su forma",
    descripcion:
      "Núcleo viscoelástico que cede con el calor del cuerpo y recupera su forma al levantarte. Para quien nota que la almohada se queda hundida a media noche.",
    firmeza: "Media",
    altura: "14 cm",
    imagen: { src: "/images/almohada-nube.jpg", alt: "Almohada blanca sobre una manta de punto" },
    variantes: [
      { id: "70", nombre: "70 cm", sku: "ALM-ANU-70", medida: "70 × 40 cm", dimensiones: { ancho: 70, largo: 40, alto: 14 }, precio: 159, stock: 24 },
      { id: "90", nombre: "90 cm", sku: "ALM-ANU-90", medida: "90 × 40 cm", dimensiones: { ancho: 90, largo: 40, alto: 14 }, precio: 189, stock: 18 },
    ],
    beneficios: ["Núcleo viscoelástico", "Funda lavable con cremallera", "Altura media, 14 cm", "Tejido transpirable"],
    especificaciones: [
      { k: "Relleno", v: "Viscoelástica en bloque" },
      { k: "Altura", v: "14 cm" },
      { k: "Firmeza", v: "Media" },
      { k: "Funda", v: "Lavable a 30°" },
    ],
    demo: true,
    orden: 104,
  },
  {
    slug: "almohada-lino",
    nombre: "Almohada Lino",
    categoria: "almohadas",
    resumen: "Fibra suelta y funda de lino lavado",
    descripcion:
      "Relleno de fibra que se puede ahuecar y funda de lino lavado. La opción mullida, para quien prefiere moldear la almohada cada noche.",
    firmeza: "Suave",
    altura: "12 cm",
    imagen: { src: "/images/almohada-lino.jpg", alt: "Cojines de lino y terciopelo en tonos arena sobre madera" },
    variantes: [
      { id: "70", nombre: "70 cm", sku: "ALM-ALI-70", medida: "70 × 40 cm", dimensiones: { ancho: 70, largo: 40, alto: 12 }, precio: 119, stock: 30 },
      { id: "90", nombre: "90 cm", sku: "ALM-ALI-90", medida: "90 × 40 cm", dimensiones: { ancho: 90, largo: 40, alto: 12 }, precio: 139, stock: 0 },
    ],
    beneficios: ["Relleno de fibra ahuecable", "Funda de lino lavado", "Altura baja, 12 cm", "Tacto fresco"],
    especificaciones: [
      { k: "Relleno", v: "Fibra siliconada" },
      { k: "Altura", v: "12 cm" },
      { k: "Firmeza", v: "Suave" },
      { k: "Funda", v: "Lino lavado" },
    ],
    demo: true,
    orden: 105,
  },

  /* ------------------------------------------------------------------ TEXTIL */
  {
    slug: "sabanas-lino",
    nombre: "Juego de sábanas de lino",
    categoria: "textil",
    resumen: "Lino lavado a rayas, más suave con cada lavado",
    descripcion:
      "Bajera, encimera y dos fundas en lino lavado. Llega ya suavizado, así que no hay que esperar meses de uso para que deje de estar rígido.",
    imagen: { src: "/images/sabanas-lino.jpg", alt: "Cama vestida con sábanas de lino a rayas terracota y arena" },
    imagenHover: { src: "/images/immersive-dormitorio.jpg", alt: "Detalle del lino sobre cabecero de roble" },
    variantes: [
      v("140", "ALM-SAB", 349, 14),
      v("160", "ALM-SAB", 399, 10),
      v("180", "ALM-SAB", 449, 6),
    ],
    beneficios: ["Lino lavado, listo para usar", "Bajera, encimera y dos fundas", "Rayas terracota sobre arena", "Apto para secadora"],
    especificaciones: [
      { k: "Composición", v: "100 % lino lavado" },
      { k: "Incluye", v: "Bajera, encimera, 2 fundas" },
      { k: "Lavado", v: "30°, admite secadora" },
      { k: "Color", v: "Rayas terracota / arena" },
    ],
    demo: true,
    orden: 106,
  },
  {
    slug: "protector-impermeable",
    nombre: "Protector impermeable",
    categoria: "textil",
    resumen: "Capa transpirable que no cruje al moverte",
    descripcion:
      "Rizo de algodón con membrana impermeable por debajo. Protege el colchón sin sensación plastificada y sin ruido al moverte.",
    imagen: { src: "/images/protector-impermeable.jpg", alt: "Textiles de cama doblados y apilados" },
    variantes: [
      v("120", "ALM-PRO", 129, 20),
      v("140", "ALM-PRO", 149, 16),
      v("160", "ALM-PRO", 169, 11),
      v("180", "ALM-PRO", 189, 8),
    ],
    beneficios: ["Rizo de algodón transpirable", "Membrana impermeable silenciosa", "Falda ajustable hasta 30 cm", "Lavable a 60°"],
    especificaciones: [
      { k: "Cara superior", v: "Rizo de algodón" },
      { k: "Membrana", v: "Impermeable y transpirable" },
      { k: "Altura de falda", v: "Hasta 30 cm" },
      { k: "Lavado", v: "60°" },
    ],
    demo: true,
    orden: 107,
  },

  /* ------------------------------------------------------------------- BASES */
  {
    slug: "base-madera",
    nombre: "Base de madera",
    categoria: "bases",
    resumen: "Somier de láminas, ventilación por debajo",
    descripcion:
      "Estructura de madera con láminas flexibles. Deja respirar al colchón por abajo, que es donde se acumula la humedad de la noche.",
    imagen: { src: "/images/base-madera.jpg", alt: "Dormitorio con cama de madera clara, manta gris y lámpara" },
    variantes: [
      v("120", "ALM-BMA", 490, 7),
      v("140", "ALM-BMA", 590, 9),
      v("160", "ALM-BMA", 690, 5),
      v("180", "ALM-BMA", 790, 3),
    ],
    beneficios: ["Láminas de madera flexibles", "Ventilación inferior", "Montaje sin herramientas especiales", "Patas de 25 cm incluidas"],
    especificaciones: [
      { k: "Estructura", v: "Madera maciza" },
      { k: "Láminas", v: "Flexibles, ancho 6 cm" },
      { k: "Altura con patas", v: "25 cm" },
      { k: "Montaje", v: "Requiere ensamblaje" },
    ],
    demo: true,
    orden: 108,
  },
  {
    slug: "base-tapizada",
    nombre: "Base tapizada",
    categoria: "bases",
    resumen: "Cabecero acolchado y base firme y continua",
    descripcion:
      "Superficie continua tapizada, sin láminas. Da un apoyo más firme al colchón y suma cabecero, así que la cama queda resuelta de una vez.",
    imagen: { src: "/images/base-tapizada.jpg", alt: "Dormitorio con base tapizada y cabecero acolchado oscuro" },
    variantes: [
      v("140", "ALM-BTA", 890, 4),
      v("160", "ALM-BTA", 990, 3),
      v("180", "ALM-BTA", 1190, 0),
    ],
    beneficios: ["Superficie continua, apoyo firme", "Cabecero acolchado incluido", "Tejido de tacto suave", "Patas de 25 cm incluidas"],
    especificaciones: [
      { k: "Superficie", v: "Continua tapizada" },
      { k: "Cabecero", v: "Incluido, 110 cm" },
      { k: "Altura con patas", v: "25 cm" },
      { k: "Tapizado", v: "Tejido de poliéster" },
    ],
    demo: true,
    orden: 109,
  },
];

export const productos: Producto[] = [...colchones, ...complementos];

/* --------------------------------------------------------------- Utilidades */

export const productoPorSlug = (slug: string) => productos.find((p) => p.slug === slug);
export const productosDeCategoria = (id: CategoriaId) => productos.filter((p) => p.categoria === id);
export const categoriaPorId = (id: CategoriaId) => categorias.find((c) => c.id === id)!;
export const coleccionPorId = (id: ColeccionId) => colecciones.find((c) => c.id === id)!;
export const colchonesDeColeccion = (id: ColeccionId) => colchones.filter((p) => p.coleccion === id);
export const destacados = () => colchones.filter((p) => p.destacado).sort((a, b) => a.orden - b.orden);

/** Productos por página en la tienda; el catálogo provisional pinta la misma primera página. */
export const POR_PAGINA = 12;

/** Precio más bajo del producto entre variantes con stock; si todo está agotado, el más bajo. */
export const precioDesde = (p: Producto) => {
  const conStock = p.variantes.filter((x) => x.stock > 0);
  return Math.min(...(conStock.length ? conStock : p.variantes).map((x) => x.precio));
};

/**
 * Precio «desde» considerando solo las variantes que cumplen el filtro de medida (y stock si se
 * pide). Devuelve `null` si ninguna variante encaja: así un colchón no entra en «Queen hasta
 * S/ 2.000» por el precio de su plaza y media.
 */
export const precioParaFiltro = (p: Producto, medidas: string[], soloStock = false): number | null => {
  const aptas = p.variantes.filter((x) => (!medidas.length || medidas.includes(x.nombre)) && (!soloStock || x.stock > 0));
  return aptas.length ? Math.min(...aptas.map((x) => x.precio)) : null;
};

/** Precio de una medida concreta, o `null` si el modelo no la ofrece. */
export const precioEnMedida = (p: Producto, medida: string) => p.variantes.find((x) => x.nombre === medida)?.precio ?? null;

/** Un producto está agotado solo si lo están todas sus variantes. */
export const agotado = (p: Producto) => p.variantes.every((x) => x.stock === 0);

/** Medidas de cama presentes en el catálogo, en el orden de `MEDIDAS`. */
export const medidasDisponibles = (lista: Producto[] = productos) => {
  const presentes = new Set<string>(lista.flatMap((p) => p.variantes.map((x) => x.nombre)));
  // Orden por ancho: las claves con cero inicial ("090") no se ordenan como enteros en JS.
  return [...Object.values(MEDIDAS)]
    .sort((a, b) => a.ancho - b.ancho)
    .map((m) => m.nombre as string)
    .filter((n) => presentes.has(n));
};

/** Formato de precio en soles, sin decimales (los precios del catálogo son enteros). Un solo
 *  formateador: `toLocaleString` con opciones creaba uno en cada llamada y, con una tarjeta por
 *  producto, pesaba en la hidratación. */
const FORMATO_PRECIO = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
export const precio = (valor: number) => `${MONEDA} ${FORMATO_PRECIO.format(valor)}`;

/**
 * Condiciones de envío. También son de demostración: no hay transportista
 * contratado ni cobertura real que consultar.
 */
export const envio = {
  gratisDesde: 500,
  costo: 25,
  zona: "Lima Metropolitana",
  plazo: "2 a 5 días hábiles",
  nota: "Condiciones de ejemplo: no hay transportista contratado.",
};

/** Coste de envío de un subtotal dado. */
export const costoEnvio = (subtotal: number) => (subtotal >= envio.gratisDesde || subtotal === 0 ? 0 : envio.costo);
