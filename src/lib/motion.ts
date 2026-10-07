/**
 * Sistema de movimiento de Almara.
 *
 * Una sola fuente para duraciones, easings y distancias: las secciones no improvisan valores.
 * La regla es que el movimiento acompañe la dirección de arte —calma, peso, nada de rebotes—.
 */

/** Easings. Cada familia tiene un propósito distinto; no se usa el mismo para todo. */
export const EASE = {
  /** Entradas de contenido: salida rápida y frenado largo. */
  reveal: "expo.out",
  /** Aperturas de máscara (clip-path): arranca y termina suave. */
  mask: "power3.inOut",
  /** Asentado de fotografía tras el zoom-out. */
  settle: "power2.out",
  /** Microinteracciones de interfaz. */
  ui: "power2.out",
  /** Movimiento ligado al scroll. */
  scrub: "none",
} as const;

/** Duraciones en segundos. */
export const DUR = {
  ui: 0.3,
  button: 0.42,
  /** Revelado de texto y bloques de contenido. Más corto que antes (0,8): al cambiar de página
   *  el contenido tardaba en asentarse y la navegación se sentía lenta. */
  content: 0.6,
  /** Apertura de máscara fotográfica. */
  mask: 0.85,
  /** Asentado de la fotografía (más largo que la máscara: la imagen sigue moviéndose). */
  settle: 1.15,
  /** Línea divisoria que se expande. */
  rule: 0.7,
} as const;

/** Desplazamientos y escalas base. */
export const MOVE = {
  /** translateY de una entrada de contenido. */
  y: 12,
  /** Escala inicial de una fotografía que se asienta (1,1 se notaba como un zoom, no un asentado). */
  zoom: 1.05,
  /** Recorrido del parallax dentro del marco, en % de la altura del contenedor. */
  parallax: 4,
  /**
   * Factor sobre los valores que cada sección pasa a mano (`y={18}`, `parallax={6}`…): así se
   * suavizan todas las entradas y el parallax por igual sin tocar sección a sección y sin perder
   * las diferencias de ritmo entre ellas.
   */
  suavidad: 0.6,
} as const;

/** Punto de disparo estándar: el bloque empieza en cuanto asoma, sin esperar a que el lector llegue. */
export const START = "top 90%";

/** Máscaras clip-path reutilizables (revelado vertical de abajo hacia arriba). */
export const CLIP = {
  closed: "inset(0% 0% 100% 0%)",
  open: "inset(0% 0% 0% 0%)",
} as const;

/** Stagger estándar entre hermanos de una misma lista. */
export const STAGGER = 0.06;
