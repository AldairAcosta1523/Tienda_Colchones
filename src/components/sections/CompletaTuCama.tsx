"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { productos } from "@/data/catalog";
import ProductCard from "@/components/shop/ProductCard";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import { Arrow } from "@/components/core/CtaButton";

/**
 * Los complementos, en formato comprable.
 *
 * Un riel horizontal con scroll nativo y ajuste a tarjeta: en táctil se arrastra con el dedo, con
 * teclado se recorre tabulando (el navegador lleva la tarjeta enfocada a la vista) y en escritorio
 * hay dos flechas que avanzan una tarjeta. No hay autoplay ni bucle: el usuario manda.
 * No se habla de «más vendidos» porque no hay ventas de las que hablar.
 */
export default function CompletaTuCama() {
  const seleccion = productos.filter((p) => p.categoria !== "colchones");
  const riel = useRef<HTMLUListElement>(null);
  const [estado, setEstado] = useState({ inicio: true, fin: false, avance: 0.3 });

  const medir = useCallback(() => {
    const el = riel.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const visto = el.clientWidth / el.scrollWidth;
    const p = max > 0 ? el.scrollLeft / max : 0;
    setEstado({
      inicio: el.scrollLeft <= 2,
      fin: el.scrollLeft >= max - 2,
      // La barra representa lo ya recorrido más lo que cabe en pantalla.
      avance: Math.min(1, visto + (1 - visto) * p),
    });
  }, []);

  useEffect(() => {
    const el = riel.current;
    if (!el) return;
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  const mover = (dir: 1 | -1) => {
    const el = riel.current;
    const tarjeta = el?.querySelector("li");
    if (!el || !tarjeta) return;
    const paso = tarjeta.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || "0");
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: paso * dir, behavior: suave ? "smooth" : "auto" });
  };

  return (
    <section className="completa" id="complementos" data-nav-theme="light" aria-labelledby="completa-titulo">
      <div className="container completa__head">
        <div className="completa__titulo">
          <Reveal y={10}>
            <Eyebrow index="05">Complementos</Eyebrow>
          </Reveal>
          <SplitLines as="h2" id="completa-titulo" className="h2" lines={["Completa", "tu cama."]} />
        </div>
        <Reveal delay={0.12} y={0} className="completa__intro">
          <p>
            Almohada a la altura correcta y base firme. Elige la medida y añádelo desde aquí.
          </p>
          <Link href="/tienda/" className="arrow-link">
            Ver la tienda completa
            <Arrow />
          </Link>
        </Reveal>
        <div className="completa__controles" role="group" aria-label="Desplazar los complementos">
          <button
            type="button"
            className="completa__flecha completa__flecha--prev"
            onClick={() => mover(-1)}
            disabled={estado.inicio}
            aria-label="Anteriores"
          >
            <Arrow />
          </button>
          <button
            type="button"
            className="completa__flecha"
            onClick={() => mover(1)}
            disabled={estado.fin}
            aria-label="Siguientes"
          >
            <Arrow />
          </button>
        </div>
      </div>

      <Reveal y={24}>
        <ul ref={riel} className="completa__riel" aria-label="Complementos">
          {seleccion.map((p) => (
            <li key={p.slug}>
              <ProductCard producto={p} />
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="container">
        <div className="completa__avance" aria-hidden="true">
          <span style={{ ["--avance" as string]: estado.avance }} />
        </div>
      </div>
    </section>
  );
}
