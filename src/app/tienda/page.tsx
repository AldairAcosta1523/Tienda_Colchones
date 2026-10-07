import type { Metadata } from "next";
import ShopClient from "@/components/shop/ShopClient";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import { metaPagina } from "@/lib/seo";
import { productos } from "@/data/catalog";

export const metadata: Metadata = metaPagina({
  ruta: "/tienda/",
  titulo: "Tienda",
  descripcion:
    "Colchones, almohadas, ropa de cama y bases de Almara. Filtra por categoría, firmeza, medida y precio para encontrar lo que necesita tu descanso.",
});

export default function TiendaPage() {
  return (
    <section className="tienda" data-nav-theme="light">
      <div className="container">
        <header className="tienda__head">
          <Reveal trigger="intro">
            <Eyebrow>Tienda</Eyebrow>
          </Reveal>
          <SplitLines
            trigger="intro"
            as="h1"
            className="h2 tienda__titulo"
            lines={["Todo lo que sostiene", <span className="accent" key="a">una buena noche.</span>]}
          />
          <Reveal trigger="intro" delay={0.16} className="tienda__intro">
            <p className="lead">
              {productos.length} productos entre colchones, almohadas, ropa de cama y bases.
            </p>
          </Reveal>
        </header>
        <ShopClient />
      </div>
    </section>
  );
}
