"use client";

import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { precio } from "@/data/catalog";
import { hayConsulta, hrefResultados, resaltar, sugerir, type Analisis, type Atajo, type SugProducto, SEP } from "@/lib/busqueda";
import { QUALITY } from "@/lib/imagen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Buscador con sugerencias mientras se escribe: combobox con lista (WAI-ARIA 1.2), hecho a mano.
 *
 * Radix no trae combobox y su Popover se lleva el foco a un portal; aquí el foco nunca sale del
 * campo y la opción activa se anuncia con `aria-activedescendant`. Las opciones son enlaces de
 * verdad (clic central, abrir en otra pestaña) pero no paradas de tabulación.
 *
 * Dos variantes con el mismo cerebro: «cabecera» (la banda de escritorio, con panel desplegable)
 * y «menu» (dentro del menú móvil, donde los resultados sustituyen a los enlaces del menú). El
 * texto vive en Nav; la coincidencia es la misma de la tienda (src/lib/busqueda.ts).
 */
type Props = {
  variante: "cabecera" | "menu";
  valor: string;
  onValor(v: string): void;
  /** Se va a navegar: quien lo contiene cierra lo que tenga abierto. */
  onNavegar(): void;
  /** Escape con la lista ya cerrada (solo cabecera): cerrar la banda y devolver el foco. */
  onSalir?(): void;
  autoFocus?: boolean;
  placeholder: string;
  className?: string;
};

type Opcion = { key: string; href: string; tipo: "producto" | "atajo" | "todos" | "chip" };

const TIPO: Record<Atajo["tipo"], string> = {
  categoria: "Categoría",
  coleccion: "Colección",
  construccion: "Construcción",
  firmeza: "Firmeza",
  medida: "Medida",
};

const cantidad = (n: number, unidad: Atajo["unidad"]) => `${n} ${n === 1 ? unidad.slice(0, -1) : unidad}`;
const metaAtajo = (a: Atajo) => `${TIPO[a.tipo]}${a.detalle ? `${SEP}${a.detalle}` : ""}${SEP}${cantidad(a.n, a.unidad)}`;
const recortar = (q: string) => (q.length > 28 ? `${q.slice(0, 27)}…` : q);

// Sin importar Lenis: si algún día sale del proyecto, el buscador no se entera.
type ConLenis = { __lenis?: { scrollTo(destino: number, opciones?: { immediate?: boolean; force?: boolean }): void } };

export default function BuscadorPredictivo({ variante, valor, onValor, onNavegar, onSalir, autoFocus, placeholder, className }: Props) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-lista`;
  const opId = (i: number) => `${id}-op-${i}`;
  const raizRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // El cursor quieto no debe arrastrar la lista: solo las flechas desplazan hasta la activa.
  const porTeclado = useRef(false);

  const [abierto, setAbierto] = useState(!!autoFocus);
  const [activo, setActivo] = useState(-1);
  const [aviso, setAviso] = useState("");

  const esCabecera = variante === "cabecera";
  const sug = useMemo(() => sugerir(valor, { maxProductos: 6, maxAtajos: esCabecera ? 4 : 3 }), [valor, esCabecera]);

  const { productos, atajos, explora, total, consulta, analisis, opciones, indice } = useMemo(() => {
    const productos: SugProducto[] = sug.estado === "resultados" ? sug.productos : [];
    const atajos: Atajo[] = sug.estado === "resultados" ? sug.atajos : [];
    // Sin nada escrito, la cabecera propone búsquedas frecuentes; sin resultados, las categorías.
    const explora: Atajo[] = sug.estado === "vacio" ? sug.alternativas : sug.estado === "inicial" && esCabecera ? sug.frecuentes : [];
    const total = sug.estado === "resultados" ? sug.total : 0;
    const consulta = sug.estado === "inicial" ? "" : sug.consulta;
    const analisis: Analisis | null = sug.estado === "resultados" ? sug.analisis : null;
    // Orden de las flechas = orden en pantalla. En móvil, productos primero: es lo que cabe por
    // encima del teclado.
    const p = productos.map((x): Opcion => ({ key: `p:${x.producto.slug}`, href: x.href, tipo: "producto" }));
    const a = atajos.map((x): Opcion => ({ key: `a:${x.clave}`, href: x.href, tipo: "atajo" }));
    const e = explora.map((x): Opcion => ({ key: `e:${x.clave}`, href: x.href, tipo: "chip" }));
    const t: Opcion[] = total > 0 ? [{ key: "todos", href: hrefResultados(consulta), tipo: "todos" }] : [];
    const opciones = esCabecera ? [...e, ...a, ...p, ...t] : [...e, ...p, ...a, ...t];
    return { productos, atajos, explora, total, consulta, analisis, opciones, indice: new Map(opciones.map((o, i) => [o.key, i])) };
  }, [sug, esCabecera]);

  // Cabecera: panel desplegable que se cierra al salir. Menú: los resultados son el contenido
  // del menú, así que no dependen del foco (bajar el teclado no debe esconderlos).
  const visible = esCabecera ? abierto && opciones.length > 0 : hayConsulta(valor);
  const activoVisible = visible && activo >= 0 && activo < opciones.length ? activo : -1;

  const cerrarLista = () => {
    setAbierto(false);
    setActivo(-1);
  };

  /* ------------------------------------------------------------ Navegación */

  const antesDeIr = (href: string) => {
    onNavegar();
    // SmoothScroll solo reinicia Lenis al cambiar de ruta; /tienda/?q= desde /tienda/ no cambia.
    if (new URL(href, location.href).pathname === location.pathname) {
      (window as unknown as ConLenis).__lenis?.scrollTo(0, { immediate: true, force: true });
    }
  };
  const ir = (href: string) => {
    antesDeIr(href);
    router.push(href);
  };
  const clic = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Cmd/Ctrl/Mayús/clic central abren otra pestaña: aquí no se cierra nada.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    antesDeIr(href);
  };
  // Enter sobre una opción activa ya navegó en `teclado`; lo que llega aquí es «buscar lo escrito»
  // (Enter sin opción o el botón «Buscar», aunque el ratón haya dejado una fila marcada).
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ir(hrefResultados(valor));
  };

  /* --------------------------------------------------------------- Teclado */

  const mover = (i: number) => {
    porTeclado.current = true;
    setActivo(i);
  };

  const teclado = (e: KeyboardEvent<HTMLInputElement>) => {
    // Durante una composición (acentos muertos, teclados asiáticos) las teclas son del IME.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const n = opciones.length;
    switch (e.key) {
      case "ArrowDown":
        if (visible) {
          e.preventDefault();
          if (n) mover((activo + 1) % n);
        } else if (esCabecera) {
          e.preventDefault();
          setAbierto(true);
          mover(e.altKey ? -1 : 0);
        }
        break;
      case "ArrowUp":
        if (e.altKey && esCabecera) {
          e.preventDefault();
          cerrarLista();
        } else if (visible) {
          e.preventDefault();
          if (n) mover(activo <= 0 ? n - 1 : activo - 1);
        } else if (esCabecera) {
          e.preventDefault();
          setAbierto(true);
          mover(n - 1);
        }
        break;
      case "Home":
      case "End":
        // Sin opción activa, Inicio y Fin mueven el cursor del texto, como en cualquier campo.
        if (visible && activo >= 0 && n) {
          e.preventDefault();
          mover(e.key === "Home" ? 0 : n - 1);
        }
        break;
      case "ArrowLeft":
      case "ArrowRight":
        setActivo(-1);
        break;
      case "Enter":
        if (activoVisible >= 0) {
          e.preventDefault();
          ir(opciones[activoVisible].href);
        }
        break;
      case "Tab":
        if (esCabecera) setAbierto(false);
        setActivo(-1);
        break;
      case "Escape":
        // Con la lista abierta lo atiende el oyente de captura (abajo). Aquí llega con la lista
        // cerrada: en la cabecera cierra la banda; en el menú se deja pasar y Radix cierra el menú.
        if (esCabecera) {
          e.preventDefault();
          onSalir?.();
        }
        break;
    }
  };

  // Radix escucha Escape en `document` en fase de captura, antes que cualquier manejador de React:
  // para que el primer Escape solo cierre la lista (o borre el texto en el menú) hay que llegar
  // antes, en `window`. preventDefault además evita que Chrome vacíe el campo de tipo search.
  const escuchaEscape = esCabecera ? visible : !!valor;
  useEffect(() => {
    if (!escuchaEscape) return;
    const h = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || document.activeElement !== inputRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      setActivo(-1);
      if (esCabecera) setAbierto(false);
      else onValor("");
    };
    window.addEventListener("keydown", h, { capture: true });
    return () => window.removeEventListener("keydown", h, { capture: true });
  }, [escuchaEscape, esCabecera, onValor]);

  /* ----------------------------------------------------------------- Ratón */

  // Clic fuera (solo cabecera): se cierra la lista, no la banda; volver al campo la reabre.
  useEffect(() => {
    if (!esCabecera || !abierto) return;
    const h = (e: PointerEvent) => {
      if (raizRef.current?.contains(e.target as Node)) return;
      setAbierto(false);
      setActivo(-1);
    };
    document.addEventListener("pointerdown", h, true);
    return () => document.removeEventListener("pointerdown", h, true);
  }, [esCabecera, abierto]);

  // Táctil (menú): al primer arrastre sobre los resultados se baja el teclado y caben más filas.
  const bajarTeclado = () => {
    if (document.activeElement === inputRef.current) inputRef.current?.blur();
  };

  /* ------------------------------------------------------------- Efectos */

  // La opción activa se ve siempre que se llega con flechas. getElementById porque el id de
  // useId lleva caracteres que un selector CSS obligaría a escapar.
  useEffect(() => {
    if (activoVisible < 0 || !porTeclado.current) return;
    porTeclado.current = false;
    document.getElementById(`${id}-op-${activoVisible}`)?.scrollIntoView({ block: "nearest" });
  }, [activoVisible, id]);

  // Los enlaces no precargan al aparecer (serían seis fichas por tecla); se precarga la ficha que
  // la persona está a punto de abrir.
  useEffect(() => {
    const o = activoVisible >= 0 ? opciones[activoVisible] : undefined;
    if (!o || o.tipo !== "producto") return;
    const t = window.setTimeout(() => router.prefetch(o.href), 120);
    return () => window.clearTimeout(t);
  }, [activoVisible, opciones, router]);

  // Anuncio para lectores de pantalla, con pausa: no se lee una cuenta por cada letra.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (visible && sug.estado === "resultados") {
        const n = sug.productos.length;
        const a = sug.atajos.length;
        setAviso(
          `${n} ${n === 1 ? "producto" : "productos"}${a ? ` y ${a} ${a === 1 ? "atajo" : "atajos"}` : ""}. Usa las flechas arriba y abajo para recorrerlos.`
        );
      } else if (visible && sug.estado === "vacio") setAviso(`Sin resultados para «${sug.consulta}».`);
      else setAviso("");
    }, 600);
    return () => window.clearTimeout(t);
  }, [sug, visible]);

  // Teclado en pantalla (menú): iOS no encoge el panel de 100dvh al abrirse, así que las últimas
  // filas quedaban detrás del teclado sin poder subirlas. Se mide el hueco con visualViewport.
  useEffect(() => {
    if (esCabecera) return;
    const vv = window.visualViewport;
    const menu = raizRef.current?.closest<HTMLElement>("#mobile-menu");
    if (!vv || !menu) return;
    const medir = () => menu.style.setProperty("--teclado", `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
    medir();
    vv.addEventListener("resize", medir);
    vv.addEventListener("scroll", medir);
    return () => {
      vv.removeEventListener("resize", medir);
      vv.removeEventListener("scroll", medir);
      menu.style.removeProperty("--teclado");
    };
  }, [esCabecera]);

  /* ----------------------------------------------------------------- Vista */

  const marcar = (texto: string): ReactNode =>
    analisis
      ? resaltar(texto, analisis).map((t, i) =>
          t.marca ? (
            <mark key={i} className="sug__marca">
              {t.t}
            </mark>
          ) : (
            <Fragment key={i}>{t.t}</Fragment>
          )
        )
      : texto;

  // Props comunes de una opción: enlace real, fuera del orden de tabulación.
  const opcion = (key: string, href: string, clase: string) => {
    const i = indice.get(key) ?? -1;
    return {
      id: opId(i),
      href,
      prefetch: false,
      role: "option",
      "aria-selected": i === activoVisible,
      tabIndex: -1,
      className: `sug__opcion ${clase}`,
      // pointermove y no pointerenter: con el cursor quieto, las filas que pasan por debajo
      // mientras se escribe no deben robar la opción activa.
      onPointerMove: (e: ReactPointerEvent<HTMLAnchorElement>) => {
        // Al arrastrar el dedo para desplazar, las filas no se iluminan una tras otra.
        if (e.pointerType === "touch") return;
        porTeclado.current = false;
        if (i !== activo) setActivo(i);
      },
      onClick: clic(href),
    } as const;
  };

  const grupo = (clave: string, titulo: string, contenido: ReactNode, clase = "", estilo?: CSSProperties) => (
    <div role="group" aria-labelledby={`${id}-g-${clave}`} className={`sug__grupo ${clase}`} style={estilo}>
      <div role="presentation" id={`${id}-g-${clave}`} className="label sug__titulo">
        {titulo}
      </div>
      {contenido}
    </div>
  );

  // Los {" "} no se ven (todo son rejillas) pero separan las palabras del nombre accesible:
  // «Terra Confort · Látex… desde S/ 1,890» y no «TerraConfort… desdeS/ 1,890».
  const filasProductos = productos.map((x) => (
    <Link key={x.producto.slug} {...opcion(`p:${x.producto.slug}`, x.href, "sug__opcion--producto")}>
      <span className="sug__thumb">
        <Image src={x.producto.imagen.src} alt="" fill sizes={esCabecera ? "56px" : "48px"} quality={QUALITY} className="sug__img" />
      </span>
      <span className="sug__texto">
        <span className="sug__nombre">{marcar(x.producto.nombre)}</span>{" "}
        <span className="sug__meta">{marcar(x.meta)}</span>
      </span>{" "}
      <span className="sug__precio">
        <span className="sug__desde">{x.agotado ? "Agotado" : "desde"}</span> {precio(x.desde)}
      </span>
    </Link>
  ));

  const filaAtajo = (a: Atajo, prefijo: "a" | "e") => (
    <Link key={a.clave} {...opcion(`${prefijo}:${a.clave}`, a.href, "sug__opcion--atajo")}>
      <span className="sug__texto">
        <span className="sug__nombre">{marcar(a.texto)}</span>{" "}
        <span className="sug__meta">{metaAtajo(a)}</span>
      </span>
      <ArrowRight className="sug__flecha" size={14} strokeWidth={1.6} aria-hidden="true" />
    </Link>
  );

  const chip = (a: Atajo) => (
    <Link key={a.clave} {...opcion(`e:${a.clave}`, a.href, "sug__opcion--chip")}>
      {a.texto}
    </Link>
  );

  const todos =
    total > 0 ? (
      <Link {...opcion("todos", hrefResultados(consulta), "sug__opcion--todos")}>
        <span>{total === 1 ? `Ver el resultado de «${recortar(consulta)}»` : `Ver los ${total} resultados de «${recortar(consulta)}»`}</span>
        <ArrowRight size={14} strokeWidth={1.6} aria-hidden="true" />
      </Link>
    ) : null;

  const grupoProductos =
    productos.length > 0 &&
    grupo(
      "productos",
      "Productos",
      esCabecera ? <div className="sug__productos">{filasProductos}</div> : filasProductos,
      "sug__grupo--productos",
      esCabecera ? ({ "--filas": Math.ceil(productos.length / 2) } as CSSProperties) : undefined
    );
  const grupoAtajos = atajos.length > 0 && grupo("atajos", "Categorías y filtros", atajos.map((a) => filaAtajo(a, "a")), "sug__grupo--atajos");
  const grupoExplora =
    explora.length > 0 &&
    grupo(
      "explora",
      sug.estado === "inicial" ? "Búsquedas frecuentes" : "Explora",
      esCabecera ? <div className="sug__frecuentes">{explora.map(chip)}</div> : explora.map((a) => filaAtajo(a, "e")),
      "sug__grupo--explora"
    );

  let lista: ReactNode;
  if (sug.estado !== "resultados") lista = grupoExplora;
  else if (esCabecera)
    lista = (
      <>
        {grupoAtajos}
        <div className="sug__columna">
          {grupoProductos}
          {todos}
        </div>
      </>
    );
  else
    lista = (
      <>
        {grupoProductos}
        {grupoAtajos}
        {todos}
      </>
    );

  const claseLista = esCabecera
    ? `container sug__grid${sug.estado !== "resultados" ? " sug__grid--simple" : atajos.length ? "" : " sug__grid--sin-atajos"}`
    : "sug__lista";

  return (
    <div className="buscador" ref={raizRef}>
      <form role="search" action="/tienda/" method="get" className={className} onSubmit={enviar}>
        <Search size={esCabecera ? 18 : 16} strokeWidth={1.6} aria-hidden="true" />
        <Input
          ref={inputRef}
          type="search"
          name="q"
          role="combobox"
          aria-label="Buscar productos"
          aria-expanded={visible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activoVisible >= 0 ? opId(activoVisible) : undefined}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          value={valor}
          onChange={(e) => {
            onValor(e.target.value);
            setActivo(-1);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          // Tras Escape el foco sigue en el campo: un clic en él vuelve a abrir la lista.
          onClick={() => setAbierto(true)}
          onBlur={(e) => {
            if (esCabecera && !raizRef.current?.contains(e.relatedTarget as Node | null)) cerrarLista();
          }}
          onKeyDown={teclado}
          autoFocus={autoFocus}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="sug__borrar"
          data-vacio={!valor || undefined}
          aria-label="Borrar la búsqueda"
          onClick={() => {
            onValor("");
            setActivo(-1);
            inputRef.current?.focus();
          }}
        >
          <X size={16} strokeWidth={1.6} aria-hidden="true" />
        </button>
        {esCabecera && (
          <Button type="submit" className="nav__buscador-enviar">
            Buscar
          </Button>
        )}
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {aviso}
        </p>
      </form>

      <div
        className={`sug sug--${variante}`}
        hidden={!visible}
        data-lenis-prevent
        // El foco se queda en el campo: sin esto, pulsar una opción lo perdía antes del clic.
        onMouseDown={(e) => e.preventDefault()}
        onTouchMove={esCabecera ? undefined : bajarTeclado}
      >
        {sug.estado === "vacio" && (
          // Fuera de la lista: un listbox solo puede contener opciones y grupos.
          <div className={`sug__vacio${esCabecera ? " container" : ""}`}>
            <p className="sug__vacio-titulo">Nada coincide con «{recortar(consulta)}».</p>
            <p>Prueba con otra palabra o explora:</p>
          </div>
        )}
        <div id={listId} role="listbox" aria-label="Sugerencias de búsqueda" className={claseLista}>
          {lista}
        </div>
      </div>
    </div>
  );
}
