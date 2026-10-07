import Link from "next/link";
import { collection } from "@/data/content";
import { destacados, productosDeCategoria } from "@/data/catalog";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import ProductCard from "@/components/shop/ProductCard";
import { Arrow } from "@/components/core/CtaButton";

/**
 * Selección Almara: entrada al catálogo, no el catálogo.
 *
 * Seis colchones marcados como `destacado` en los datos, con la tarjeta de la tienda (favorito,
 * comparar, añadido por medida). El enlace al final lleva a la categoría completa con su cuenta
 * real. «Más vendidos» queda para cuando haya datos de ventas.
 */
export default function Destacados() {
  const lista = destacados().slice(0, 6);
  const total = productosDeCategoria("colchones").length;

  return (
    <section className="destacados" id="coleccion" data-nav-theme="light">
      <div className="container">
        <div className="destacados__head">
          <div className="destacados__titulo">
            <Reveal y={10}>
              <Eyebrow index="02">{collection.eyebrow}</Eyebrow>
            </Reveal>
            <SplitLines as="h2" className="h2" lines={[collection.title[0], `${collection.title[1]} ${collection.title[2]}`]} />
          </div>
          <Reveal delay={0.12} y={0} className="destacados__intro">
            <p className="lead">{collection.intro}</p>
            <Link href="/colchones/" className="arrow-link">
              Ver los {total} colchones
              <Arrow />
            </Link>
          </Reveal>
        </div>

        <ul className="destacados__grid">
          {lista.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={(i % 3) * 0.06} y={16}>
              <ProductCard producto={p} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
