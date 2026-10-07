/**
 * Tipos del catálogo y medidas compartidas.
 *
 * Separados de `catalog.ts` para que los archivos de productos (`colchones.ts`) puedan
 * importarlos sin crear un ciclo. Un **modelo** (`Producto`) es el artículo comercial con nombre,
 * descripción e imágenes; una **variante** es cada combinación vendible —medida y, si hiciera
 * falta, otras opciones— con su propio SKU, precio y stock. Queen y King de un mismo colchón son
 * variantes, nunca productos distintos.
 */

export type CategoriaId = "colchones" | "almohadas" | "textil" | "bases";

export type ColeccionId = "esenciales" | "confort" | "premium";

/** Construcción del núcleo; es lo primero que diferencia a un colchón de otro. */
export type Construccion = "espuma" | "resortes" | "ensacados" | "viscoelastica" | "latex" | "hibrido";

/** Etiquetas de firmeza. `nivel` (1–5) permite ordenar y dibujar el eje sin adivinar. */
export type Firmeza = "Suave" | "Media-suave" | "Media" | "Media-firme" | "Firme";
export const NIVEL_FIRMEZA: Record<Firmeza, 1 | 2 | 3 | 4 | 5> = {
  Suave: 1,
  "Media-suave": 2,
  Media: 3,
  "Media-firme": 4,
  Firme: 5,
};
export const FIRMEZAS: Firmeza[] = ["Suave", "Media-suave", "Media", "Media-firme", "Firme"];

export type Categoria = {
  id: CategoriaId;
  nombre: string;
  /** Texto corto para el megamenú y las cabeceras de la tienda. */
  resumen: string;
  imagen: { src: string; alt: string };
};

export type Coleccion = {
  id: ColeccionId;
  nombre: string;
  resumen: string;
};

export type Variante = {
  id: string;
  nombre: string;
  /** Referencia única de la variante. */
  sku: string;
  /** Medida real en centímetros; en accesorios puede ser el formato. */
  medida: string;
  /** Dimensiones en cm cuando se conocen (colchones, bases, textil de cama). */
  dimensiones?: { ancho: number; largo: number; alto?: number };
  precio: number;
  /** Unidades disponibles. 0 = agotada. */
  stock: number;
};

export type Producto = {
  slug: string;
  nombre: string;
  categoria: CategoriaId;
  /** Solo colchones. */
  coleccion?: ColeccionId;
  construccion?: Construccion;
  /** Una línea con lo que diferencia al producto, para la tarjeta. */
  resumen: string;
  descripcion: string;
  /** Colchones y almohadas. */
  firmeza?: Firmeza;
  altura?: string;
  imagen: { src: string; alt: string };
  /** Segunda imagen para el hover de la tarjeta y la galería. */
  imagenHover?: { src: string; alt: string };
  variantes: Variante[];
  beneficios: string[];
  /** Ficha técnica: pares clave/valor. */
  especificaciones: { k: string; v: string }[];
  /** Orden editorial de la casa; se usa como criterio «Recomendado». */
  orden: number;
  /** Entra en «Selección Almara» de la portada. */
  destacado?: boolean;
  /** Datos de muestra: nombre, precios, stock y especificaciones son ejemplos. */
  demo?: boolean;
};

/**
 * Medidas de cama. El id es el ancho en cm y sirve de sufijo de SKU. Cada variante lleva sus
 * dimensiones propias: no se presupone que todas las marcas midan igual.
 */
export const MEDIDAS = {
  "090": { nombre: "Una plaza", ancho: 90, largo: 190 },
  "120": { nombre: "Plaza y media", ancho: 120, largo: 190 },
  "140": { nombre: "Dos plazas", ancho: 140, largo: 190 },
  "160": { nombre: "Queen", ancho: 160, largo: 200 },
  "180": { nombre: "King", ancho: 180, largo: 200 },
  "200": { nombre: "Super King", ancho: 200, largo: 200 },
} as const;

export type MedidaId = keyof typeof MEDIDAS;

export const textoMedida = (id: MedidaId) => `${MEDIDAS[id].ancho} × ${MEDIDAS[id].largo} cm`;
