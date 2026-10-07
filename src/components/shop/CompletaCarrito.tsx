"use client";

import Image from "next/image";
import Link from "next/link";
import { agotado, precio, precioDesde, productos } from "@/data/catalog";
import { useCarrito } from "@/lib/cart";
import ProductCard from "@/components/shop/ProductCard";
import { QUALITY } from "@/lib/imagen";

/**
 * «Completa tu cama» dentro del carrito: complementos reales que todavía no están en él.
 *
 * Sin colchón en el carrito propone colchones (es lo primero); con colchón, almohadas,
 * ropa de cama y bases. Solo productos con stock. Si no queda nada que sugerir, no renderiza.
 */
function sugerencias(enCarrito: string[], max: number) {
  const hayColchon = productos.some((p) => p.categoria === "colchones" && enCarrito.includes(p.slug));
  return productos
    .filter((p) => !enCarrito.includes(p.slug) && !agotado(p))
    .filter((p) => (hayColchon ? p.categoria !== "colchones" : p.categoria === "colchones"))
    .sort((a, b) => a.orden - b.orden)
    .slice(0, max);
}

/** Versión compacta para el cajón: foto, nombre, precio y enlace a la ficha. */
export function CompletaCajon({ onNavegar }: { onNavegar?: () => void }) {
  const { lineas } = useCarrito();
  const lista = sugerencias(lineas.map((l) => l.slug), 3);
  if (lista.length === 0) return null;
  return (
    <div className="dcompleta">
      <p className="label dcompleta__titulo">Completa tu cama</p>
      <ul className="dcompleta__lista">
        {lista.map((p) => (
          <li key={p.slug}>
            <Link href={`/producto/${p.slug}/`} className="dcompleta__item" onClick={onNavegar}>
              <span className="dcompleta__media">
                <Image src={p.imagen.src} alt="" fill sizes="56px" quality={QUALITY} />
              </span>
              <span className="dcompleta__nombre">{p.nombre}</span>
              <span className="dcompleta__precio num">
                {p.variantes.length > 1 && <span className="dcompleta__desde">desde</span>} {precio(precioDesde(p))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Versión para la página de carrito: tarjetas completas con añadido rápido por medida. */
export function CompletaPagina() {
  const { lineas } = useCarrito();
  const lista = sugerencias(lineas.map((l) => l.slug), 3);
  if (lista.length === 0) return null;
  return (
    <section className="ccompleta" aria-labelledby="ccompleta-titulo">
      <h2 id="ccompleta-titulo" className="h3 ccompleta__titulo">Completa tu cama</h2>
      <ul className="ccompleta__grid">
        {lista.map((p) => (
          <li key={p.slug}>
            <ProductCard producto={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
