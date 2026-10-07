import type { Metadata } from "next";
import CompararClient from "@/components/shop/CompararClient";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  ...metaPagina({ ruta: "/comparar/", titulo: "Comparar colchones", descripcion: "Compara construcción, firmeza, altura, materiales y precio por medida de los colchones que elijas." }),
  robots: { index: false },
};

export default function CompararPage() {
  return (
    <section className="tienda tienda--lista" data-nav-theme="light">
      <div className="container">
        <header className="tienda__head">
          <Reveal trigger="intro">
            <Eyebrow>Comparador</Eyebrow>
          </Reveal>
          <SplitLines trigger="intro" as="h1" className="h2 tienda__titulo" lines={["Compara los modelos", <span className="accent" key="a">que te interesan.</span>]} />
          <Reveal trigger="intro" delay={0.16} className="tienda__intro">
            <p className="lead">Construcción, firmeza, altura, materiales y precio en la misma medida, uno al lado del otro.</p>
          </Reveal>
        </header>
        <CompararClient />
      </div>
    </section>
  );
}
