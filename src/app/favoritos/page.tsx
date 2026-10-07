import type { Metadata } from "next";
import FavoritosClient from "@/components/shop/FavoritosClient";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  ...metaPagina({ ruta: "/favoritos/", titulo: "Favoritos", descripcion: "Los productos que has guardado en este navegador." }),
  robots: { index: false },
};

export default function FavoritosPage() {
  return (
    <section className="tienda tienda--lista" data-nav-theme="light">
      <div className="container">
        <header className="tienda__head">
          <Reveal trigger="intro">
            <Eyebrow>Favoritos</Eyebrow>
          </Reveal>
          <SplitLines trigger="intro" as="h1" className="h2 tienda__titulo" lines={["Lo que has", <span className="accent" key="a">guardado.</span>]} />
          <Reveal trigger="intro" delay={0.16} className="tienda__intro">
            <p className="lead">Se guardan en este navegador, sin cuenta. Desde aquí puedes comparar o añadir al carrito.</p>
          </Reveal>
        </header>
        <FavoritosClient />
      </div>
    </section>
  );
}
