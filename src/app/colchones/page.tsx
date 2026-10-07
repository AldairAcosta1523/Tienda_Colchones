import type { Metadata } from "next";
import ShopClient from "@/components/shop/ShopClient";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import { metaPagina } from "@/lib/seo";
import { colecciones, productosDeCategoria } from "@/data/catalog";

const colchones = productosDeCategoria("colchones");

export const metadata: Metadata = metaPagina({
  ruta: "/colchones/",
  titulo: "Colchones",
  descripcion: `${colchones.length} colchones en ${colecciones.length} colecciones. Filtra por firmeza, construcción, medida y precio.`,
});

/** Categoría principal: la misma tienda con la categoría fija y sus filtros propios. */
export default function ColchonesPage() {
  return (
    <section className="tienda" data-nav-theme="light">
      <div className="container">
        <header className="tienda__head">
          <Reveal trigger="intro">
            <Eyebrow>Colchones</Eyebrow>
          </Reveal>
          <SplitLines
            trigger="intro"
            as="h1"
            className="h2 tienda__titulo"
            lines={["Elige medida, firmeza", <span className="accent" key="a">y construcción.</span>]}
          />
          <Reveal trigger="intro" delay={0.16} className="tienda__intro">
            <p className="lead">
              {colchones.length} modelos en {colecciones.length} colecciones: {colecciones.map((c) => c.nombre.toLowerCase()).join(", ")}.
            </p>
          </Reveal>
        </header>
        <ShopClient categoriaFija="colchones" />
      </div>
    </section>
  );
}
