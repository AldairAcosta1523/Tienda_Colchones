"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import { cargarGsap, gsapCargado, MQ, trasCarga } from "@/lib/gsap";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Lenis + GSAP ticker, solo con ratón o trackpad y sin «reducir movimiento».
 *
 * En táctil Lenis no hacía nada visible (`syncTouch: false`), pero existía igual y su ticker pedía
 * unos 125 fotogramas por segundo con la página quieta. Ahora en táctil el scroll es nativo y no se
 * descarga ni Lenis ni GSAP. En escritorio se crea igual que antes, tras `load` y un hueco libre:
 * no compite con la carga y una rueda en el primer segundo es nativa.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const primeraRuta = useRef(true);

  // Cambio de página: Next lleva la ventana arriba, pero Lenis conserva el destino de la página
  // anterior y el primer giro de rueda saltaba hacia allí. Se sincroniza al instante y se
  // recalculan los ScrollTrigger con el contenido nuevo. Si el enlace trae ancla, se va a ella.
  useEffect(() => {
    if (primeraRuta.current) {
      primeraRuta.current = false;
      return;
    }
    const hash = window.location.hash;
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
    const raf = requestAnimationFrame(() => {
      gsapCargado()?.ScrollTrigger.refresh();
      if (hash && document.querySelector(hash)) scrollToHash(hash);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  useEffect(() => {
    // Recalcula posiciones cuando cargan las fuentes y cuando termina el preloader. Si GSAP aún no
    // se cargó no hay nada que recalcular: medirá al crear sus efectos.
    const refresh = () => gsapCargado()?.ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    const onReady = () =>
      setTimeout(() => {
        refresh();
        if (location.hash && document.querySelector(location.hash)) scrollToHash(location.hash);
      }, 120);
    window.addEventListener("almara:ready", onReady, { once: true });
    return () => window.removeEventListener("almara:ready", onReady);
  }, []);

  useEffect(() => {
    if (!window.matchMedia(MQ.fino).matches) return;
    let vivo = true;
    let limpiar: (() => void) | undefined;

    const cancelar = trasCarga(async () => {
      const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([import("lenis"), cargarGsap()]);
      if (!vivo) return;
      const lenis = new Lenis({
        // 0.085 dejaba la página persiguiendo a la rueda (pastoso); 0.12 aún se notaba con retraso.
        // 0.15 conserva el deslizamiento suave pero llega antes a donde apunta la rueda.
        lerp: 0.15,
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        anchors: { offset: -64 },
        // Las zonas con scroll propio (lista del carrito, menú móvil, filtros, desplegables) se
        // mueven con la rueda como en cualquier web: antes Lenis se quedaba el gesto para la página
        // y la lista del carrito no bajaba. Se marcan a mano (`data-lenis-prevent`) o por su rol;
        // `allowNestedScroll` haría lo mismo, pero leyendo estilos en cada giro de rueda.
        prevent: (node) =>
          node.matches?.(
            '[data-lenis-prevent], [role="dialog"], [role="listbox"], [role="menu"], [data-radix-popper-content-wrapper]'
          ) ?? false,
      });
      window.__lenis = lenis;
      // Si el carrito o el menú ya estaban abiertos al llegar, la página sigue quieta.
      const html = document.documentElement;
      if (html.classList.contains("carrito-abierto") || html.classList.contains("menu-open")) lenis.stop();

      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      html.classList.add("lenis-ready");

      limpiar = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        delete window.__lenis;
        html.classList.remove("lenis-ready");
      };
    });

    return () => {
      vivo = false;
      cancelar();
      limpiar?.();
    };
  }, []);

  return <>{children}</>;
}

/** Scroll suave hacia un ancla, compatible con y sin Lenis. */
export function scrollToHash(hash: string, offset = -64) {
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  const lenis = window.__lenis;
  if (!lenis) {
    // Sin Lenis (táctil, movimiento reducido) el navegador fija el destino al empezar. Si por el
    // camino la página cambia de alto (en móvil las secciones lejanas se maquetan al pasar, ver
    // styles/rendimiento.css), al terminar se corrige, salvo que la persona ya se haya movido.
    const margen = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const falta = () => el.getBoundingClientRect().top - margen;
    if (Math.abs(falta()) <= 4) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    const gestos = ["touchstart", "wheel", "keydown"] as const;
    let tocado = false;
    let intentos = 0;
    const marcar = () => (tocado = true);
    gestos.forEach((g) => window.addEventListener(g, marcar, { passive: true, once: true }));
    const limpiar = () => gestos.forEach((g) => window.removeEventListener(g, marcar));
    const esperar = () => {
      if ("onscrollend" in window) window.addEventListener("scrollend", corregir, { once: true });
      else setTimeout(corregir, 1200);
    };
    // Al maquetarse una sección lejana, Chrome corta el scroll suave (y a veces emite un scrollend
    // sin moverse): se reintenta hasta llegar, salvo que la persona ya se haya movido.
    function corregir() {
      if (tocado || Math.abs(falta()) <= 4 || ++intentos > 6) return limpiar();
      el!.scrollIntoView({ behavior: "smooth", block: "start" });
      esperar();
    }
    esperar();
    return;
  }
  const target = () => el.getBoundingClientRect().top + window.scrollY + offset;
  // Duración proporcional a la distancia: un ancla cercana no debe tardar lo mismo que una lejana.
  const distancia = Math.abs(target() - window.scrollY);
  lenis.scrollTo(target(), {
    duration: Math.min(1.1, 0.45 + distancia / 4000),
    onComplete: () => {
      // Si un refresh de ScrollTrigger movió el layout durante el scroll, corrige el destino.
      const delta = target() - window.scrollY;
      if (Math.abs(delta) > 4) lenis.scrollTo(target(), { duration: 0.6 });
    },
  });
}
