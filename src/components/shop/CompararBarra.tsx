"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { MAX_COMPARAR, MIN_COMPARAR, useComparar } from "@/lib/listas";
import { QUALITY } from "@/lib/imagen";
import { ButtonLabel } from "@/components/core/CtaButton";

/**
 * Barra flotante con la selección del comparador. Aparece en cuanto hay un modelo elegido y se
 * oculta en la propia página de comparación. Es la pista de que «Comparar» está haciendo algo.
 */
export default function CompararBarra() {
  const { productos, quitar, listo } = useComparar();
  const pathname = usePathname();
  const barra = useRef<HTMLElement>(null);
  const visible = listo && productos.length > 0 && !pathname.startsWith("/comparar");

  // Chrome no desplaza un elemento enfocado que ya está en la ventana, aunque lo tape la barra:
  // si el foco cae debajo, se sube lo justo.
  useEffect(() => {
    if (!visible) return;
    const alEnfocar = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      const b = barra.current;
      if (!el || !b || b.contains(el)) return;
      const r = el.getBoundingClientRect();
      const tope = b.getBoundingClientRect().top - 12;
      if (r.bottom > tope && r.top < window.innerHeight) {
        const delta = r.bottom - tope;
        if (window.__lenis) window.__lenis.scrollTo(window.scrollY + delta, { immediate: true });
        else window.scrollBy(0, delta);
      }
    };
    document.addEventListener("focusin", alEnfocar);
    return () => document.removeEventListener("focusin", alEnfocar);
  }, [visible]);

  if (!visible) return null;
  const faltan = Math.max(0, MIN_COMPARAR - productos.length);

  return (
    <aside ref={barra} className="cmp-barra" aria-label="Modelos seleccionados para comparar">
      <ul className="cmp-barra__lista">
        {productos.map((p) => (
          <li key={p.slug} className="cmp-barra__item">
            <span className="cmp-barra__foto">
              <Image src={p.imagen.src} alt="" fill sizes="40px" quality={QUALITY} />
            </span>
            <span className="cmp-barra__nombre">{p.nombre}</span>
            <button type="button" className="cmp-barra__quitar" onClick={() => quitar(p.slug)} aria-label={`Quitar ${p.nombre}`}>
              <X size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="cmp-barra__acciones">
        <span className="cmp-barra__cuenta">
          {productos.length}/{MAX_COMPARAR}
        </span>
        {faltan > 0 ? (
          <span className="cmp-barra__nota">Elige {faltan} más para comparar</span>
        ) : (
          <Link href="/comparar/" className="btn btn--primary cmp-barra__ir">
            <ButtonLabel>Comparar</ButtonLabel>
          </Link>
        )}
      </div>
    </aside>
  );
}
