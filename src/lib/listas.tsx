"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { productoPorSlug, type Producto } from "@/data/catalog";

/**
 * Favoritos y comparador: dos listas de slugs guardadas en el navegador.
 *
 * Mismo criterio que el carrito: se guarda lo mínimo (el slug), se resuelve contra el catálogo en
 * cada render y lo que ya no exista se descarta al restaurar. El primer render coincide con el
 * del servidor (listas vacías) y la restauración ocurre en un efecto: sin desajustes de
 * hidratación. Alcance: solo este navegador; no hay cuenta de usuario.
 */

export const MAX_COMPARAR = 4;
export const MIN_COMPARAR = 2;

type Lista = {
  slugs: string[];
  productos: Producto[];
  tiene: (slug: string) => boolean;
  alternar: (slug: string) => void;
  quitar: (slug: string) => void;
  vaciar: () => void;
  listo: boolean;
};

function usarListaGuardada(clave: string, max?: number, filtro?: (p: Producto) => boolean): Lista {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(clave);
      const datos: unknown = crudo ? JSON.parse(crudo) : [];
      const validos = Array.isArray(datos)
        ? datos.filter((s): s is string => {
            if (typeof s !== "string") return false;
            const p = productoPorSlug(s);
            return !!p && (!filtro || filtro(p));
          })
        : [];
      // Sin nada guardado no se toca el estado: un `[]` nuevo volvería a pintar cada corazón.
      if (validos.length) setSlugs(max ? validos.slice(0, max) : validos);
    } catch {
      /* almacenamiento bloqueado o corrupto: la lista empieza vacía */
    }
    setListo(true);
  }, [clave, max, filtro]);

  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(clave, JSON.stringify(slugs));
    } catch {
      /* almacenamiento bloqueado: la lista vive en memoria */
    }
  }, [clave, slugs, listo]);

  const tiene = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const quitar = useCallback((slug: string) => setSlugs((l) => l.filter((s) => s !== slug)), []);
  const alternar = useCallback(
    (slug: string) =>
      setSlugs((l) => {
        if (l.includes(slug)) return l.filter((s) => s !== slug);
        const p = productoPorSlug(slug);
        if (!p || (filtro && !filtro(p))) return l;
        if (max && l.length >= max) return l;
        return [...l, slug];
      }),
    [max, filtro]
  );
  const vaciar = useCallback(() => setSlugs([]), []);
  const productos = useMemo(() => slugs.map(productoPorSlug).filter(Boolean) as Producto[], [slugs]);

  return useMemo(
    () => ({ slugs, productos, tiene, alternar, quitar, vaciar, listo }),
    [slugs, productos, tiene, alternar, quitar, vaciar, listo]
  );
}

const esColchon = (p: Producto) => p.categoria === "colchones";

const Ctx = createContext<{ favoritos: Lista; comparar: Lista } | null>(null);

/** Lo que necesitan los botones de cada tarjeta: sin `listo` ni `productos`. */
type Seleccion = Pick<Lista, "slugs" | "tiene" | "alternar">;
/**
 * Contexto aparte para los botones de favorito y comparar. Al restaurar las listas tras hidratar
 * cambia `listo`; si los botones leyeran el contexto completo, todas las tarjetas volverían a
 * pintarlos aunque no hubiera nada guardado.
 */
const SeleccionCtx = createContext<{ favoritos: Seleccion; comparar: Seleccion } | null>(null);

export function ListasProvider({ children }: { children: ReactNode }) {
  const favoritos = usarListaGuardada("almara:favoritos");
  const comparar = usarListaGuardada("almara:comparar", MAX_COMPARAR, esColchon);
  const valor = useMemo(() => ({ favoritos, comparar }), [favoritos, comparar]);
  const { slugs: sf, tiene: tf, alternar: af } = favoritos;
  const { slugs: sc, tiene: tc, alternar: ac } = comparar;
  const seleccion = useMemo(
    () => ({ favoritos: { slugs: sf, tiene: tf, alternar: af }, comparar: { slugs: sc, tiene: tc, alternar: ac } }),
    [sf, tf, af, sc, tc, ac]
  );
  return (
    <SeleccionCtx.Provider value={seleccion}>
      <Ctx.Provider value={valor}>{children}</Ctx.Provider>
    </SeleccionCtx.Provider>
  );
}

export function useFavoritos() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFavoritos fuera de ListasProvider");
  return ctx.favoritos;
}

export function useComparar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useComparar fuera de ListasProvider");
  return ctx.comparar;
}

/** Selección de favoritos para los botones de las tarjetas (no cambia al restaurar si no hay nada). */
export function useSeleccionFavoritos() {
  const ctx = useContext(SeleccionCtx);
  if (!ctx) throw new Error("useSeleccionFavoritos fuera de ListasProvider");
  return ctx.favoritos;
}

/** Selección del comparador para los botones de las tarjetas. */
export function useSeleccionComparar() {
  const ctx = useContext(SeleccionCtx);
  if (!ctx) throw new Error("useSeleccionComparar fuera de ListasProvider");
  return ctx.comparar;
}
