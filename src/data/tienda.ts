/**
 * Contenido de tienda: políticas, textos de compra y páginas informativas.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * DATOS DE DEMOSTRACIÓN. No hay empresa detrás de Almara, así que plazos,
 * coberturas y garantías son ejemplos redactados para mostrar la estructura.
 * No son compromisos y no deben usarse tal cual en una tienda real.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { envio } from "./catalog";
import { contacto, servicios } from "./comercial";

export type Politica = {
  slug: string;
  titulo: string;
  /** Una línea para la ficha de producto. */
  resumen: string;
  intro: string;
  bloques: { titulo: string; texto: string }[];
};

export const politicas: Record<"envio" | "devoluciones" | "garantia" | "privacidad", Politica> = {
  envio: {
    slug: "envio",
    titulo: "Envíos y entrega",
    resumen: `Envío gratis desde ${envio.gratisDesde} soles en ${envio.zona}`,
    intro: `Trabajamos con entrega a domicilio en ${envio.zona}. El plazo habitual es de ${envio.plazo} desde la confirmación del pedido.`,
    bloques: [
      {
        titulo: "Coste",
        texto: `El envío cuesta S/ ${envio.costo} y es gratuito a partir de S/ ${envio.gratisDesde} de compra. El importe se calcula en el carrito antes de pagar, nunca después.`,
      },
      {
        titulo: "Plazo",
        texto: `Entre ${envio.plazo}. Los colchones se entregan enrollados y comprimidos; conviene desembalarlos el mismo día y dejarlos recuperar su forma unas horas antes de dormir sobre ellos.`,
      },
      {
        titulo: "Cobertura",
        texto: `Por ahora solo ${envio.zona}. Fuera de esa zona el pedido no se puede completar desde la web.`,
      },
      {
        titulo: "Qué falta para que esto sea real",
        texto: "No hay transportista contratado ni tarifas negociadas. Las cifras de arriba son un ejemplo de cómo se presentarían las condiciones reales.",
      },
    ],
  },
  devoluciones: {
    slug: "devoluciones",
    titulo: "Cambios y devoluciones",
    resumen: "30 noches para decidir si es tu colchón",
    intro:
      "Un colchón no se juzga en una tienda: se juzga durmiendo. Por eso el plazo de prueba se cuenta en noches, no en días desde la compra.",
    bloques: [
      {
        titulo: "Plazo de prueba",
        texto: "30 noches desde la entrega para los colchones. Si no encaja, se recoge en el domicilio y se devuelve el importe íntegro.",
      },
      {
        titulo: "Accesorios",
        texto: "Almohadas, protectores y ropa de cama admiten devolución dentro de los 14 días si no se han usado y conservan su embalaje.",
      },
      {
        titulo: "Cómo se solicita",
        texto: "Escribiendo al correo de contacto con el número de pedido. La recogida se coordina en las 48 horas siguientes.",
      },
      {
        titulo: "Qué falta para que esto sea real",
        texto: "No existe un sistema de pedidos ni logística inversa. El plazo de 30 noches es un ejemplo del tipo de compromiso que una tienda de descanso suele ofrecer.",
      },
    ],
  },
  garantia: {
    slug: "garantia",
    titulo: "Garantía",
    resumen: "10 años de garantía sobre el núcleo",
    intro:
      "La garantía cubre defectos de fabricación y la pérdida de altura del núcleo por encima de lo razonable para un uso normal.",
    bloques: [
      {
        titulo: "Qué cubre",
        texto: "Defectos de fabricación, costuras abiertas y hundimientos del núcleo superiores a 2 cm sin causa externa, durante 10 años desde la entrega.",
      },
      {
        titulo: "Qué no cubre",
        texto: "El desgaste normal del tejido, manchas, humedades, daños por usar una base inadecuada o por doblar el colchón.",
      },
      {
        titulo: "Condición",
        texto: "Que el colchón se haya usado sobre una base firme y nivelada. Una base en mal estado deforma cualquier colchón.",
      },
      {
        titulo: "Qué falta para que esto sea real",
        texto: "Una garantía es un contrato: requiere una empresa, un registro de pedidos y un proceso de peritaje. Nada de eso existe aquí.",
      },
    ],
  },
  privacidad: {
    slug: "privacidad",
    titulo: "Privacidad",
    resumen: "No recogemos datos: no hay servidor detrás",
    intro: servicios.analitica.id
      ? "Usamos una herramienta de medición de audiencia con IP anonimizada. No hay formularios que envíen información personal a ningún sitio."
      : "No hay analítica, ni cookies de seguimiento, ni formularios que envíen información a ningún sitio.",
    bloques: [
      {
        titulo: "Qué se guarda",
        texto: "Solo el contenido del carrito, y se guarda en tu propio navegador (localStorage). No sale de tu equipo y puedes borrarlo vaciando el carrito o los datos del sitio.",
      },
      {
        titulo: "Qué no se envía",
        texto: "Nada. Los datos que escribas en el checkout se quedan en la página: no hay servidor que los reciba ni pasarela de pago conectada.",
      },
      {
        titulo: "Terceros",
        texto: servicios.analitica.id
          ? "Las tipografías se sirven desde el propio dominio. El único script de terceros es la medición de audiencia (Google Analytics 4)."
          : "Las tipografías se sirven desde el propio dominio. No hay píxeles de publicidad ni scripts de terceros.",
      },
    ],
  },
};

export const listaPoliticas = Object.values(politicas);

/** Textos del proceso de compra. */
export const checkout = {
  titulo: "Finalizar compra",
  intro: "Revisa el pedido y completa tus datos de entrega.",
  pasos: ["Contacto", "Entrega", "Pago"],
  /** Las integraciones pendientes se documentan en docs/INTEGRACIONES.md, no en la pantalla. */
};

/** Página de contacto. */
export const contactoPagina = {
  titulo: ["Hablemos", "de tu descanso."],
  intro:
    "¿Dudas entre dos firmezas o no sabes qué medida necesitas? Escríbenos antes de comprar.",
  canales: [
    { k: "Correo", v: contacto.email, href: `mailto:${contacto.email}` },
    ...(contacto.telefono ? [{ k: "Teléfono", v: contacto.telefono, href: `tel:+${contacto.telefono}` }] : []),
    { k: "Horario", v: contacto.horario },
    { k: "Zona de entrega", v: envio.zona },
  ] as { k: string; v: string; href?: string }[],
};
