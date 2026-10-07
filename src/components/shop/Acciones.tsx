"use client";

import { Check, Heart, Scale } from "lucide-react";
import { MAX_COMPARAR, useSeleccionComparar, useSeleccionFavoritos } from "@/lib/listas";
import type { Producto } from "@/data/catalog";

/**
 * Botón de favorito: corazón que se rellena. Disponible para cualquier producto.
 *
 * El nombre accesible empieza por el texto visible (WCAG 2.5.3): quien usa control por voz dice
 * «Guardar» y lo encuentra. El estado lo comunica `aria-pressed`.
 */
export function FavoritoBtn({ producto, className = "", conTexto = false }: { producto: Producto; className?: string; conTexto?: boolean }) {
  const fav = useSeleccionFavoritos();
  const activo = fav.tiene(producto.slug);
  return (
    <button
      type="button"
      className={`fav-btn${activo ? " is-activo" : ""}${conTexto ? " fav-btn--texto" : ""} ${className}`}
      aria-pressed={activo}
      aria-label={conTexto ? undefined : `Guardar ${producto.nombre} en favoritos`}
      onClick={() => fav.alternar(producto.slug)}
    >
      <Heart size={16} strokeWidth={1.7} aria-hidden="true" />
      {conTexto && (
        <span>
          {activo ? "Guardado" : "Guardar"}
          <span className="sr-only"> {producto.nombre} en favoritos</span>
        </span>
      )}
    </button>
  );
}

/**
 * Comparar: solo colchones. Al llegar al máximo, el botón de los no seleccionados se deshabilita
 * con la razón en el `title`; nunca sustituye un modelo en silencio.
 */
export function CompararBtn({ producto, className = "", conTexto = true }: { producto: Producto; className?: string; conTexto?: boolean }) {
  const cmp = useSeleccionComparar();
  if (producto.categoria !== "colchones") return null;
  const activo = cmp.tiene(producto.slug);
  const lleno = !activo && cmp.slugs.length >= MAX_COMPARAR;
  return (
    <button
      type="button"
      className={`cmp-btn${activo ? " is-activo" : ""} ${className}`}
      aria-pressed={activo}
      // aria-disabled y no `disabled`: el botón sigue en el orden de tabulación y el lector
      // de pantalla puede leer el motivo.
      aria-disabled={lleno || undefined}
      title={lleno ? `Ya hay ${MAX_COMPARAR} modelos en el comparador` : undefined}
      aria-label={conTexto ? undefined : `Comparar ${producto.nombre}`}
      onClick={() => {
        if (!lleno) cmp.alternar(producto.slug);
      }}
    >
      {activo ? <Check size={15} strokeWidth={2} aria-hidden="true" /> : <Scale size={15} strokeWidth={1.7} aria-hidden="true" />}
      {conTexto && (
        <span>
          {activo ? "Comparando" : "Comparar"}
          <span className="sr-only">
            {" "}
            {producto.nombre}
            {lleno ? `. Ya hay ${MAX_COMPARAR} modelos en el comparador` : ""}
          </span>
        </span>
      )}
    </button>
  );
}
