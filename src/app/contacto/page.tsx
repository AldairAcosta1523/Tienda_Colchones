import type { Metadata } from "next";
import Consulta from "@/components/sections/Consulta";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import WhatsApp from "@/components/shop/WhatsApp";
import { contactoPagina } from "@/data/tienda";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = metaPagina({
  ruta: "/contacto/",
  titulo: "Contacto",
  descripcion:
    "Escríbenos antes de comprar si dudas entre dos firmezas o no sabes qué medida necesitas.",
});

export default function ContactoPage() {
  return (
    <>
      <section className="contacto" data-nav-theme="light">
        <div className="container contacto__grid">
          <div>
            <Reveal trigger="intro">
              <Eyebrow>Contacto</Eyebrow>
            </Reveal>
            <SplitLines
              trigger="intro"
              as="h1"
              className="h2"
              lines={[contactoPagina.titulo[0], <span className="accent" key="a">{contactoPagina.titulo[1]}</span>]}
            />
            <Reveal trigger="intro" delay={0.16} className="contacto__intro">
              <p className="lead">{contactoPagina.intro}</p>
            </Reveal>
          </div>

          <Reveal trigger="intro" delay={0.1} as="dl" className="contacto__canales">
            {contactoPagina.canales.map((c) => (
              <div key={c.k}>
                <dt className="label">{c.k}</dt>
                <dd>{c.href ? <a href={c.href} className="link-underline">{c.v}</a> : c.v}</dd>
              </div>
            ))}
            <WhatsApp className="contacto__whatsapp" mensaje="Hola, tengo una duda sobre los colchones Almara." />
          </Reveal>
        </div>
      </section>

      <Consulta />
    </>
  );
}
