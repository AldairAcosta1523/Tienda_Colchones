import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerT } from "gsap/ScrollTrigger";

/**
 * GSAP y ScrollTrigger fuera del arranque.
 *
 * Eran 47 KB comprimidos en la primera oleada de descarga y un ticker de rAF que no se detenía ni
 * en reposo. Las entradas ya son CSS (lib/revela.ts); GSAP solo hace falta para lo que va ligado
 * al scroll (parallax, velo de la guía, entrada del Comfort Lab), el cursor y Lenis. Se importa
 * cuando alguno de ellos lo pide, una sola vez.
 */

declare global {
  interface Window {
    /** Acceso para QA/depuración (scripts/*.mjs). Solo existe cuando GSAP ya se cargó. */
    __ST?: typeof ScrollTriggerT;
  }
}

export type GsapCargado = { gsap: typeof Gsap; ScrollTrigger: typeof ScrollTriggerT };

let promesa: Promise<GsapCargado> | null = null;
let cargado: GsapCargado | null = null;

export function cargarGsap(): Promise<GsapCargado> {
  promesa ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, st]) => {
    const { gsap } = g;
    const { ScrollTrigger } = st;
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "expo.out", duration: 1 });
    ScrollTrigger.config({ ignoreMobileResize: true });
    window.__ST = ScrollTrigger;
    // En móvil las secciones lejanas van con content-visibility (styles/rendimiento.css): se maquetan
    // al acercarse y la página cambia de alto. Los disparadores se recalculan cuando eso pasa, con
    // una pausa para no hacerlo en cada sección que entra.
    let alto = document.documentElement.scrollHeight;
    let t = 0;
    new ResizeObserver(() => {
      const nuevo = document.documentElement.scrollHeight;
      if (nuevo === alto) return;
      alto = nuevo;
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    }).observe(document.body);
    cargado = { gsap, ScrollTrigger };
    return cargado;
  });
  return promesa;
}

/** GSAP si ya está cargado; si no, null (para refrescos que solo tienen sentido si existe). */
export const gsapCargado = () => cargado;

/**
 * Monta efectos de GSAP cuando `el` se acerca a la pantalla (por defecto a 1000 px), dentro de un
 * gsap.context para deshacerlos al desmontar. El margen da tiempo a descargar y medir antes de que
 * el efecto se vea. Devuelve la limpieza.
 */
export function alAcercarse(el: Element, montar: (g: GsapCargado) => void, margen = "1000px 0px") {
  let vivo = true;
  let ctx: ReturnType<typeof Gsap.context> | undefined;
  const io = new IntersectionObserver(
    (entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cargarGsap().then((g) => {
        if (vivo) ctx = g.gsap.context(() => montar(g));
      });
    },
    { rootMargin: margen }
  );
  io.observe(el);
  return () => {
    vivo = false;
    io.disconnect();
    ctx?.revert();
  };
}

/** Ejecuta `fn` tras el evento `load` y un hueco libre del hilo principal. */
export function trasCarga(fn: () => void) {
  let cancelado = false;
  const ejecutar = () => !cancelado && fn();
  const lanzar = () => {
    if ("requestIdleCallback" in window) requestIdleCallback(ejecutar, { timeout: 2000 });
    else setTimeout(ejecutar, 200);
  };
  if (document.readyState === "complete") lanzar();
  else window.addEventListener("load", lanzar, { once: true });
  return () => {
    cancelado = true;
    window.removeEventListener("load", lanzar);
  };
}

/** Breakpoints compartidos por los efectos y el CSS */
export const MQ = {
  desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  /** Efectos ligados al scroll que solo tienen sentido con ancho suficiente */
  wide: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  /** Scroll suave y cursor: ratón o trackpad, sin «reducir movimiento». */
  fino: "(pointer: fine) and (prefers-reduced-motion: no-preference)",
};
