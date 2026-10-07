/**
 * Entradas al hacer scroll: un solo revelador para toda la web.
 *
 * Reveal, SplitLines, MediaReveal y Rule ya no animan nada: pintan `data-revela="<línea>"` y sus
 * variables (--d, --st, --y, --i). El estado inicial y la animación son CSS (styles/revela.css),
 * con las curvas y tiempos de `motion.ts`. Aquí solo se decide cuándo: un IntersectionObserver
 * por línea de disparo pone `data-visto` cuando el elemento la cruza.
 *
 * Antes cada componente tenía su useGSAP: unos cuarenta en la portada, cada uno midiendo y fijando
 * estilos al hidratar. En un móvil eso era más de medio segundo de hilo principal y obligaba a
 * descargar GSAP al arrancar.
 */

/** "top 90%" (sintaxis de ScrollTrigger que ya usaban las secciones) → "90". */
export const lineaDe = (start: string) => /top\s+(\d+(?:\.\d+)?)%/.exec(start)?.[1] ?? "90";

/**
 * Se ejecuta como script en línea del <head> (el layout lo serializa con `toString`), antes del
 * primer pintado y sin esperar a React: lo que ya se ve al cargar entra en cuanto el documento
 * está leído, no al terminar la hidratación. Por eso no puede usar nada de fuera de su cuerpo.
 *
 * `html.revela` activa los estados iniciales del CSS: sin JavaScript, sin IntersectionObserver o
 * con «reducir movimiento» no se pone y todo queda visible.
 */
export function revelador() {
  const d = document.documentElement;
  try {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const SEL = "[data-revela]:not([data-visto])";
    const observadores: Record<string, IntersectionObserver> = {};

    const observar = (el: Element) => {
      const linea = el.getAttribute("data-revela") || "90";
      let io = observadores[linea];
      if (!io) {
        io = observadores[linea] = new IntersectionObserver(
          (entradas) => {
            for (const e of entradas) {
              const r = e.boundingClientRect;
              // También cuenta lo que ya quedó por encima de la línea (recarga a media página, salto
              // a un ancla) o al lado (un riel horizontal). Un rectángulo vacío es algo aún sin
              // maquetar (content-visibility): se espera a que tenga caja.
              const pasado = r.width + r.height > 0 && !!e.rootBounds && r.top < e.rootBounds.bottom;
              if (!e.isIntersecting && !pasado) continue;
              io.unobserve(e.target);
              e.target.setAttribute("data-visto", "");
            }
          },
          { rootMargin: `0px 0px -${Math.max(0, 100 - Number(linea))}% 0px` }
        );
      }
      io.observe(el);
    };
    const buscar = (raiz: ParentNode) => raiz.querySelectorAll(SEL).forEach(observar);

    const iniciar = () => {
      try {
        buscar(document);
        // Lo que llega después (navegación entre páginas, el catálogo que sustituye al provisional)
        // se observa al insertarse; lo que se retira sin haberse visto deja de observarse.
        new MutationObserver((cambios) => {
          for (const c of cambios) {
            c.addedNodes.forEach((n) => {
              if (n.nodeType !== 1) return;
              if ((n as Element).matches(SEL)) observar(n as Element);
              buscar(n as Element);
            });
            c.removedNodes.forEach((n) => {
              if (n.nodeType !== 1) return;
              const fuera = Array.from((n as Element).querySelectorAll(SEL));
              fuera.push(n as Element);
              for (const io of Object.values(observadores)) fuera.forEach((el) => io.unobserve(el));
            });
          }
        }).observe(document.body, { childList: true, subtree: true });
      } catch {
        d.classList.remove("revela");
      }
    };

    d.classList.add("revela");
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    else iniciar();
  } catch {
    d.classList.remove("revela");
  }
}
