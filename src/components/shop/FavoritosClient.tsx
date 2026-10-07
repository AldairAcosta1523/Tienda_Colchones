"use client";

import Link from "next/link";
import { useFavoritos } from "@/lib/listas";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLabel } from "@/components/core/CtaButton";

export default function FavoritosClient() {
  const { productos, listo, vaciar } = useFavoritos();

  if (!listo) {
    return (
      <ul className="tienda__grid favoritos__grid" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Skeleton className="pcard__skeleton" />
          </li>
        ))}
      </ul>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="tienda__vacio">
        <p className="tienda__vacio-titulo">Todavía no has guardado nada.</p>
        <p>Pulsa el corazón de cualquier producto para tenerlo a mano aquí.</p>
        <Link href="/colchones/" className="btn btn--primary">
          <ButtonLabel>Explorar colchones</ButtonLabel>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="tienda__estado">
        <p className="tienda__cuenta" role="status">
          {productos.length} {productos.length === 1 ? "producto guardado" : "productos guardados"}
        </p>
        <button type="button" className="chip chip--limpiar" onClick={vaciar}>
          Vaciar favoritos
        </button>
      </div>
      <h2 className="sr-only">Productos guardados</h2>
      <ul className="tienda__grid favoritos__grid">
        {productos.map((p, i) => (
          <li key={p.slug}>
            <ProductCard producto={p} prioridad={i === 0} />
          </li>
        ))}
      </ul>
    </>
  );
}
