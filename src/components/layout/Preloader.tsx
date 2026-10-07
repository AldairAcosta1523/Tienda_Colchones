"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cortina de entrada (≈1,2 s): el nombre Almara sube bajo máscara, una línea lo subraya y la
 * cortina se retira hacia arriba descubriendo el hero.
 *
 * La animación es CSS (styles/intro.css) y arranca con el primer pintado; aquí solo se coordina:
 * se emite `almara:ready` cuando la cortina empieza a subir (lo escuchan la cabecera y el scroll
 * a anclas) y se retira el nodo al terminar.
 *
 * Solo aparece la primera vez por sesión: lo decide el script de arranque del layout poniendo
 * `html.intro`. Repetirla en cada visita se percibe como lentitud. Con «reducir movimiento» no
 * existe y el evento se emite de inmediato.
 */
const INICIO_CORTINA_MS = 580;
/** Lo que tarda la secuencia completa del hero tras la cortina (ver BEAT en Hero.tsx). */
const FIN_INTRO_MS = 3200;

export default function Preloader() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const ready = () => {
      html.classList.add("is-ready");
      window.dispatchEvent(new Event("almara:ready"));
      window.__lenis?.start();
    };

    const el = ref.current;
    if (!el || !html.classList.contains("intro")) {
      ready();
      setDone(true);
      return;
    }

    window.__lenis?.stop();
    window.scrollTo(0, 0);

    // La animación ya lleva un rato corriendo (empezó al pintar): se calcula cuánto falta.
    const cortina = el.getAnimations().find((a) => (a as CSSAnimation).animationName === "intro-cortina");
    const transcurrido = Number(cortina?.currentTime ?? INICIO_CORTINA_MS);
    const tReady = window.setTimeout(ready, Math.max(0, INICIO_CORTINA_MS - transcurrido));

    let vivo = true;
    (cortina?.finished ?? Promise.resolve()).then(() => vivo && setDone(true)).catch(() => {});

    // Terminada la secuencia del hero, fuera el desfase: si más tarde se vuelve a la portada
    // navegando, el hero entra sin esperar a una cortina que ya no está.
    const tFin = window.setTimeout(() => html.classList.remove("intro"), Math.max(0, FIN_INTRO_MS - transcurrido));

    return () => {
      vivo = false;
      window.clearTimeout(tReady);
      window.clearTimeout(tFin);
    };
  }, []);

  return (
    <div ref={ref} className={`preloader${done ? " is-done" : ""}`} aria-hidden="true">
      <div className="preloader__inner">
        <div className="preloader__clip">
          <span className="preloader__mark">Almara</span>
        </div>
        <span className="preloader__rule" />
        <span className="preloader__sub label">El arte de descansar</span>
      </div>
    </div>
  );
}
