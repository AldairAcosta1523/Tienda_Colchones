"use client";

import Image from "next/image";
import Link from "next/link";
import { envio as condicionesEnvio, precio } from "@/data/catalog";
import MetodosPago from "@/components/shop/MetodosPago";
import { CompletaPagina } from "@/components/shop/CompletaCarrito";
import { useCarrito } from "@/lib/cart";
import QuantityStepper from "./QuantityStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { QUALITY } from "@/lib/imagen";
import { ButtonLabel } from "@/components/core/CtaButton";

/** Carrito en página completa: la misma información que el panel, con sitio para respirar. */
export default function CartPage() {
  const { lineas, subtotal, envio, total, unidades, cambiarCantidad, quitar, vaciar, listo } = useCarrito();

  if (!listo) {
    // El carrito se restaura en el cliente: mientras tanto, el hueco que va a ocupar.
    return (
      <div className="carrito__cargando" role="status" aria-live="polite">
        <span className="sr-only">Recuperando tu carrito…</span>
        <Skeleton className="carrito__skeleton carrito__skeleton--linea" />
        <Skeleton className="carrito__skeleton carrito__skeleton--linea" />
        <Skeleton className="carrito__skeleton carrito__skeleton--resumen" />
      </div>
    );
  }

  if (lineas.length === 0) {
    return (
      <div className="carrito__vacio">
        <p className="carrito__vacio-titulo">Tu carrito está vacío</p>
        <p>Cuando añadas algo aparecerá aquí, con su medida y su precio.</p>
        <Button asChild variant="brand" size="pill">
          <Link href="/tienda/">
            <ButtonLabel>Ir a la tienda</ButtonLabel>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="carrito__layout">
      <div className="carrito__lineas">
        <div className="carrito__cabecera">
          <h2 className="label">
            {unidades} {unidades === 1 ? "artículo" : "artículos"}
          </h2>
          <Button type="button" variant="link" size="sm" className="carrito__vaciar" onClick={vaciar}>
            Vaciar carrito
          </Button>
        </div>

        <ul>
          {lineas.map((l) => (
            <li key={`${l.slug}-${l.varianteId}`} className="cline">
              <Link href={`/producto/${l.slug}/`} className="cline__media" tabIndex={-1} aria-hidden="true">
                <Image src={l.producto.imagen.src} alt="" fill sizes="(max-width: 639px) 120px, 180px" quality={QUALITY} />
              </Link>

              <div className="cline__cuerpo">
                <div className="cline__titulo">
                  <h3>
                    <Link href={`/producto/${l.slug}/`} className="link-underline">
                      {l.producto.nombre}
                    </Link>
                  </h3>
                  <p className="cline__variante">
                    {l.variante.nombre} · {l.variante.medida} <span className="cline__sku">· {l.variante.sku}</span>
                  </p>
                  {l.excedeStock && (
                    <p className="cline__aviso" role="status">
                      Solo quedan {l.variante.stock} unidades de esta medida
                    </p>
                  )}
                </div>

                <div className="cline__controles">
                  <QuantityStepper
                    valor={l.cantidad}
                    max={Math.max(1, l.variante.stock)}
                    etiqueta={`Cantidad de ${l.producto.nombre}, ${l.variante.nombre}`}
                    onChange={(n) => cambiarCantidad(l.slug, l.varianteId, n)}
                  />
                  <span className="cline__unidad">{precio(l.variante.precio)} c/u</span>
                  <span className="cline__importe">{precio(l.importe)}</span>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="cline__quitar"
                    onClick={() => quitar(l.slug, l.varianteId)}
                    aria-label={`Quitar ${l.producto.nombre}, ${l.variante.nombre}`}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Card asChild className="carrito__resumen">
        <aside aria-label="Resumen del pedido">
        <CardHeader className="carrito__resumen-head">
          <CardTitle className="carrito__resumen-titulo">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="carrito__resumen-body">
        <dl className="carrito__totales">
          <div>
            <dt>Subtotal</dt>
            <dd>{precio(subtotal)}</dd>
          </div>
          <div>
            <dt>Envío · {condicionesEnvio.zona}</dt>
            <dd>{envio === 0 ? "Gratis" : precio(envio)}</dd>
          </div>
          <Separator className="carrito__separador" />
          <div className="carrito__total">
            <dt>Total</dt>
            <dd>{precio(total)}</dd>
          </div>
        </dl>

        {envio > 0 && (
          <p className="carrito__nota">
            Te faltan {precio(condicionesEnvio.gratisDesde - subtotal)} para el envío gratuito.
          </p>
        )}
        <p className="carrito__nota">Entrega estimada en {condicionesEnvio.plazo}.</p>

        <Button asChild variant="brand" size="pill" className="carrito__cta">
          <Link href="/checkout/">
            <ButtonLabel>Finalizar compra</ButtonLabel>
          </Link>
        </Button>
        <Link href="/tienda/" className="carrito__seguir link-underline">
          Seguir comprando
        </Link>

        <MetodosPago className="carrito__pago" />
        </CardContent>
        </aside>
      </Card>
    </div>
      <CompletaPagina />
    </>
  );
}
