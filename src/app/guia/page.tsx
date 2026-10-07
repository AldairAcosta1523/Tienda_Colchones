import type { Metadata } from "next";
import GuiaClient from "@/components/shop/GuiaClient";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import { metaPagina } from "@/lib/seo";
import { guide } from "@/data/content";

export const metadata: Metadata = metaPagina({
  ruta: "/guia/",
  titulo: "Guía de elección",
  descripcion: "Responde cómo duermes, qué medida necesitas y cuánto quieres gastar: te mostramos los colchones del catálogo que encajan.",
});

export default function GuiaPage() {
  return (
    <>
      <section className="tienda" data-nav-theme="light">
        <div className="container">
          <header className="tienda__head">
            <Reveal trigger="intro">
              <Eyebrow>Guía de elección</Eyebrow>
            </Reveal>
            <SplitLines trigger="intro" as="h1" className="h2 tienda__titulo" lines={["Cuatro preguntas", <span className="accent" key="a">y una lista corta.</span>]} />
            <Reveal trigger="intro" delay={0.16} className="tienda__intro">
              <p className="lead">Postura, firmeza, medida y presupuesto. El resultado sale del catálogo, no de una fórmula.</p>
            </Reveal>
          </header>
          <GuiaClient />
        </div>
      </section>

      <section className="guia-medidas" data-nav-theme="light">
        <div className="container guia-medidas__grid">
          <div>
            <Reveal>
              <Eyebrow>Medidas</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="h2">{guide.steps[1].title}</h2>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <p className="lead">{guide.steps[1].text}</p>
            <p className="guia-medidas__nota">{guide.steps[1].hint}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
