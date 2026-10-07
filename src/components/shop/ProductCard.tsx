"use client";

import { useEffect, useRef, useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Plus } from "lucide-react";
import {
  agotado,
  categoriaPorId,
  coleccionPorId,
  NOMBRE_CORTO_CONSTRUCCION,
  precio,
  precioParaFiltro,
  type Producto,
} from "@/data/catalog";
import { useCarritoAcciones } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompararBtn, FavoritoBtn } from "./Acciones";
import { QUALITY } from "@/lib/imagen";

/**
 * Tarjeta de producto.
 *
 * Foto, una línea de contexto (colección y construcción, o categoría), nombre y precio, los datos
 * que distinguen al modelo y una frase. El pie tiene siempre la misma altura: un botón «Añadir»
 * que despliega las medidas con su tamaño y precio, y «Comparar» en los colchones. Antes las
 * medidas iban como fichas sueltas y, según el ancho, saltaban de línea y desalineaban la fila.
 *
 * El añadido nunca elige la medida por el usuario: con varias, se abre el menú; con una sola
 * (por ejemplo, al filtrar la tienda por Queen) el botón dice cuál añade. En tarjetas estrechas
 * ese botón se queda en «+ Queen»: el verbo se oculta, pero sigue en el nombre accesible.
 *
 * Hover igual en todas: la foto se acerca un poco y el nombre se subraya. No se cambia de foto:
 * solo algunos productos tenían segunda imagen y casi nunca era del producto.
 *
 * El «desde» usa las variantes con stock que cumplen el filtro de medida; solo si todas están
 * agotadas enseña el precio de una agotada, y entonces el pie lo dice.
 */
export default function ProductCard({
  producto,
  prioridad = false,
  inmediata = false,
  medidasFiltro = [],
}: {
  producto: Producto;
  prioridad?: boolean;
  /**
   * Está a la vista al cargar en escritorio (2.ª y 3.ª de la primera fila): carga sin esperar
   * pero con prioridad baja, para no quitarle red a la primera en móvil. Si fueran diferidas,
   * su pintado tardío contaba como un LCP nuevo.
   */
  inmediata?: boolean;
  /** Medidas activas en la tienda; vacío = todas. */
  medidasFiltro?: string[];
}) {
  // Solo las acciones: la tarjeta no se vuelve a pintar cuando cambia el contenido del carrito.
  const { añadir } = useCarritoAcciones();
  const sinStock = agotado(producto);
  const desde =
    precioParaFiltro(producto, medidasFiltro, true) ?? precioParaFiltro(producto, medidasFiltro) ?? precioParaFiltro(producto, []);
  const variantes = medidasFiltro.length ? producto.variantes.filter((v) => medidasFiltro.includes(v.nombre)) : producto.variantes;
  const disponibles = variantes.filter((v) => v.stock > 0);
  const unica = variantes.length === 1 ? variantes[0] : null;
  const esColchon = producto.categoria === "colchones";
  const esAlmohada = producto.categoria === "almohadas";

  const meta =
    esColchon && producto.coleccion && producto.construccion
      ? `${coleccionPorId(producto.coleccion).nombre} · ${NOMBRE_CORTO_CONSTRUCCION[producto.construccion]}`
      : categoriaPorId(producto.categoria).nombre;

  // Una línea de datos que siempre cabe: firmeza y altura. El número de medidas solo cuando no
  // hay otros datos (bases, ropa de cama), porque el menú «Añadir» ya las lista.
  const n = producto.variantes.length;
  const datos = [producto.firmeza ? `Firmeza ${producto.firmeza.toLowerCase()}` : null, producto.altura ?? null].filter(
    Boolean
  ) as string[];
  if (datos.length === 0 && n > 1) datos.push(`${n} ${esAlmohada ? "tamaños" : "medidas"}`);

  // Menú controlado: en táctil solo se abre con un toque completo (click), no al empezar a
  // deslizar sobre el botón. Con ratón y teclado, Radix lo abre como siempre.
  const [menuAbierto, setMenuAbierto] = useState(false);
  const toque = useRef(false);
  // Radix cierra el menú en el pointerdown del toque (lo trata como «fuera»): se guarda si estaba
  // abierto para que un segundo toque en el botón lo cierre en vez de reabrirlo.
  const abiertoAlTocar = useRef(false);
  const boton = useRef<HTMLButtonElement>(null);

  // Confirmación en el propio botón durante un instante, además de abrirse el panel del carrito.
  // Al cerrarlo, el foco vuelve a este botón (el ítem del menú ya no existe).
  const [añadida, setAñadida] = useState<string | null>(null);
  const temporizador = useRef<number | null>(null);
  useEffect(() => () => void (temporizador.current && window.clearTimeout(temporizador.current)), []);
  const alAñadir = (varianteId: string) => {
    añadir(producto.slug, varianteId, 1, boton.current);
    setAñadida(varianteId);
    if (temporizador.current) window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setAñadida(null), 1800);
  };

  // «Añadir…» y «Añadido» ocupan la misma celda (la de mayor ancho manda) y el desplegable conserva
  // su hueco: el botón no cambia de ancho al confirmar.
  const icono = añadida ? (
    <Check size={15} strokeWidth={2} aria-hidden="true" />
  ) : (
    <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
  );

  let accion: React.ReactNode;
  if (sinStock || disponibles.length === 0) {
    const agotadas = variantes.map((v) => v.nombre).join(", ");
    accion = (
      <span className="pcard__sin-stock" title={sinStock ? undefined : `${agotadas}: sin stock`}>
        {sinStock ? "Agotado" : `${agotadas} ${variantes.length > 1 ? "agotadas" : "agotada"}`}
      </span>
    );
  } else if (unica) {
    accion = (
      <button
        ref={boton}
        type="button"
        className={`pcard__añadir pcard__añadir--medida${añadida ? " is-añadido" : ""}`}
        onClick={() => alAñadir(unica.id)}
      >
        {icono}
        <span className="pcard__añadir-texto">
          <span className="pcard__añadir-ir">
            <span className="pcard__añadir-verbo">Añadir </span>
            {unica.nombre}
          </span>
          <span className="pcard__añadir-ok">Añadido</span>
        </span>
        <span className="sr-only">
          : {producto.nombre}, {unica.medida}, {precio(unica.precio)}
        </span>
      </button>
    );
  } else {
    accion = (
      <DropdownMenu modal={false} open={menuAbierto} onOpenChange={setMenuAbierto}>
        <DropdownMenuTrigger asChild>
          <button
            ref={boton}
            type="button"
            className={`pcard__añadir${añadida ? " is-añadido" : ""}`}
            onPointerDown={(e) => {
              // Táctil o lápiz: esperar al toque completo. Si el gesto acaba en scroll, no hay click.
              toque.current = e.pointerType !== "mouse";
              if (toque.current) {
                e.preventDefault();
                abiertoAlTocar.current = menuAbierto;
              }
            }}
            onClick={() => {
              if (toque.current) setMenuAbierto(!abiertoAlTocar.current);
              toque.current = false;
            }}
          >
            {icono}
            <span className="pcard__añadir-texto">
              <span className="pcard__añadir-ir">Añadir</span>
              <span className="pcard__añadir-ok">Añadido</span>
            </span>
            <ChevronDown className="pcard__añadir-caret" size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="sr-only">
              {" "}
              {producto.nombre}: elegir {esAlmohada ? "tamaño" : "medida"}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="medidas-menu"
          // Arriba deja libre la cabecera fija; abajo, un margen sobre las barras fijas.
          collisionPadding={{ top: 84, right: 12, bottom: 24, left: 12 }}
        >
          <DropdownMenuLabel className="medidas-menu__titulo">
            Elige {esAlmohada ? "el tamaño" : "la medida"}
          </DropdownMenuLabel>
          {variantes.map((v) => (
            <DropdownMenuItem
              key={v.id}
              className="medidas-menu__item"
              disabled={v.stock === 0}
              onSelect={() => alAñadir(v.id)}
            >
              <span className="medidas-menu__nombre">{v.nombre}</span>
              <span className="medidas-menu__medida">{v.medida}</span>
              <span className="medidas-menu__precio num">{v.stock === 0 ? "Agotada" : precio(v.precio)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Card asChild className={`pcard${sinStock ? " is-agotado" : ""}`}>
      <article>
        <div className="pcard__media-wrap">
          <Link href={`/producto/${producto.slug}/`} className="pcard__media" data-cursor="link" tabIndex={-1} aria-hidden="true">
            {/* Mismo nombre que la foto principal de la ficha: al abrir el producto, la foto viaja. */}
            <ViewTransition name={`producto-${producto.slug}`} share="producto" default="none">
              <Image
                src={producto.imagen.src}
                alt=""
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 30vw"
                quality={QUALITY}
                loading={prioridad || inmediata ? "eager" : undefined}
                fetchPriority={prioridad ? "high" : inmediata ? "low" : undefined}
                className="pcard__img"
              />
            </ViewTransition>
            {sinStock && (
              <Badge variant="secondary" className="pcard__badge">
                Agotado
              </Badge>
            )}
          </Link>
          <FavoritoBtn producto={producto} className="pcard__fav" />
        </div>

        <CardContent className="pcard__body">
          <p className="pcard__meta label">{meta}</p>
          <div className="pcard__cabecera">
            <h3 className="pcard__nombre">
              <Link href={`/producto/${producto.slug}/`} data-cursor="link">
                {producto.nombre}
              </Link>
            </h3>
            <p className="pcard__precio num">
              {variantes.length > 1 && <span className="pcard__desde">desde</span>}
              <span className="pcard__importe">{desde === null ? "—" : precio(desde)}</span>
            </p>
          </div>
          {datos.length > 0 && <p className="pcard__datos">{datos.join(" · ")}</p>}
          <p className="pcard__resumen">{producto.resumen}</p>
        </CardContent>

        <CardFooter className="pcard__pie">
          {accion}
          {esColchon && <CompararBtn producto={producto} className="pcard__cmp" />}
        </CardFooter>
      </article>
    </Card>
  );
}
