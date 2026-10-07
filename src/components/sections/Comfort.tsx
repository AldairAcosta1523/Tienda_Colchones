"use client";

import { useState } from "react";
import { comfort } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import MediaReveal from "@/components/core/MediaReveal";
import { QUALITY } from "@/lib/imagen";

/**
 * Nuestro confort: editorial arriba, ficha técnica abajo.
 *
 * La ficha es un corte transversal esquemático enlazado a la lista de capas: al recorrer la lista
 * (cursor, foco o toque) se ilumina la capa correspondiente, y al revés. El dibujo es un esquema,
 * no un plano: no representa grosores reales, solo el orden de las capas que describe el texto.
 */
export default function Comfort() {
  const [activa, setActiva] = useState(0);

  return (
    <section className="comfort" id="confort" data-nav-theme="light">
      <div className="container comfort__grid">
        <div className="comfort__copy">
          <Reveal y={10}>
            <Eyebrow>{comfort.eyebrow}</Eyebrow>
          </Reveal>
          <SplitLines
            as="h2"
            className="h2 comfort__title"
            lines={[comfort.title[0], comfort.title[1], comfort.title[2]]}
          />
          <Reveal delay={0.12} y={16} stagger={0.1} className="comfort__text">
            {comfort.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </div>

        <figure className="comfort__media-col">
          <MediaReveal
            className="comfort__media"
            src={comfort.image.src}
            alt={comfort.image.alt}
            sizes="(max-width: 899px) 100vw, 40vw"
            ratio="4 / 5"
            quality={QUALITY}
            parallax={6}
          />
          <figcaption className="comfort__caption label">Lino lavado · Tacto seco</figcaption>
        </figure>
      </div>

      <div className="container comfort__ficha">
        <Reveal y={0} className="comfort__corte">
          <h3 className="label comfort__ficha-titulo">De la superficie al soporte</h3>
          <svg
            className="corte"
            viewBox="0 0 560 250"
            role="img"
            aria-label={`Esquema del colchón en corte. Capa destacada: ${comfort.layers[activa].k}.`}
          >
            {/* Perímetro: marco lateral que abraza el núcleo */}
            <g className={`corte__capa${activa === 3 ? " is-activa" : ""}`} onMouseEnter={() => setActiva(3)}>
              <rect x="10" y="92" width="36" height="148" />
              <rect x="514" y="92" width="36" height="148" />
              <rect x="10" y="222" width="540" height="18" />
            </g>
            {/* Núcleo con zonas */}
            <g className={`corte__capa${activa === 2 ? " is-activa" : ""}`} onMouseEnter={() => setActiva(2)}>
              <rect x="50" y="92" width="460" height="126" />
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <line key={n} className="corte__trazo" x1={50 + (460 / 7) * n} y1="100" x2={50 + (460 / 7) * n} y2="210" />
              ))}
            </g>
            {/* Acogida */}
            <g className={`corte__capa${activa === 1 ? " is-activa" : ""}`} onMouseEnter={() => setActiva(1)}>
              <rect x="10" y="40" width="540" height="48" />
              <path
                className="corte__trazo"
                d="M22 64 q 18 -14 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0 t 36 0"
              />
            </g>
            {/* Tejido */}
            <g className={`corte__capa${activa === 0 ? " is-activa" : ""}`} onMouseEnter={() => setActiva(0)}>
              <rect x="10" y="12" width="540" height="24" rx="10" />
            </g>
          </svg>
          <p className="comfort__nota">Esquema orientativo: muestra el orden de las capas, no su grosor real.</p>
        </Reveal>

        <ol className="comfort__capas">
          {comfort.layers.map((l, i) => (
            <Reveal as="li" key={l.k} delay={i * 0.07} y={14}>
              <button
                type="button"
                className={`capa${activa === i ? " is-activa" : ""}`}
                aria-pressed={activa === i}
                onMouseEnter={() => setActiva(i)}
                onFocus={() => setActiva(i)}
                onClick={() => setActiva(i)}
              >
                <span className="label capa__n">0{i + 1}</span>
                <span className="capa__k">{l.k}</span>
                <span className="capa__texto">{l.text}</span>
              </button>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
