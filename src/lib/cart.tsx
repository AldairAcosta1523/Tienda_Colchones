"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode, type RefObject } from "react";
import { costoEnvio, productoPorSlug, type Producto, type Variante } from "@/data/catalog";

/**
 * Estado del carrito.
 *
 * Guarda lo mínimo —slug, variante y cantidad— y resuelve el resto contra el catálogo en cada
 * render. Así un cambio de precio o de stock se refleja solo, y lo guardado no se queda obsoleto.
 *
 * Persiste en `localStorage`, pero el primer render del cliente es igual que el del servidor
 * (carrito vacío) y la restauración ocurre en un efecto: sin desajustes de hidratación.
 */

export type LineaGuardada = { slug: string; varianteId: string; cantidad: number };

export type Linea = LineaGuardada & {
  producto: Producto;
  variante: Variante;
  /** precio × cantidad */
  importe: number;
  /** La cantidad está por encima del stock disponible. */
  excedeStock: boolean;
};

type Accion =
  | { tipo: "restaurar"; lineas: LineaGuardada[] }
  | { tipo: "añadir"; slug: string; varianteId: string; cantidad: number }
  | { tipo: "cantidad"; slug: string; varianteId: string; cantidad: number }
  | { tipo: "quitar"; slug: string; varianteId: string }
  | { tipo: "vaciar" };

const CLAVE = "almara:carrito";
const MAX_POR_LINEA = 10;

function reducer(estado: LineaGuardada[], accion: Accion): LineaGuardada[] {
  switch (accion.tipo) {
    case "restaurar":
      return accion.lineas;
    case "añadir": {
      const i = estado.findIndex((l) => l.slug === accion.slug && l.varianteId === accion.varianteId);
      if (i === -1) return [...estado, { slug: accion.slug, varianteId: accion.varianteId, cantidad: accion.cantidad }];
      const copia = [...estado];
      copia[i] = { ...copia[i], cantidad: Math.min(MAX_POR_LINEA, copia[i].cantidad + accion.cantidad) };
      return copia;
    }
    case "cantidad": {
      if (accion.cantidad <= 0) {
        return estado.filter((l) => !(l.slug === accion.slug && l.varianteId === accion.varianteId));
      }
      return estado.map((l) =>
        l.slug === accion.slug && l.varianteId === accion.varianteId
          ? { ...l, cantidad: Math.min(MAX_POR_LINEA, accion.cantidad) }
          : l
      );
    }
    case "quitar":
      return estado.filter((l) => !(l.slug === accion.slug && l.varianteId === accion.varianteId));
    case "vaciar":
      return [];
  }
}

type Contexto = {
  lineas: Linea[];
  unidades: number;
  subtotal: number;
  envio: number;
  total: number;
  /** El carrito ya se restauró desde el almacenamiento del navegador. */
  listo: boolean;
  /**
   * Añade una variante y abre el panel. `origen` es el control al que debe volver el foco al
   * cerrar el panel (el botón de la tarjeta; el ítem del menú desaparece al elegir).
   */
  añadir: (slug: string, varianteId: string, cantidad?: number, origen?: HTMLElement | null) => void;
  /** Elemento que recupera el foco al cerrar el panel. */
  retornoFoco: RefObject<HTMLElement | null>;
  /** Última variante añadida: el panel la anuncia al abrirse. */
  ultimo: { slug: string; varianteId: string } | null;
  cambiarCantidad: (slug: string, varianteId: string, cantidad: number) => void;
  quitar: (slug: string, varianteId: string) => void;
  vaciar: () => void;
  /** Panel lateral (el Sheet de shadcn: `abrirCerrar` es su `onOpenChange`). */
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  abrirCerrar: (v: boolean) => void;
};

/** Lo que no cambia nunca: funciones estables y la referencia del foco. */
type Acciones = Pick<Contexto, "añadir" | "retornoFoco" | "cambiarCantidad" | "quitar" | "vaciar" | "abrir" | "cerrar" | "abrirCerrar">;

const CarritoCtx = createContext<Contexto | null>(null);
/**
 * Contexto aparte con solo las acciones. Las tarjetas de producto solo necesitan `añadir`: si
 * leyeran el contexto completo, se volverían a pintar todas (con su menú de medidas) al
 * restaurarse el carrito justo después de hidratar, y cada vez que cambia una cantidad.
 */
const AccionesCtx = createContext<Acciones | null>(null);

function leerGuardado(): LineaGuardada[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    // Se descarta lo que ya no exista en el catálogo en vez de arrastrar basura.
    return datos.filter((l): l is LineaGuardada => {
      if (typeof l !== "object" || l === null) return false;
      const { slug, varianteId, cantidad } = l as LineaGuardada;
      if (typeof slug !== "string" || typeof varianteId !== "string" || typeof cantidad !== "number") return false;
      const p = productoPorSlug(slug);
      return !!p && p.variantes.some((v) => v.id === varianteId) && cantidad > 0;
    });
  } catch {
    return [];
  }
}

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [guardadas, despachar] = useReducer(reducer, [] as LineaGuardada[]);
  const [listo, setListo] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const guardado = leerGuardado();
    // Sin nada guardado no se despacha: el estado ya es un carrito vacío y así no cambia de referencia.
    if (guardado.length) despachar({ tipo: "restaurar", lineas: guardado });
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(guardadas));
    } catch {
      /* almacenamiento bloqueado: el carrito sigue funcionando en memoria */
    }
  }, [guardadas, listo]);

  // Radix bloquea el scroll nativo del Sheet; Lenis va por su cuenta y hay que pararlo aquí.
  useEffect(() => {
    document.documentElement.classList.toggle("carrito-abierto", abierto);
    if (abierto) window.__lenis?.stop();
    else window.__lenis?.start();
    return () => {
      document.documentElement.classList.remove("carrito-abierto");
      window.__lenis?.start();
    };
  }, [abierto]);

  const lineas = useMemo<Linea[]>(() => {
    return guardadas.flatMap((l) => {
      const producto = productoPorSlug(l.slug);
      const variante = producto?.variantes.find((v) => v.id === l.varianteId);
      if (!producto || !variante) return [];
      return [
        {
          ...l,
          producto,
          variante,
          importe: variante.precio * l.cantidad,
          excedeStock: l.cantidad > variante.stock,
        },
      ];
    });
  }, [guardadas]);

  const subtotal = useMemo(() => lineas.reduce((a, l) => a + l.importe, 0), [lineas]);
  const unidades = useMemo(() => lineas.reduce((a, l) => a + l.cantidad, 0), [lineas]);
  const envio = costoEnvio(subtotal);

  // El panel se abre desde código (no desde un SheetTrigger), así que Radix no sabe a dónde
  // devolver el foco al cerrarlo: lo recordamos aquí. Nunca un elemento de dentro del panel.
  const retornoFoco = useRef<HTMLElement | null>(null);
  const recordarFoco = (el?: Element | null) => {
    const e = (el ?? document.activeElement) as HTMLElement | null;
    retornoFoco.current = e && e !== document.body && !e.closest('[data-slot="sheet-content"]') ? e : null;
  };
  const [ultimo, setUltimo] = useState<{ slug: string; varianteId: string } | null>(null);

  const añadir = useCallback((slug: string, varianteId: string, cantidad = 1, origen?: HTMLElement | null) => {
    recordarFoco(origen);
    despachar({ tipo: "añadir", slug, varianteId, cantidad });
    setUltimo({ slug, varianteId });
    setAbierto(true);
  }, []);

  const cambiarCantidad = useCallback(
    (slug: string, varianteId: string, cantidad: number) => despachar({ tipo: "cantidad", slug, varianteId, cantidad }),
    []
  );
  const quitar = useCallback((slug: string, varianteId: string) => despachar({ tipo: "quitar", slug, varianteId }), []);
  const vaciar = useCallback(() => despachar({ tipo: "vaciar" }), []);
  const abrir = useCallback(() => {
    recordarFoco();
    setUltimo(null);
    setAbierto(true);
  }, []);
  // `cerrar` lo usan los enlaces del panel: se navega, así que no hay foco que devolver.
  const cerrar = useCallback(() => {
    retornoFoco.current = null;
    setAbierto(false);
  }, []);
  const abrirCerrar = useCallback((v: boolean) => setAbierto(v), []);

  const acciones = useMemo<Acciones>(
    () => ({ añadir, retornoFoco, cambiarCantidad, quitar, vaciar, abrir, cerrar, abrirCerrar }),
    [añadir, cambiarCantidad, quitar, vaciar, abrir, cerrar, abrirCerrar]
  );
  const valor = useMemo<Contexto>(
    () => ({ ...acciones, lineas, unidades, subtotal, envio, total: subtotal + envio, listo, ultimo, abierto }),
    [acciones, lineas, unidades, subtotal, envio, listo, ultimo, abierto]
  );

  return (
    <AccionesCtx.Provider value={acciones}>
      <CarritoCtx.Provider value={valor}>{children}</CarritoCtx.Provider>
    </AccionesCtx.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(CarritoCtx);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}

/** Solo las acciones (añadir, abrir…): no provoca renders cuando cambia el contenido del carrito. */
export function useCarritoAcciones() {
  const ctx = useContext(AccionesCtx);
  if (!ctx) throw new Error("useCarritoAcciones debe usarse dentro de <CarritoProvider>");
  return ctx;
}
