import Link from "next/link";
import { lab } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import Eyebrow from "@/components/core/Eyebrow";
import { Arrow, ButtonLabel } from "@/components/core/CtaButton";

/**
 * Resumen del Comfort Lab para la ficha de producto.
 *
 * La ficha ya explica materiales y construcción; repetir el visor 3D completo (Three.js, texturas,
 * controles) al final de cada colchón la hacía larga y pesada. Aquí quedan los tres puntos del
 * modelo y un enlace al Lab de la portada, que es donde vive la experiencia.
 */
export default function LabResumen() {
  return (
    <section className="labres" data-nav-theme="light" aria-labelledby="labres-titulo">
      <div className="container labres__grid">
        <div className="labres__copy">
          <Reveal y={10}>
            <Eyebrow>{lab.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 id="labres-titulo" className="h2">
              {lab.title[0]} {lab.title[1]}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lead">{lab.intro}</p>
          </Reveal>
          <Reveal delay={0.18}>
            <Link href="/#lab" className="btn btn--secondary labres__cta">
              <ButtonLabel>Abrir el Comfort Lab</ButtonLabel>
              <Arrow />
            </Link>
          </Reveal>
        </div>
        <Reveal as="ol" delay={0.1} className="labres__lista">
          {lab.hotspots.map((h) => (
            <li key={h.id} className="labres__item">
              <span className="label labres__n">{h.n}</span>
              <span className="labres__titulo">{h.title}</span>
              <span className="labres__texto">{h.text}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
