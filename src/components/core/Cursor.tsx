"use client";

import { useEffect, useRef } from "react";
import { cargarGsap, MQ, trasCarga } from "@/lib/gsap";

/**
 * Cursor contextual.
 *
 * No sustituye al cursor del sistema: es un anillo que lo acompaña y solo cambia de estado
 * sobre elementos que lo justifican. Con `data-cursor-label` se convierte en una pastilla
 * con una acción real ("Explorar"), que es donde aporta información.
 *
 * Se desactiva por completo en punteros gruesos y con `prefers-reduced-motion`: ahí ni siquiera se
 * descarga GSAP. Con ratón se monta tras la carga, como el scroll suave.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(MQ.fino).matches) return;
    let vivo = true;
    let limpiar: (() => void) | undefined;

    const cancelar = trasCarga(async () => {
      const { gsap } = await cargarGsap();
      if (!vivo) return;
      const label = el.querySelector<HTMLElement>(".cursor__label");
      const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
      let shown = false;

      const move = (e: MouseEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
        if (!shown) {
          shown = true;
          gsap.to(el, { opacity: 1, duration: 0.4 });
        }
      };

      const over = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        const labelled = target?.closest<HTMLElement>("[data-cursor-label]");
        if (labelled) {
          const text = labelled.dataset.cursorLabel ?? "";
          if (label && label.textContent !== text) label.textContent = text;
          el.dataset.state = "label";
          return;
        }
        // Los campos de formulario conservan el cursor de texto sin anillo.
        if (target?.closest("input, textarea, select")) {
          el.dataset.state = "hidden";
          return;
        }
        el.dataset.state = target?.closest("a, button, [data-cursor]") ? "link" : "";
      };

      const leaveWindow = () => gsap.to(el, { opacity: 0, duration: 0.3 });
      const enterWindow = () => shown && gsap.to(el, { opacity: 1, duration: 0.3 });

      window.addEventListener("mousemove", move, { passive: true });
      window.addEventListener("mouseover", over, { passive: true });
      document.documentElement.addEventListener("mouseleave", leaveWindow);
      document.documentElement.addEventListener("mouseenter", enterWindow);
      limpiar = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseover", over);
        document.documentElement.removeEventListener("mouseleave", leaveWindow);
        document.documentElement.removeEventListener("mouseenter", enterWindow);
        gsap.killTweensOf(el);
      };
    });

    return () => {
      vivo = false;
      cancelar();
      limpiar?.();
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <span className="cursor__label" />
    </div>
  );
}
