/**
 * Contenido editorial de cada colchón: lo que la ficha cuenta más allá del precio.
 * Los datos comerciales (precio, variantes, stock) viven en `catalog.ts`.
 */
import type { Model } from "./content";

export const modelSlugs: Record<Model["id"], string> = {
  esencial: "esencial",
  natura: "natura",
  signature: "signature",
};

export const modelUrl = (id: Model["id"]) => `/producto/${modelSlugs[id]}/`;

export type ModelPage = {
  id: Model["id"];
  slug: string;
  seo: { title: string; description: string };
  /** Frase de apertura de la página, dividida en líneas editoriales */
  intro: string;
  /** Ficha técnica: pares clave/valor */
  spec: { k: string; v: string }[];
  /** Construcción por capas, de la superficie al soporte */
  layers: { n: string; title: string; text: string }[];
  /** Para quién está pensado / cuándo conviene otro modelo */
  fit: { forWho: string; sleepers: string; alternative: string };
  /** Cuidados del modelo */
  care: string[];
  faqIndexes: number[];
};

export const modelPages: ModelPage[] = [
  {
    id: "esencial",
    slug: modelSlugs.esencial,
    seo: {
      title: "Colchón Esencial · firmeza media | Almara",
      description:
        "Esencial es el colchón de firmeza media de Almara: núcleo de alta densidad, acolchado de tacto suave y laterales reforzados. Comodidad equilibrada para todos los días.",
    },
    intro: "Comodidad equilibrada, noche tras noche.",
    spec: [
      { k: "Firmeza", v: "Media" },
      { k: "Altura", v: "24 cm" },
      { k: "Acogida", v: "Moderada" },
      { k: "Tejido", v: "Transpirable, tratamiento antiácaros" },
      { k: "Postura", v: "Boca arriba · boca abajo · mixta" },
      { k: "Medidas", v: "Plaza y media · dos plazas · queen · king" },
    ],
    layers: [
      { n: "01", title: "Tejido superior", text: "Transpirable y de tacto seco: regula la humedad de la noche." },
      { n: "02", title: "Acolchado de acogida", text: "Suaviza el primer contacto sin quitar estabilidad." },
      { n: "03", title: "Núcleo de alta densidad", text: "Reparte el peso y mantiene la columna alineada al cambiar de postura." },
      { n: "04", title: "Perímetro reforzado", text: "Borde firme para sentarte y para que el colchón conserve su forma." },
    ],
    fit: {
      forWho: "Quien quiere una sensación estable: ni hundirse ni notarlo duro.",
      sleepers: "Boca arriba, boca abajo o cambiando de postura.",
      alternative: "Si duermes de lado y te molesta el hombro, prueba Natura.",
    },
    care: [
      "Airea la habitación antes de hacer la cama",
      "Gíralo cabeza-pies cada tres o cuatro meses",
      "Usa un protector lavable",
      "Apóyalo sobre una base firme y nivelada",
    ],
    faqIndexes: [0, 1, 2, 3],
  },
  {
    id: "natura",
    slug: modelSlugs.natura,
    seo: {
      title: "Colchón Natura · firmeza media-suave | Almara",
      description:
        "Natura es el colchón media-suave de Almara: acogida envolvente, funda de algodón y zonas diferenciadas de apoyo. Pensado para quien duerme de lado.",
    },
    intro: "Suavidad envolvente, sensación natural.",
    spec: [
      { k: "Firmeza", v: "Media-suave" },
      { k: "Altura", v: "27 cm" },
      { k: "Acogida", v: "Envolvente" },
      { k: "Tejido", v: "Funda de algodón" },
      { k: "Postura", v: "De lado · mixta" },
      { k: "Medidas", v: "Plaza y media · dos plazas · queen · king" },
    ],
    layers: [
      { n: "01", title: "Funda de algodón", text: "Fibra natural, agradable al tacto; con protector se mantiene limpia." },
      { n: "02", title: "Acogida de mayor recorrido", text: "Más profunda, para que hombro y cadera se acomoden de lado." },
      { n: "03", title: "Zonas diferenciadas", text: "El soporte cambia a lo largo del colchón para sostener mejor la zona lumbar." },
      { n: "04", title: "Núcleo firme", text: "Debajo de la suavidad, evita que el cuerpo se hunda de más." },
    ],
    fit: {
      forWho: "Quien duerme de lado o quiere más acolchado sin perder soporte.",
      sleepers: "De lado, sobre todo si notas presión en hombro o cadera.",
      alternative: "Si cambias mucho de postura y quieres algo más estable, prueba Esencial.",
    },
    care: [
      "Airea la habitación antes de hacer la cama",
      "Gíralo cabeza-pies cada tres o cuatro meses",
      "Usa protector para cuidar la funda de algodón",
      "No lo dobles ni lo apoyes en superficies irregulares",
    ],
    faqIndexes: [0, 2, 1, 3],
  },
  {
    id: "signature",
    slug: modelSlugs.signature,
    seo: {
      title: "Colchón Signature · pillow top | Almara",
      description:
        "Signature es la construcción más completa de Almara: multicapa con núcleo firme, pillow top integrado y tejido de tacto seda. Confort superior en casa.",
    },
    intro: "La sensación de hotel, en tu habitación.",
    spec: [
      { k: "Firmeza", v: "Suave-envolvente" },
      { k: "Altura", v: "31 cm" },
      { k: "Acogida", v: "Pillow top integrado" },
      { k: "Tejido", v: "Alto gramaje, tacto seda" },
      { k: "Postura", v: "De lado · mixta" },
      { k: "Medidas", v: "Dos plazas · queen · king" },
    ],
    layers: [
      { n: "01", title: "Pillow top integrado", text: "Capa cosida arriba que amortigua el primer contacto." },
      { n: "02", title: "Tejido de tacto seda", text: "Más gramaje, banda perimetral cosida y asas laterales." },
      { n: "03", title: "Capas intermedias", text: "Varias densidades que reparten la presión de forma progresiva." },
      { n: "04", title: "Núcleo firme", text: "Sostiene todo el conjunto sin que pierda altura." },
    ],
    fit: {
      forWho: "Quien quiere la superficie más mullida de los tres.",
      sleepers: "De lado o mixta, si te gustan las camas altas.",
      alternative: "Si prefieres notar más el soporte que el acolchado, prueba Esencial.",
    },
    care: [
      "Airea la habitación antes de hacer la cama",
      "Gíralo cabeza-pies cada tres o cuatro meses",
      "No le des la vuelta: el pillow top va arriba",
      "Usa las asas para acomodarlo, no para cargarlo",
    ],
    faqIndexes: [2, 0, 3, 1],
  },
];

export const getModelPage = (slug: string) => modelPages.find((p) => p.slug === slug);
