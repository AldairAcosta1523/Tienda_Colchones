import { envio } from "./catalog";
import { contacto } from "./comercial";

/**
 * Única fuente de contenido de Almara.
 *
 * Almara es una marca conceptual creada para una demo de diseño y desarrollo web.
 * El copy es comercial pero deliberadamente verificable: no incluye certificaciones,
 * porcentajes clínicos, garantías, años de experiencia ni reseñas inventadas.
 */

export const site = {
  name: "Almara",
  legalName: "Almara",
  tagline: "Colchones para cada forma de dormir.",
  title: "Almara | Colchones para descansar mejor",
  description:
    "Colchones por firmeza, construcción y medida, con almohadas, bases y ropa de cama para completar el dormitorio. Compara modelos y elige por cómo duermes.",
};

/** Datos de contacto: la fuente es `data/comercial.ts`; aquí solo se adaptan los nombres. */
export const contact = {
  email: contacto.email,
  address: contacto.direccion,
  hours: contacto.horario,
};

export const nav = [
  { label: "Nuestro confort", href: "#confort" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Preguntas frecuentes", href: "#faq" },
];

export const hero = {
  eyebrow: "Colchones · Almohadas · Bases · Ropa de cama",
  lines: ["Encuentra tu", "próximo", "colchón."],
  caption: "Lino lavado, madera y luz de mañana",
  description:
    "Explora modelos, medidas y firmezas para elegir el descanso que va contigo. Compara los que te interesen y decide por cómo duermes.",
  primaryCta: { label: "Explorar colchones", href: "/colchones/" },
  secondaryCta: { label: "Ayúdame a elegir", href: "/guia/" },
  signals: ["30 noches de prueba", "10 años de garantía", `Envío gratis en Lima desde S/ ${envio.gratisDesde}`],
  image: {
    src: "/images/hero-dormitorio.jpg",
    alt: "Dormitorio luminoso con una cama de base de madera, edredón de lino claro y cojines en tonos arena",
  },
};

export const benefits = {
  eyebrow: "Por qué Almara",
  title: ["Descansar bien", "no debería", "ser complicado."],
  intro: "Sostener el cuerpo con firmeza y recibirlo con suavidad. Lo demás está al servicio de esa noche.",
  items: [
    {
      k: "01",
      title: "Confort para cada noche",
      text: "Capas de acolchado que reciben el cuerpo sin hundirlo, para que la postura cambie sin despertarte.",
    },
    {
      k: "02",
      title: "Materiales seleccionados",
      text: "Tejidos transpirables y espumas de distinta densidad, elegidos por cómo se sienten después de varias horas.",
    },
    {
      k: "03",
      title: "Soporte y bienestar",
      text: "Un núcleo firme que mantiene la columna alineada y reparte el peso en los puntos de apoyo.",
    },
    {
      k: "04",
      title: "Diseños que se adaptan a ti",
      text: "Varias firmezas, construcciones y medidas para que el colchón se ajuste a tu cama y a tu forma de dormir.",
    },
  ],
};

export type Model = {
  index: string;
  id: "esencial" | "natura" | "signature";
  name: string;
  short: string;
  /** Etiqueta de firmeza visible en tarjeta y ficha */
  firmness: "Media" | "Media-suave" | "Suave-envolvente";
  height: string;
  description: string;
  features: string[];
  image: { src: string; alt: string };
  cta: string;
};

export const collection = {
  eyebrow: "Selección Almara",
  title: ["Para empezar", "a", "elegir."],
  intro: "Una muestra de distintas construcciones, firmezas y precios. El catálogo completo está en Colchones.",
};

export const immersive = {
  eyebrow: "El arte de descansar",
  title: ["El lujo de", "sentirte en casa."],
  note: "Lino lavado, madera clara y un colchón que sostiene. El descanso no necesita mucho más.",
  paragraphs: [
    "En un dormitorio no hay nada que demostrar. Lino que ya se ha lavado muchas veces, madera clara y un colchón que te sostiene ocho horas sin que pienses en él. Si lo consigue, la luz y el silencio hacen el resto.",
  ],
  notes: [
    { k: "La mañana", text: "Abrir la ventana antes de hacer la cama. El colchón también necesita aire." },
    { k: "El tacto", text: "Lino que ya no está nuevo. Se nota en la piel, no en la etiqueta." },
    { k: "La noche", text: "Un colchón que sostiene sin hacerse notar. Si piensas en él, algo falla." },
  ],
  image: {
    src: "/images/immersive-dormitorio.jpg",
    alt: "Detalle de una cama con cabecero de roble, funda de lino terracota y ropa de cama a rayas color arena",
  },
  imageAlt: {
    src: "/images/nosotros.jpg",
    alt: "Rincón de dormitorio con cabecero de fibras naturales, textiles en tonos tierra y cestas de mimbre",
    caption: "Fibras naturales, tonos tierra",
  },
};

export const comfort = {
  eyebrow: "Nuestro confort",
  title: ["De la superficie", "al núcleo,", "capa por capa."],
  paragraphs: [
    "Un colchón se juzga en la séptima hora, no en los primeros treinta segundos. Por eso elegimos los materiales por cómo envejecen: tejido que respira, espuma que recupera su forma y costura que aguanta el uso diario.",
  ],
  layers: [
    { k: "Tejido", text: "Superficie transpirable que regula la humedad y el calor." },
    { k: "Acogida", text: "Capas de acolchado que amortiguan hombros y caderas." },
    { k: "Núcleo", text: "Base firme que mantiene la columna alineada." },
    { k: "Perímetro", text: "Borde reforzado para que el colchón conserve su forma." },
  ],
  image: {
    src: "/images/detalle-tejido.jpg",
    alt: "Detalle de la ropa de cama: edredón de lino, cojines de terciopelo en tonos arena y base de madera",
  },
};

export const lab = {
  eyebrow: "Almara Comfort Lab",
  title: ["Míralo", "por dentro."],
  intro: "Gíralo o abre sus capas para ver cómo se construye un colchón híbrido. Es un esquema orientativo: cada modelo detalla sus capas en su ficha.",
  hint: "Arrastra para girar",
  views: [
    { id: "perspective", label: "Perspectiva" },
    { id: "front", label: "Frontal" },
    { id: "top", label: "Superior" },
  ],
  explode: { open: "Abrir capas", close: "Cerrar capas" },
  hotspots: [
    {
      id: "confort",
      n: "01",
      title: "Confort",
      text: "Tapa acolchada en rombo: reparte el primer contacto y fija el relleno.",
    },
    {
      id: "materiales",
      n: "02",
      title: "Materiales",
      text: "Lateral transpirable, vivo cosido y asas para girarlo sin forzar las costuras.",
    },
    {
      id: "soporte",
      n: "03",
      title: "Soporte",
      text: "Núcleo firme por zonas que mantiene la columna alineada.",
    },
  ],
  fallback: {
    note: "Tu navegador no tiene WebGL disponible, así que mostramos una fotografía en lugar del modelo interactivo.",
    image: {
      src: "/images/detalle-tejido.jpg",
      alt: "Detalle del colchón: edredón de lino, cojines en tonos arena y base de madera",
    },
  },
} as const;

export const guide = {
  eyebrow: "Cómo elegir",
  title: ["Lo que conviene saber", "antes de decidir."],
  intro: "Postura, medida y qué te molesta hoy. Con eso se acota casi siempre.",
  steps: [
    {
      n: "01",
      title: "¿En qué postura duermes?",
      text: "Boca arriba o boca abajo: firmeza media o firme. De lado: una acogida más suave para que hombro y cadera se hundan lo justo.",
      hint: "Suave · media-suave · media · media-firme · firme",
    },
    {
      n: "02",
      title: "¿Qué medida necesitas?",
      text: "Mide la base, no el colchón viejo. El largo debe superar tu estatura en 15 a 20 cm; en pareja, prioriza el ancho.",
      hint: "Plaza y media · dos plazas · queen · king",
    },
    {
      n: "03",
      title: "¿Qué te molesta hoy?",
      text: "Si pasas calor, fíjate en el tejido. Si te levantas cargado, en el soporte. Si te mueves mucho, en una firmeza estable.",
      hint: "Tejido, soporte y firmeza responden a cosas distintas",
    },
  ],
  image: {
    src: "/images/guia-confort.jpg",
    alt: "Dormitorio cálido con paredes de madera, cama amplia y vista a un jardín",
  },
};

export const about = {
  eyebrow: "Sobre Almara",
  title: ["Una marca que", "empieza por", "la noche."],
  paragraphs: [
    "Elegir un colchón suele ser una decisión a ciegas: diez minutos en una tienda para algo que usarás cada noche durante años. Nosotros lo hacemos al revés: pocas opciones, bien explicadas.",
  ],
  values: [
    { k: "Catálogo claro", text: "Cada colchón explica su construcción, firmeza y altura con las mismas palabras." },
    { k: "Lenguaje claro", text: "Explicamos firmeza y materiales sin tecnicismos ni promesas médicas." },
    { k: "Descanso primero", text: "Cada decisión de diseño se mide por cómo se duerme, no por cómo se ve." },
  ],
  image: {
    src: "/images/nosotros.jpg",
    alt: "Rincón de dormitorio con cabecero de fibras naturales, textiles en tonos tierra y cestas de mimbre",
  },
};

export const faq = {
  title: ["Antes de", "elegir tu", "colchón."],
  items: [
    {
      q: "¿Cómo elijo la firmeza adecuada?",
      a: "Por tu postura. Boca arriba o boca abajo: firmeza media o firme. De lado: una acogida más suave. Si duermes acompañado y pesan muy distinto, una firmeza intermedia suele servir a los dos. La guía de elección filtra el catálogo con estas tres preguntas.",
    },
    {
      q: "¿Qué tamaño de colchón necesito?",
      a: "Mide la base, no el colchón viejo. El largo debe superar tu estatura en 15 a 20 cm; en pareja, prioriza el ancho para girarse sin despertar al otro.",
    },
    {
      q: "¿En qué se diferencian las colecciones?",
      a: "Esenciales son construcciones sencillas y precios de entrada; Confort suma altura y acogida con ensacados, látex o viscoelástica; Premium combina híbridos y materiales naturales con acabados de hotel. Dentro de cada una cambian firmeza, altura y medidas.",
    },
    {
      q: "¿Puedo comparar modelos?",
      a: "Sí. Pulsa «Comparar» en hasta cuatro colchones desde la tienda o la ficha y verás construcción, firmeza, altura, materiales y precio en la misma medida, uno al lado del otro.",
    },
    {
      q: "¿Cómo debo cuidar mi colchón?",
      a: "Airea la habitación antes de hacer la cama, gíralo cabeza-pies cada pocos meses y usa un protector lavable. No lo dobles y apóyalo sobre una base firme y nivelada.",
    },
    {
      q: "¿Puedo pedir información sobre un modelo concreto?",
      a: "Sí. Cada modelo tiene su ficha con firmeza, altura, materiales y medidas, y desde el formulario de consulta puedes preguntarnos por uno en particular.",
    },
  ],
  more: { title: "¿Otra pregunta?", cta: "Escríbenos" },
};

export const finalCta = {
  eyebrow: "Cambios y devoluciones",
  headline: ["Pruébalo", "30 noches", "en casa."],
  sub: "Si no encaja, lo recogemos en tu domicilio y te devolvemos el importe completo.",
  cta: "Explorar colchones",
  secondary: "Ayúdame a elegir",
  image: {
    src: "/images/cta-dormitorio.jpg",
    alt: "Dormitorio cálido con lámparas encendidas, plantas y cama vestida con textiles en capas",
  },
  form: {
    title: "Consulta sobre un modelo",
    intro: "Te decimos qué modelos del catálogo encajan contigo.",
    fields: {
      name: "Nombre",
      email: "Correo electrónico",
      model: "Modelo que te interesa",
      message: "¿Qué te gustaría saber?",
    },
    modelOptions: ["Un colchón", "Almohadas o bases", "Aún no lo tengo claro"],
    submit: "Preparar consulta",
    /** Mientras `servicios.formulario` esté apagado, la consulta se arma en el navegador. */
    sinEnvio: "La consulta se prepara aquí y la envías tú desde tu correo.",
  },
};

export const footer = {
  nav: [
    { label: "Tienda", href: "/tienda/" },
    { label: "Comparar", href: "/comparar/" },
    { label: "Favoritos", href: "/favoritos/" },
    { label: "Guía de elección", href: "/guia/" },
    { label: "Nosotros", href: "/nosotros/" },
    { label: "Preguntas frecuentes", href: "/faq/" },
    { label: "Contacto", href: "/contacto/" },
  ],
  copyright: `© ${new Date().getFullYear()} Almara.`,
};
