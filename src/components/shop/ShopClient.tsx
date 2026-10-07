"use client";

import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  categorias,
  colecciones,
  FIRMEZAS,
  medidasDisponibles,
  NOMBRE_CONSTRUCCION,
  POR_PAGINA,
  precio,
  precioParaFiltro,
  productos,
  type CategoriaId,
  type Construccion,
  type Producto,
} from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { analizar, coincide, puntuar } from "@/lib/busqueda";
import ProductCard from "./ProductCard";
import { ButtonLabel } from "@/components/core/CtaButton";

/**
 * Tienda: búsqueda, filtros, orden y paginación con el estado en la URL.
 *
 * Cada cambio reescribe los parámetros (`?categoria=…&medida=…&max=…`) con `router.replace`, así
 * que volver desde una ficha recupera el contexto y un filtro se puede compartir por enlace. El
 * precio y la disponibilidad se evalúan sobre la variante que cumple el filtro de medida: un
 * colchón no entra en «Queen hasta S/ 2.000» por su plaza y media.
 *
 * `categoriaFija` convierte el mismo componente en la página de una categoría (/colchones/):
 * desaparece el filtro de categoría y aparecen los propios (colección, construcción, firmeza).
 */
type Orden = "recomendado" | "precio-asc" | "precio-desc" | "nombre";

const ORDENES: { id: Orden; nombre: string }[] = [
  { id: "recomendado", nombre: "Recomendado" },
  { id: "precio-asc", nombre: "Precio: menor primero" },
  { id: "precio-desc", nombre: "Precio: mayor primero" },
  { id: "nombre", nombre: "Nombre (A–Z)" },
];

const PRECIO_MAX = Math.max(...productos.flatMap((p) => p.variantes.map((v) => v.precio)));
const PRECIO_MIN = Math.min(...productos.flatMap((p) => p.variantes.map((v) => v.precio)));
const CONSTRUCCIONES = Object.keys(NOMBRE_CONSTRUCCION) as Construccion[];

const lista = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

/**
 * Lee la consulta de la URL y se la pasa a la tienda. Va aparte y dentro de su propio Suspense:
 * `useSearchParams` en una ruta estática obliga a pintar en el cliente todo lo que cuelga de su
 * Suspense, y antes era la tienda entera (el servidor mandaba un sustituto y al hidratar se
 * cambiaba la rejilla completa, con un LCP nuevo). Ahora el servidor pinta la primera página real.
 */
function ConsultaURL({ onCambio }: { onCambio: (qs: string) => void }) {
  const qs = useSearchParams().toString();
  useEffect(() => onCambio(qs), [qs, onCambio]);
  return null;
}

export default function ShopClient({ categoriaFija }: { categoriaFija?: CategoriaId }) {
  // La consulta como texto: sin filtros, «» → «» no vuelve a pintar las tarjetas al hidratar.
  const [qs, setQs] = useState("");
  const params = useMemo(() => new URLSearchParams(qs), [qs]);
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Estado derivado de la URL. Es la única fuente de verdad: los controles escriben en ella.
  const cats = useMemo(
    () => (categoriaFija ? [categoriaFija] : (lista(params.get("categoria")) as CategoriaId[]).filter((c) => categorias.some((x) => x.id === c))),
    [params, categoriaFija]
  );
  const cols = useMemo(() => lista(params.get("coleccion")).filter((c) => colecciones.some((x) => x.id === c)), [params]);
  const cons = useMemo(() => lista(params.get("construccion")).filter((c): c is Construccion => c in NOMBRE_CONSTRUCCION), [params]);
  const firmezas = useMemo(() => lista(params.get("firmeza")).filter((f) => (FIRMEZAS as string[]).includes(f)), [params]);
  const medidas = useMemo(() => lista(params.get("medida")), [params]);
  const tope = Math.min(PRECIO_MAX, Math.max(PRECIO_MIN, Number(params.get("max")) || PRECIO_MAX));
  const soloStock = params.get("disponible") === "1";
  const busqueda = params.get("q") ?? "";
  const orden = (ORDENES.some((o) => o.id === params.get("orden")) ? params.get("orden") : "recomendado") as Orden;
  const visibles = Math.max(POR_PAGINA, Number(params.get("n")) || POR_PAGINA);

  const [panelAbierto, setPanelAbierto] = useState(false);
  // El buscador escribe en local y vuelca a la URL con un pequeño retardo: así no se reescribe
  // el historial en cada tecla.
  const [textoBusqueda, setTextoBusqueda] = useState(busqueda);
  useEffect(() => setTextoBusqueda(busqueda), [busqueda]);
  const temporizador = useRef<number | null>(null);

  const escribir = useCallback(
    (cambios: Record<string, string | null>, opciones: { reiniciarPagina?: boolean } = { reiniciarPagina: true }) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(cambios)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (opciones.reiniciarPagina) next.delete("n");
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router]
  );

  const alternarEnLista = (clave: string, actual: string[], valor: string) => {
    const nueva = actual.includes(valor) ? actual.filter((x) => x !== valor) : [...actual, valor];
    escribir({ [clave]: nueva.join(",") });
  };

  const cambiarBusqueda = (v: string) => {
    setTextoBusqueda(v);
    if (temporizador.current) window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => escribir({ q: v.trim() }), 250);
  };

  const soloColchones = cats.length === 1 && cats[0] === "colchones";
  const hayColchones = cats.length === 0 || cats.includes("colchones");

  const activos =
    (categoriaFija ? 0 : cats.length) +
    cols.length +
    cons.length +
    firmezas.length +
    medidas.length +
    (tope < PRECIO_MAX ? 1 : 0) +
    (soloStock ? 1 : 0) +
    (busqueda ? 1 : 0);

  const limpiar = () =>
    escribir({ categoria: categoriaFija ? null : null, coleccion: null, construccion: null, firmeza: null, medida: null, max: null, disponible: null, q: null });

  // Medidas que existen en la selección de categorías actual: sin opciones imposibles.
  const medidasOpciones = useMemo(() => {
    const base = cats.length ? productos.filter((p) => cats.includes(p.categoria)) : productos;
    const deCama = medidasDisponibles(base);
    const otras = Array.from(new Set(base.flatMap((p) => p.variantes.map((v) => v.nombre)))).filter((n) => !deCama.includes(n));
    return [...deCama, ...otras];
  }, [cats]);

  // El mismo criterio que las sugerencias de la cabecera: «Ver los N resultados» enseña N. Si la
  // búsqueda nombra una medida («queen», «160x200»), cuenta como filtro de medida para el precio.
  const analisis = useMemo(() => analizar(busqueda), [busqueda]);
  const medidasEfectivas = useMemo(() => [...new Set([...medidas, ...analisis.medidas])], [medidas, analisis]);

  const resultados = useMemo(() => {
    const filtrados = productos
      // Precio de la variante que cumple la medida, prefiriendo las que tienen stock: es el mismo
      // «desde» que muestra la tarjeta. Con «Solo con stock», las agotadas no cuentan.
      .map((p: Producto) => ({
        p,
        precioFiltro:
          precioParaFiltro(p, medidasEfectivas, true) ?? (soloStock ? null : precioParaFiltro(p, medidasEfectivas, false)),
      }))
      .filter(({ p, precioFiltro }) => {
        if (cats.length && !cats.includes(p.categoria)) return false;
        if (cols.length && (!p.coleccion || !cols.includes(p.coleccion))) return false;
        if (cons.length && (!p.construccion || !cons.includes(p.construccion))) return false;
        if (firmezas.length && (!p.firmeza || !firmezas.includes(p.firmeza))) return false;
        if (precioFiltro === null) return false; // ninguna variante cumple medida/stock
        if (precioFiltro > tope) return false;
        return coincide(p, analisis);
      });

    if (orden === "precio-asc") filtrados.sort((a, b) => a.precioFiltro! - b.precioFiltro!);
    else if (orden === "precio-desc") filtrados.sort((a, b) => b.precioFiltro! - a.precioFiltro!);
    else if (orden === "nombre") filtrados.sort((a, b) => a.p.nombre.localeCompare(b.p.nombre, "es"));
    else if (analisis.terminos.length) {
      // «Recomendado» con búsqueda: por relevancia, como en el panel de la cabecera.
      filtrados.sort((a, b) => puntuar(b.p, analisis) - puntuar(a.p, analisis) || a.p.orden - b.p.orden);
    } else filtrados.sort((a, b) => a.p.orden - b.p.orden);
    return filtrados.map((x) => x.p);
  }, [cats, cols, cons, firmezas, medidasEfectivas, analisis, tope, soloStock, orden]);

  const pagina = resultados.slice(0, visibles);
  const quedan = resultados.length - pagina.length;

  /**
   * Los filtros se pintan dos veces —columna en escritorio, Sheet en móvil— así que cada casilla
   * necesita un id propio: `ns` evita que el <label> del panel apunte al control de la columna.
   */
  const grupoCasillas = (
    ns: string,
    titulo: string,
    opciones: { id: string; nombre: string }[],
    marcados: string[],
    onToggle: (id: string) => void
  ) => (
    <fieldset className="filtros__grupo">
      <legend className="label">{titulo}</legend>
      <div className="filtros__opciones">
        {opciones.map((o) => {
          const id = `${ns}-${titulo}-${o.id}`.replace(/\s+/g, "-").toLowerCase();
          return (
            <div key={o.id} className="filtros__opcion">
              <Checkbox id={id} checked={marcados.includes(o.id)} onCheckedChange={() => onToggle(o.id)} />
              <Label htmlFor={id}>{o.nombre}</Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );

  const filtros = (ns: string) => (
    <div className="filtros__cuerpo">
      {!categoriaFija &&
        grupoCasillas(
          ns,
          "Categoría",
          categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
          cats,
          (id) => alternarEnLista("categoria", cats, id)
        )}
      {hayColchones &&
        grupoCasillas(
          ns,
          "Colección",
          colecciones.map((c) => ({ id: c.id, nombre: c.nombre })),
          cols,
          (id) => alternarEnLista("coleccion", cols, id)
        )}
      {hayColchones &&
        grupoCasillas(
          ns,
          "Construcción",
          CONSTRUCCIONES.map((c) => ({ id: c, nombre: NOMBRE_CONSTRUCCION[c] })),
          cons,
          (id) => alternarEnLista("construccion", cons, id)
        )}
      {(hayColchones || cats.includes("almohadas")) &&
        grupoCasillas(
          ns,
          "Firmeza",
          FIRMEZAS.map((f) => ({ id: f, nombre: f })),
          firmezas,
          (id) => alternarEnLista("firmeza", firmezas, id)
        )}
      {grupoCasillas(
        ns,
        "Medida",
        medidasOpciones.map((m) => ({ id: m, nombre: m })),
        medidas,
        (id) => alternarEnLista("medida", medidas, id)
      )}

      <fieldset className="filtros__grupo">
        <legend className="label">Precio máximo</legend>
        <Slider
          className="filtros__rango"
          min={PRECIO_MIN}
          max={PRECIO_MAX}
          step={50}
          value={[tope]}
          onValueChange={([v]) => escribir({ max: v >= PRECIO_MAX ? null : String(v) })}
          aria-label={`Precio máximo: ${precio(tope)}`}
        />
        <p className="filtros__rango-valor">
          Hasta <strong>{precio(tope)}</strong>
          {medidas.length > 0 && (
            <span className="filtros__rango-nota">
              {" "}
              en{" "}
              {medidas.map((m, i) => (
                <Fragment key={m}>
                  {i ? ", " : ""}
                  <span className="nowrap">{m}</span>
                </Fragment>
              ))}
            </span>
          )}
        </p>
      </fieldset>

      <fieldset className="filtros__grupo">
        <legend className="label">Disponibilidad</legend>
        <div className="filtros__opcion">
          <Checkbox id={`${ns}-disponible`} checked={soloStock} onCheckedChange={() => escribir({ disponible: soloStock ? null : "1" })} />
          <Label htmlFor={`${ns}-disponible`}>Solo con stock</Label>
        </div>
      </fieldset>

      {activos > 0 && (
        <Button type="button" variant="link" size="sm" className="filtros__limpiar" onClick={limpiar}>
          Limpiar filtros ({activos})
        </Button>
      )}
    </div>
  );

  // Chips de filtros activos sobre la rejilla: se ven y se quitan uno a uno.
  const chips: { k: string; texto: string; quitar: () => void }[] = [
    ...(!categoriaFija ? cats.map((c) => ({ k: `c-${c}`, texto: categorias.find((x) => x.id === c)!.nombre, quitar: () => alternarEnLista("categoria", cats, c) })) : []),
    ...cols.map((c) => ({ k: `col-${c}`, texto: colecciones.find((x) => x.id === c)!.nombre, quitar: () => alternarEnLista("coleccion", cols, c) })),
    ...cons.map((c) => ({ k: `con-${c}`, texto: NOMBRE_CONSTRUCCION[c], quitar: () => alternarEnLista("construccion", cons, c) })),
    ...firmezas.map((f) => ({ k: `f-${f}`, texto: `Firmeza ${f.toLowerCase()}`, quitar: () => alternarEnLista("firmeza", firmezas, f) })),
    ...medidas.map((m) => ({ k: `m-${m}`, texto: m, quitar: () => alternarEnLista("medida", medidas, m) })),
    ...(tope < PRECIO_MAX ? [{ k: "max", texto: `Hasta ${precio(tope)}`, quitar: () => escribir({ max: null }) }] : []),
    ...(soloStock ? [{ k: "disp", texto: "Solo con stock", quitar: () => escribir({ disponible: null }) }] : []),
    ...(busqueda ? [{ k: "q", texto: `«${busqueda}»`, quitar: () => escribir({ q: null }) }] : []),
  ];

  return (
    <>
    <Suspense fallback={null}>
      <ConsultaURL onCambio={setQs} />
    </Suspense>
    <div className="tienda__layout">
      <aside className="filtros" aria-label="Filtros">
        {filtros("col")}
      </aside>

      <div className="tienda__contenido">
        <div className="tienda__barra">
          <div className="tienda__buscar">
            <Label htmlFor="tienda-buscar" className="sr-only">
              Buscar productos
            </Label>
            <Search size={16} strokeWidth={1.7} aria-hidden="true" />
            <Input
              id="tienda-buscar"
              type="search"
              value={textoBusqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              placeholder={soloColchones ? "Buscar por nombre, construcción, firmeza…" : "Buscar colchón, almohada, lino…"}
            />
          </div>

          <div className="tienda__controles">
            <Sheet open={panelAbierto} onOpenChange={setPanelAbierto}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="tienda__filtros-btn">
                  <SlidersHorizontal strokeWidth={1.7} aria-hidden="true" />
                  Filtrar{activos > 0 ? ` (${activos})` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="filtros--panel" closeLabel="Cerrar los filtros">
                <SheetHeader className="filtros__head">
                  <SheetTitle className="filtros__titulo label">Filtrar</SheetTitle>
                  <SheetDescription className="sr-only">
                    Filtra el catálogo por categoría, colección, construcción, firmeza, medida, precio y disponibilidad
                  </SheetDescription>
                </SheetHeader>
                {filtros("panel")}
                <SheetFooter className="filtros__pie">
                  {activos > 0 && (
                    <Button type="button" variant="outline" size="pill" onClick={limpiar}>
                      Limpiar
                    </Button>
                  )}
                  <Button type="button" variant="brand" size="pill" onClick={() => setPanelAbierto(false)}>
                    Ver {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <div className="tienda__orden">
              <Label htmlFor="tienda-orden" className="sr-only">
                Ordenar por
              </Label>
              <Select value={orden} onValueChange={(v) => escribir({ orden: v === "recomendado" ? null : v }, { reiniciarPagina: false })}>
                <SelectTrigger id="tienda-orden">
                  {/* Con texto propio: el servidor ya lo pinta y no hay salto al hidratar. */}
                  <SelectValue>{ORDENES.find((o) => o.id === orden)!.nombre}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ORDENES.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="tienda__estado">
          <p className="tienda__cuenta" role="status" aria-live="polite">
            {resultados.length === 0
              ? "Ningún producto coincide"
              : `${resultados.length} ${resultados.length === 1 ? "producto" : "productos"}`}
            {activos > 0 && resultados.length > 0 ? " con los filtros aplicados" : ""}
          </p>
          {chips.length > 0 && (
            <ul className="tienda__chips" aria-label="Filtros activos">
              {chips.map((c) => (
                <li key={c.k}>
                  <button type="button" className="chip" onClick={c.quitar} aria-label={`Quitar filtro ${c.texto}`}>
                    {c.texto}
                    <X size={12} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="chip chip--limpiar" onClick={limpiar}>
                  Limpiar todo
                </button>
              </li>
            </ul>
          )}
        </div>

        {resultados.length === 0 ? (
          <div className="tienda__vacio">
            <p className="tienda__vacio-titulo">No encontramos nada con esa combinación.</p>
            <p>
              {medidas.length && tope < PRECIO_MAX
                ? "Prueba a subir el precio máximo o a quitar la medida: el precio se compara con la variante elegida."
                : "Prueba a quitar algún filtro o a buscar por otra palabra."}
            </p>
            <Button type="button" variant="brand-secondary" size="pill" onClick={limpiar}>
              <ButtonLabel>Limpiar todos los filtros</ButtonLabel>
            </Button>
          </div>
        ) : (
          <>
            {/* Nivel intermedio entre el h1 de la página y el h3 de cada tarjeta. */}
            <h2 className="sr-only">Productos</h2>
            <ul className="tienda__grid">
              {pagina.map((p, i) => (
                <li key={p.slug}>
                  {/* Prioridad alta solo para la primera: en móvil es la única a la vista y cada foto
                      «alta» compite con ella por la red. */}
                  <ProductCard producto={p} prioridad={i === 0} inmediata={i > 0 && i < 3} medidasFiltro={medidasEfectivas} />
                </li>
              ))}
            </ul>
            {quedan > 0 && (
              <div className="tienda__mas">
                <p className="tienda__mas-nota">
                  Mostrando {pagina.length} de {resultados.length}
                </p>
                <Button
                  type="button"
                  variant="brand-secondary"
                  size="pill"
                  onClick={() => escribir({ n: String(visibles + POR_PAGINA) }, { reiniciarPagina: false })}
                >
                  <ButtonLabel>Cargar {Math.min(POR_PAGINA, quedan)} más</ButtonLabel>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
