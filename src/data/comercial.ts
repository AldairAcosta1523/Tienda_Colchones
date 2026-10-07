/**
 * Configuración comercial: una sola fuente de verdad para el modo de presentación, los
 * servicios que de verdad funcionan y los datos de contacto.
 *
 * Dos cosas distintas que conviene no mezclar:
 *
 * - `DEMO`: cómo se presenta el sitio. Con `true` aparece una única franja global y las
 *   acciones de compra se nombran como simulación («Simular pedido»). Con `false` la franja
 *   desaparece, pero eso no habilita nada por sí solo.
 * - `servicios`: qué hay conectado de verdad. Pagos, pedidos y formulario siguen apagados hasta
 *   que exista pasarela, backend y envío de correo. Apagar `DEMO` sin encenderlos deja el
 *   checkout bloqueado con un aviso, nunca una compra aparente.
 *
 * Para pasar a producción: poner los datos reales en `contacto`, encender cada servicio cuando
 * esté integrado (ver docs/INTEGRACIONES.md) y, al final, `DEMO = false`.
 */

export const DEMO = true;

export const servicios = {
  /** Pasarela conectada. `metodos` solo lleva lo confirmado con el proveedor: se muestra tal cual. */
  pagos: { activo: false, metodos: [] as string[] },
  /** Backend que recibe el pedido, reserva stock y devuelve un número de seguimiento. */
  pedidos: { activo: false },
  /** Envío real del formulario de consulta (correo transaccional o CRM). */
  formulario: { activo: false },
  /** Identificador público de analítica (GA4). Vacío = no se carga ningún script. */
  analitica: { id: process.env.NEXT_PUBLIC_GA_ID ?? "" },
} as const;

/** Solo se puede cobrar cuando hay pasarela y backend; con uno solo no hay compra real. */
export const puedeComprar = servicios.pagos.activo && servicios.pedidos.activo;

/**
 * Datos de contacto. Los campos en `null` no existen todavía y los componentes que los usan no
 * se renderizan: así no se publica un teléfono o un RUC inventado.
 */
export const contacto = {
  /** Dominio .example (RFC 2606): reservado para documentación, nunca es un buzón real. */
  email: "hola@almara.example",
  /** Número en formato internacional sin «+» ni espacios, p. ej. "51987654321". */
  whatsapp: null as string | null,
  telefono: null as string | null,
  direccion: "Lima · Perú",
  horario: "Lunes a sábado · 10:00 a. m. – 8:00 p. m.",
  ruc: null as string | null,
  razonSocial: "Almara",
};

/** Enlace de WhatsApp con mensaje contextual, o `null` si no hay número confirmado. */
export function enlaceWhatsApp(mensaje: string): string | null {
  if (!contacto.whatsapp) return null;
  if (!/^\d{8,15}$/.test(contacto.whatsapp)) return null;
  return `https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
