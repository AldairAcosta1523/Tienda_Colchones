"use client";

import { useEffect, useRef } from "react";
import { alAcercarse, MQ } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import { guide } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import Rule from "@/components/core/Rule";
import Link from "next/link";
import { Arrow, ButtonLabel } from "@/components/core/CtaButton";

/**
 * Cómo elegir: el gran contraste de la página.
 *
 * La entrada al fondo espresso se resuelve con un velo del color claro anterior que se retira
 * hacia abajo mientras la sección sube. El velo solo existe cuando hay JS y movimiento: por
 * defecto está retraído, así que sin animación no tapa nada ni provoca destellos. GSAP se carga
 * cuando la sección se acerca (a 1000 px), no al abrir la página.
 */
export default function Guide() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    const velo = el?.querySelector(".guide__veil");
    if (!el || !velo || !window.matchMedia(MQ.motion).matches) return;
    return alAcercarse(el, ({ gsap }) => {
      gsap.fromTo(
        velo,
        { scaleY: 1 },
        {
          scaleY: 0,
          ease: EASE.scrub,
          scrollTrigger: { trigger: el, start: "top bottom", end: "top 52%", scrub: 0.4 },
        }
      );
    });
  }, []);

  return (
    <section ref={ref} className="guide" id="guia" data-nav-theme="dark">
      <span className="guide__veil" aria-hidden="true" />
      <div className="container">
        <div className="guide__head">
          <div className="guide__titulo">
            <Reveal y={10}>
              <Eyebrow className="eyebrow--light" index="06">
                {guide.eyebrow}
              </Eyebrow>
            </Reveal>
            <SplitLines as="h2" className="display guide__title" lines={[guide.title[0], guide.title[1]]} />
          </div>
          <Reveal delay={0.12} y={0} className="guide__intro">
            <p className="lead">{guide.intro}</p>
          </Reveal>
        </div>

        <ol className="guide__steps">
          {guide.steps.map((s, i) => (
            <li key={s.n} className="step">
              <Rule light delay={i * 0.08} className="step__rule" />
              <Reveal delay={0.08 + i * 0.08} y={18} className="step__inner">
                <span className="step__n" aria-hidden="true">
                  {s.n}
                </span>
                <h3 className="h3 step__title">{s.title}</h3>
                <p className="step__text">{s.text}</p>
                <p className="step__hint">{s.hint}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal y={12} className="guide__pie">
          <Link href="/guia/" className="btn btn--inverse">
            <ButtonLabel>Responder en la guía de elección</ButtonLabel>
            <Arrow />
          </Link>
          <p>¿Dudas entre dos modelos?</p>
          <Link href="/comparar/" className="arrow-link">
            Compáralos lado a lado
            <Arrow />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
