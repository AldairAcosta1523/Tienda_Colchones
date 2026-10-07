"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { envio as condicionesEnvio, precio } from "@/data/catalog";
import { CompletaCajon } from "@/components/shop/CompletaCarrito";
import { useCarrito } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import QuantityStepper from "./QuantityStepper";
import { QUALITY } from "@/lib/imagen";
import { ButtonLabel } from "@/components/core/CtaButton";

/**
 * Panel lateral del carrito.
 *
 * Es el Sheet de shadcn/ui (Radix Dialog): de él vienen la trampa de foco, el cierre con Escape,
 * el `aria-modal` y la devolución del foco. El estado de apertura sigue viviendo en el provider,
 * que es quien además detiene el scroll suave de Lenis.
 */
export default function CartDrawer() {
  const { abierto, abrirCerrar, cerrar, lineas, subtotal, envio, total, unidades, cambiarCantidad, quitar, retornoFoco, ultimo } =
    useCarrito();
  const recien = ultimo && lineas.find((l) => l.slug === ultimo.slug && l.varianteId === ultimo.varianteId);
  const titulo = useRef<HTMLHeadingElement>(null);

  return (
    <Sheet open={abierto} onOpenChange={abrirCerrar}>
      <SheetContent
        side="right"
        className="drawer__panel"
        closeLabel="Cerrar el carrito"
        data-nav-theme="light"
        // Al abrir, el foco va al título y no al primer botón (+1 de la primera línea): quien
        // pulsa Enter otra vez por si no se registró no añade una unidad sin querer.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titulo.current?.focus();
        }}
        onCloseAutoFocus={(e) => {
          const destino = retornoFoco.current;
          if (destino && document.contains(destino)) {
            e.preventDefault();
            destino.focus();
          }
        }}
      >
        <SheetHeader className="drawer__head">
          <SheetTitle ref={titulo} tabIndex={-1} className="drawer__titulo">
            Tu carrito
            {unidades > 0 && (
              <Badge className="drawer__cuenta" aria-hidden="true">
                {unidades}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {recien ? `Añadido: ${recien.producto.nombre}, ${recien.variante.nombre}. ` : ""}
            {unidades === 0 ? "El carrito está vacío" : `${unidades} ${unidades === 1 ? "artículo" : "artículos"} en el carrito`}
          </SheetDescription>
        </SheetHeader>

        {lineas.length === 0 ? (
          <div className="drawer__vacio">
            <p className="drawer__vacio-titulo">Todavía no has añadido nada.</p>
            <p>Empieza por la colección de colchones o echa un vistazo a la ropa de cama.</p>
            <Button asChild variant="brand" size="pill">
              <Link href="/tienda/" onClick={cerrar}>
                <ButtonLabel>Ver la tienda</ButtonLabel>
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Líneas y sugerencias comparten un único scroll: en pantallas bajas las sugerencias
                quedaban fijas y aplastaban la lista hasta esconder lo recién añadido. */}
            <div className="drawer__cuerpo" data-lenis-prevent>
            <ul className="drawer__lineas">
              {lineas.map((l) => (
                <li key={`${l.slug}-${l.varianteId}`} className="dline">
                  <Link
                    href={`/producto/${l.slug}/`}
                    className="dline__media"
                    onClick={cerrar}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Image src={l.producto.imagen.src} alt="" fill sizes="96px" quality={QUALITY} />
                  </Link>
                  <div className="dline__cuerpo">
                    <Link href={`/producto/${l.slug}/`} className="dline__nombre" onClick={cerrar}>
                      {l.producto.nombre}
                    </Link>
                    <p className="dline__variante">
                      {l.variante.nombre} · {l.variante.medida} <span className="dline__sku">· {l.variante.sku}</span>
                    </p>
                    {l.excedeStock && (
                      <p className="dline__aviso" role="status">
                        Solo quedan {l.variante.stock} unidades
                      </p>
                    )}
                    <div className="dline__pie">
                      <QuantityStepper
                        valor={l.cantidad}
                        max={Math.max(1, l.variante.stock)}
                        etiqueta={`Cantidad de ${l.producto.nombre}, ${l.variante.nombre}`}
                        onChange={(n) => cambiarCantidad(l.slug, l.varianteId, n)}
                      />
                      <span className="dline__importe">{precio(l.importe)}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="dline__quitar"
                    onClick={() => quitar(l.slug, l.varianteId)}
                    aria-label={`Quitar ${l.producto.nombre}, ${l.variante.nombre}`}
                  >
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>

            <CompletaCajon onNavegar={cerrar} />
            </div>

            <SheetFooter className="drawer__pie">
              <dl className="drawer__totales">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{precio(subtotal)}</dd>
                </div>
                <div>
                  <dt>Envío</dt>
                  <dd>{envio === 0 ? "Gratis" : precio(envio)}</dd>
                </div>
                <Separator className="drawer__separador" />
                <div className="drawer__total">
                  <dt>Total</dt>
                  <dd>{precio(total)}</dd>
                </div>
              </dl>
              {envio > 0 && (
                <p className="drawer__nota">
                  Envío gratis a partir de {precio(condicionesEnvio.gratisDesde)} en {condicionesEnvio.zona}.
                </p>
              )}
              <div className="drawer__acciones">
                <Button asChild variant="brand" size="pill" className="drawer__cta">
                  <Link href="/checkout/" onClick={cerrar}>
                    <ButtonLabel>Finalizar compra</ButtonLabel>
                  </Link>
                </Button>
                <Link href="/carrito/" className="drawer__ver link-underline" onClick={cerrar}>
                  Ver el carrito completo
                </Link>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
