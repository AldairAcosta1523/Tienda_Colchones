"use client";

import { faq } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import CtaButton from "@/components/core/CtaButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/** FAQ sobre Accordion de shadcn/ui (Radix): accesible por teclado, un ítem abierto a la vez. */
export default function Faq({
  items = faq.items,
  comoTitulo1 = false,
}: {
  items?: { q: string; a: string }[];
  /** En la página dedicada el titular de la sección es el h1 del documento. */
  comoTitulo1?: boolean;
}) {
  // En /faq la sección abre la página y se ve al cargar: entra con la secuencia CSS de cabecera.
  const entrada = comoTitulo1 ? "intro" : "scroll";
  return (
    <section className="faq" id="faq" data-nav-theme="light">
      <div className="container faq__grid">
        <div className="faq__side">
          <Reveal trigger={entrada}>
            <Eyebrow index={comoTitulo1 ? undefined : "07"}>Preguntas frecuentes</Eyebrow>
          </Reveal>
          <SplitLines
            trigger={entrada}
            as={comoTitulo1 ? "h1" : "h2"}
            className="h2 faq__title"
            lines={[faq.title[0], faq.title[1], faq.title[2]]}
          />
          <Reveal trigger={entrada} delay={0.3} className="faq__more">
            <p>{faq.more.title}</p>
            <CtaButton href="/contacto/" variant="secondary">
              {faq.more.cta}
            </CtaButton>
          </Reveal>
        </div>

        <Reveal trigger={entrada} className="faq__list">
          {/* En /faq el titular es h1 y cada pregunta un h3: este h2 evita el salto de nivel. */}
          {comoTitulo1 && <h2 className="sr-only">Preguntas y respuestas</h2>}
          <Accordion type="single" collapsible defaultValue="faq-0">
            {items.map((item, i) => (
              <AccordionItem className="faq__item" value={`faq-${i}`} key={item.q}>
                <AccordionTrigger className="faq__q">
                  <span className="faq__n">0{i + 1}</span>
                  <span className="faq__q-text">{item.q}</span>
                  <span className="faq__icon" aria-hidden="true">
                    <span />
                    <span />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="faq__a">
                  <p>{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
