"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { coleccionPorId, envio as condicionesEnvio, NOMBRE_CONSTRUCCION, precio, productos, type Producto } from "@/data/catalog";
import { CompararBtn, FavoritoBtn } from "./Acciones";
import { type ModelPage } from "@/data/models";
import { useCarritoAcciones } from "@/lib/cart";
import { politicas } from "@/data/tienda";
import MetodosPago from "@/components/shop/MetodosPago";
import WhatsApp from "@/components/shop/WhatsApp";
import Reveal from "@/components/core/Reveal";
import QuantityStepper from "./QuantityStepper";
import ProductCard from "./ProductCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupCard } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUALITY } from "@/lib/imagen";
import { ButtonLabel } from "@/components/core/CtaButton";

/**
 * Ficha de producto.
 *
 * En escritorio la galería se desplaza y el panel de compra queda fijo; en móvil manda el orden
 * comercial —precio, medida, cantidad, añadir— y el botón se queda pegado abajo.
 */
export default function ProductDetail({
  producto,
  editorial,
  relacionados,
}: {
  producto: Producto;
  editorial?: ModelPage;
  relacionados: Producto[];
}) {
  const { añadir } = useCarritoAcciones();
  const [varianteId, setVarianteId] = useState(
    producto.variantes.find((v) => v.stock > 0)?.id ?? producto.variantes[0].id
  );
  const [cantidad, setCantidad] = useState(1);
  const [añadido, setAñadido] = useState(false);

  const variante = producto.variantes.find((v) => v.id === varianteId)!;
  const sinStock = variante.stock === 0;
  const galeria = [producto.imagen, producto.imagenHover].filter(Boolean) as { src: string; alt: string }[];

  const onAñadir = () => {
    if (sinStock) return;
    añadir(producto.slug, varianteId, cantidad, document.activeElement as HTMLElement | null);
    setAñadido(true);
    window.setTimeout(() => setAñadido(false), 2200);
  };

  // Vecinos de la misma colección (o categoría) para orientar; la comparación completa vive en
  // /comparar/, donde el usuario elige los modelos.
  const comparables = productos
    .filter((p) => p.categoria === producto.categoria && p.slug !== producto.slug)
    .sort((a, b) => (a.coleccion === producto.coleccion ? -1 : 0) - (b.coleccion === producto.coleccion ? -1 : 0) || a.orden - b.orden)
    .slice(0, 3);

  return (
    <>
      <section className="pdp" data-nav-theme="light">
        <div className="container pdp__grid">
          <div className="pdp__galeria">
            {galeria.map((img, i) => (
              <div key={img.src} className="pdp__foto">
                <ViewTransition
                  name={i === 0 ? `producto-${producto.slug}` : undefined}
                  share={i === 0 ? "producto" : undefined}
                  default="none"
                >
                <Image
                  src={img.src}
                  alt={i === 0 ? producto.imagen.alt : img.alt}
                  fill
                  sizes="(max-width: 1023px) 100vw, 52vw"
                  quality={QUALITY}
                  // La primera foto es el LCP de la ficha: sin `priority` (retirado en Next 16).
                  loading={i === 0 ? "eager" : undefined}
                  fetchPriority={i === 0 ? "high" : undefined}
                />
                </ViewTransition>
              </div>
            ))}
          </div>

          <div className="pdp__compra">
            <div className="pdp__compra-inner">
              <Breadcrumb className="crumbs">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">Inicio</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/tienda/?categoria=${producto.categoria}`}>Tienda</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{producto.nombre}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {producto.coleccion && producto.construccion && (
                <p className="pdp__meta label">
                  <Link href={`/colchones/?coleccion=${producto.coleccion}`} className="link-underline">
                    {coleccionPorId(producto.coleccion).nombre}
                  </Link>{" "}
                  · {NOMBRE_CONSTRUCCION[producto.construccion]}
                </p>
              )}
              <div className="pdp__titulo-fila">
                <h1 className="pdp__nombre">{producto.nombre}</h1>
                <div className="pdp__acciones-sec">
                  <FavoritoBtn producto={producto} conTexto />
                  <CompararBtn producto={producto} />
                </div>
              </div>
              <p className="pdp__resumen">{producto.resumen}</p>
              <p className="pdp__descripcion">{producto.descripcion}</p>

              <p className="pdp__precio">
                <span className="pdp__importe">{precio(variante.precio)}</span>
                <span className="pdp__precio-nota">IGV incluido · {variante.nombre}</span>
              </p>

              <div className="pdp__variantes">
                <span className="label pdp__variantes-label">
                  {producto.categoria === "almohadas" ? "Tamaño" : "Medida"}
                </span>
                <RadioGroup
                  className="pdp__variantes-lista"
                  aria-label="Medida"
                  value={varianteId}
                  onValueChange={(v) => {
                    setVarianteId(v);
                    setCantidad(1);
                  }}
                >
                  {producto.variantes.map((v) => (
                    <RadioGroupCard
                      key={v.id}
                      value={v.id}
                      className={`pdp__variante${v.stock === 0 ? " is-agotada" : ""}`}
                    >
                      <span className="pdp__variante-nombre">{v.nombre}</span>
                      <span className="pdp__variante-medida">{v.medida}</span>
                      {v.stock === 0 && <span className="pdp__variante-agotada">Agotada</span>}
                    </RadioGroupCard>
                  ))}
                </RadioGroup>
              </div>

              <p className={`pdp__stock${sinStock ? " is-agotado" : ""}`}>
                {sinStock ? (
                  "Sin stock en esta medida: elige otra o escríbenos para saber cuándo vuelve"
                ) : variante.stock <= 4 ? (
                  <>Quedan {variante.stock} unidades</>
                ) : (
                  <>Disponible · entrega en {condicionesEnvio.plazo}</>
                )}
              </p>
              <dl className="pdp__variante-datos">
                <div>
                  <dt>SKU</dt>
                  <dd className="num">{variante.sku}</dd>
                </div>
                {variante.dimensiones && (
                  <div>
                    <dt>Dimensiones</dt>
                    <dd className="num">
                      {variante.dimensiones.ancho} × {variante.dimensiones.largo}
                      {variante.dimensiones.alto ? ` × ${variante.dimensiones.alto}` : ""} cm
                    </dd>
                  </div>
                )}
              </dl>

              <div className="pdp__acciones">
                <QuantityStepper
                  valor={cantidad}
                  max={Math.max(1, variante.stock)}
                  etiqueta="Cantidad"
                  onChange={setCantidad}
                />
                <Button
                  type="button"
                  variant="brand"
                  size="pill"
                  className="pdp__añadir"
                  onClick={onAñadir}
                  disabled={sinStock}
                >
                  <ButtonLabel>{sinStock ? "Sin stock" : añadido ? "Añadido al carrito" : "Añadir al carrito"}</ButtonLabel>
                  {añadido && !sinStock && <Check size={16} strokeWidth={2} aria-hidden="true" />}
                </Button>
              </div>
              <p className="sr-only" role="status" aria-live="polite">
                {añadido ? `${producto.nombre}, ${variante.nombre}, añadido al carrito` : ""}
              </p>

              <Separator className="pdp__separador" />

              <ul className="pdp__beneficios">
                {producto.beneficios.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>

              <ul className="pdp__promesas">
                <li>
                  <Truck size={16} strokeWidth={1.6} aria-hidden="true" />
                  <span>
                    {politicas.envio.resumen}
                  </span>
                </li>
                <li>
                  <RotateCcw size={16} strokeWidth={1.6} aria-hidden="true" />
                  <span>{politicas.devoluciones.resumen}</span>
                </li>
                <li>
                  <ShieldCheck size={16} strokeWidth={1.6} aria-hidden="true" />
                  <span>{politicas.garantia.resumen}</span>
                </li>
              </ul>
              <MetodosPago className="pdp__pago" contexto={`${producto.nombre} ${variante.nombre}`} />
              <WhatsApp
                className="pdp__whatsapp"
                mensaje={`Hola, me interesa ${producto.nombre} en ${variante.nombre} (${variante.medida}).`}
              >
                Pregunta por este modelo por WhatsApp
              </WhatsApp>
            </div>
          </div>
        </div>
      </section>

      {/* Ficha técnica y construcción */}
      <section className="pficha" data-nav-theme="light">
        <div className="container pficha__grid">
          <div>
            <Reveal>
              <h2 className="h2 pficha__titulo">Lo que hay que saber</h2>
            </Reveal>
            <Reveal as="dl" stagger delay={0.08} className="pficha__specs">
              {producto.especificaciones.map((s) => (
                <div key={s.k} className="pficha__spec">
                  <dt className="label">{s.k}</dt>
                  <dd>{s.v}</dd>
                </div>
              ))}
            </Reveal>
          </div>

          {editorial && (
            <div className="pficha__capas">
              <Reveal>
                <h2 className="h2 pficha__titulo">Cómo está construido</h2>
              </Reveal>
              <ol className="pficha__lista">
                {editorial.layers.map((l, i) => (
                  <Reveal as="li" key={l.n} delay={i * 0.06} className="pficha__capa">
                    <span className="label pficha__capa-n">{l.n}</span>
                    <div>
                      <h3 className="h3">{l.title}</h3>
                      <p>{l.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* Comparativa dentro de la categoría */}
      {comparables.length > 0 && (
        <section className="pcomp" data-nav-theme="light">
          <div className="container">
            <Reveal>
              <h2 className="h2 pcomp__titulo">Cómo se compara</h2>
            </Reveal>
            <Table className="pcomp__tabla">
              <TableCaption className="sr-only">
                Comparación de {producto.nombre} con el resto de la categoría
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Modelo</TableHead>
                  <TableHead scope="col">Desde</TableHead>
                  {producto.firmeza && <TableHead scope="col">Firmeza</TableHead>}
                  {producto.altura && <TableHead scope="col">Altura</TableHead>}
                  <TableHead scope="col">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[producto, ...comparables].map((p) => (
                  <TableRow key={p.slug} className={p.slug === producto.slug ? "is-actual" : ""}>
                    <TableHead scope="row">
                      {p.slug === producto.slug ? (
                        <>
                          {p.nombre} <span className="pcomp__actual">estás viendo este</span>
                        </>
                      ) : (
                        <Link href={`/producto/${p.slug}/`} className="link-underline">
                          {p.nombre}
                        </Link>
                      )}
                    </TableHead>
                    <TableCell>{precio(Math.min(...p.variantes.map((v) => v.precio)))}</TableCell>
                    {producto.firmeza && <TableCell>{p.firmeza ?? "—"}</TableCell>}
                    {producto.altura && <TableCell>{p.altura ?? "—"}</TableCell>}
                    <TableCell>{p.resumen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section className="prel" data-nav-theme="light">
          <div className="container">
            <Reveal>
              <h2 className="h2 prel__titulo">Completa tu cama</h2>
            </Reveal>
            <ul className="prel__grid">
              {relacionados.map((p) => (
                <li key={p.slug}>
                  <ProductCard producto={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Barra de compra fija en móvil */}
      <div className="pdp__barra">
        <div className="pdp__barra-info">
          <span className="pdp__barra-nombre">{producto.nombre}</span>
          <span className="pdp__barra-precio">{precio(variante.precio)}</span>
        </div>
        <Button type="button" variant="brand" size="pill" onClick={onAñadir} disabled={sinStock}>
          <ButtonLabel>{sinStock ? "Sin stock" : "Añadir"}</ButtonLabel>
        </Button>
      </div>
    </>
  );
}
