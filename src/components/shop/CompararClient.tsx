"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import {
  coleccionPorId,
  medidasDisponibles,
  NIVEL_FIRMEZA,
  NOMBRE_CONSTRUCCION,
  precio,
  precioEnMedida,
  productosDeCategoria,
  type Producto,
} from "@/data/catalog";
import { MAX_COMPARAR, MIN_COMPARAR, useComparar } from "@/lib/listas";
import Firmeza from "@/components/core/Firmeza";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QUALITY } from "@/lib/imagen";
import { ButtonLabel } from "@/components/core/CtaButton";

const spec = (p: Producto, k: string) => p.especificaciones.find((e) => e.k === k)?.v ?? "—";

/**
 * Comparador: de 2 a 4 colchones elegidos por el usuario desde tarjetas y fichas.
 *
 * El precio se compara en una misma medida; si algún modelo no la ofrece, la celda lo dice en
 * vez de poner el precio de otra medida. En móvil la tabla se desplaza en horizontal con la
 * columna de etiquetas fija.
 */
export default function CompararClient() {
  const { productos: seleccion, listo, quitar, vaciar } = useComparar();
  const colchones = productosDeCategoria("colchones");
  const [medida, setMedida] = useState<string>("");

  // Medidas que ofrecen todos los seleccionados van primero; el resto se marca como parcial.
  const medidas = useMemo(() => {
    const todas = medidasDisponibles(colchones);
    const comunes = todas.filter((m) => seleccion.every((p) => precioEnMedida(p, m) !== null));
    return { todas, comunes };
  }, [seleccion, colchones]);
  const medidaActiva = medida || medidas.comunes[0] || medidas.todas[0] || "";

  if (!listo) return <Skeleton className="cmp__skeleton" />;

  if (seleccion.length === 0) {
    return (
      <div className="tienda__vacio">
        <p className="tienda__vacio-titulo">Aún no has elegido modelos para comparar.</p>
        <p>
          Pulsa «Comparar» en hasta {MAX_COMPARAR} colchones del catálogo y vuelve aquí.
        </p>
        <Link href="/colchones/" className="btn btn--primary">
          <ButtonLabel>Ir a los colchones</ButtonLabel>
        </Link>
      </div>
    );
  }

  const filas: { k: string; v: (p: Producto) => React.ReactNode }[] = [
    { k: "Colección", v: (p) => (p.coleccion ? coleccionPorId(p.coleccion).nombre : "—") },
    { k: "Construcción", v: (p) => (p.construccion ? NOMBRE_CONSTRUCCION[p.construccion] : "—") },
    {
      k: "Firmeza",
      v: (p) =>
        p.firmeza ? (
          <span className="cmp__firmeza">
            <span>
              {p.firmeza} · {NIVEL_FIRMEZA[p.firmeza]}/5
            </span>
            <Firmeza valor={p.firmeza} />
          </span>
        ) : (
          "—"
        ),
    },
    { k: "Altura", v: (p) => p.altura ?? "—" },
    { k: "Núcleo", v: (p) => spec(p, "Núcleo") },
    { k: "Acogida", v: (p) => spec(p, "Acogida") },
    { k: "Tejido", v: (p) => spec(p, "Tejido") },
    { k: "Postura", v: (p) => spec(p, "Postura") },
    { k: "Recomendado para", v: (p) => spec(p, "Recomendado") },
    { k: "Medidas", v: (p) => p.variantes.map((x) => x.nombre).join(" · ") },
    {
      k: `Precio en ${medidaActiva || "—"}`,
      v: (p) => {
        const pr = precioEnMedida(p, medidaActiva);
        if (pr === null) return <span className="cmp__nd">No se fabrica en esta medida</span>;
        const v = p.variantes.find((x) => x.nombre === medidaActiva)!;
        return (
          <span className="cmp__precio">
            <strong className="num">{precio(pr)}</strong>
            <span className="cmp__sku">{v.sku}</span>
            {v.stock === 0 && <span className="cmp__nd">Agotada</span>}
          </span>
        );
      },
    },
  ];

  return (
    <div className="cmp">
      <div className="cmp__barra">
        <p className="tienda__cuenta" role="status">
          {seleccion.length} de {MAX_COMPARAR} modelos
          {seleccion.length < MIN_COMPARAR && " · añade al menos uno más para comparar"}
        </p>
        <div className="cmp__medida">
          <Label htmlFor="cmp-medida">Comparar precio en</Label>
          <Select value={medidaActiva} onValueChange={setMedida}>
            <SelectTrigger id="cmp-medida">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {medidas.todas.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                  {!medidas.comunes.includes(m) && " · no en todos"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button type="button" className="chip chip--limpiar" onClick={vaciar}>
          Vaciar
        </button>
      </div>

      <div className="cmp__scroll" data-lenis-prevent>
        <table className="cmp__tabla">
          <caption className="sr-only">Comparación de {seleccion.map((p) => p.nombre).join(", ")}</caption>
          <thead>
            <tr>
              <th scope="col" className="cmp__eti">
                <span className="sr-only">Característica</span>
              </th>
              {seleccion.map((p) => (
                <th scope="col" key={p.slug} className="cmp__cab">
                  {/* Enlace como la foto de la tarjeta: fuera del tabulador, el nombre ya lo es. */}
                  <Link href={`/producto/${p.slug}/`} className="cmp__foto" tabIndex={-1} aria-hidden="true">
                    <Image src={p.imagen.src} alt="" fill sizes="(max-width: 720px) 60vw, 22vw" quality={QUALITY} />
                  </Link>
                  <Link href={`/producto/${p.slug}/`} className="cmp__nombre">
                    {p.nombre}
                  </Link>
                  <p className="cmp__resumen">{p.resumen}</p>
                  <button type="button" className="chip" onClick={() => quitar(p.slug)} aria-label={`Quitar ${p.nombre} de la comparación`}>
                    Quitar <X size={12} strokeWidth={2} aria-hidden="true" />
                  </button>
                </th>
              ))}
              {seleccion.length < MAX_COMPARAR && (
                <th scope="col" className="cmp__cab cmp__cab--mas">
                  <Link href="/colchones/" className="cmp__añadir">
                    + Añadir otro modelo
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.k}>
                <th scope="row" className="cmp__eti">
                  {f.k}
                </th>
                {seleccion.map((p) => (
                  <td key={p.slug}>{f.v(p)}</td>
                ))}
                {seleccion.length < MAX_COMPARAR && <td aria-hidden="true" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
