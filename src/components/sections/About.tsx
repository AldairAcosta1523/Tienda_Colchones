import { about } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import Rule from "@/components/core/Rule";
import MediaReveal from "@/components/core/MediaReveal";
import { QUALITY } from "@/lib/imagen";

/**
 * Relato de marca. El texto y la fotografía se mueven a ritmos distintos: la columna de
 * texto entra por bloques y la foto vertical deriva con el scroll dentro de su marco.
 *
 * Abre /nosotros: la cabecera ya se ve al cargar y entra con la secuencia CSS (`trigger="intro"`).
 */
export default function About() {
  return (
    <section className="about" id="nosotros" data-nav-theme="light">
      <div className="container about__grid">
        <div className="about__copy">
          <Reveal trigger="intro">
            <Eyebrow>{about.eyebrow}</Eyebrow>
          </Reveal>
          {/* Abre /nosotros: es el titular de la página. */}
          <SplitLines
            trigger="intro"
            as="h1"
            className="h2 about__title"
            lines={[about.title[0], about.title[1], <span className="accent" key="a">{about.title[2]}</span>]}
          />
          <Reveal trigger="intro" delay={0.16} stagger={0.1} className="about__text">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>

          <Rule className="about__rule" />
          <ul className="about__values">
            {about.values.map((v, i) => (
              <Reveal as="li" key={v.k} delay={i * 0.07} y={18}>
                <span className="about__value-k">{v.k}</span>
                <span className="about__value-t">{v.text}</span>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="about__media-col">
          <MediaReveal
            className="about__media"
            src={about.image.src}
            alt={about.image.alt}
            sizes="(max-width: 1023px) 100vw, 40vw"
            ratio="3 / 4"
            quality={QUALITY}
            parallax={7}
          />
          <span className="about__caption label" aria-hidden="true">
            Almara · Lima
          </span>
        </div>
      </div>
    </section>
  );
}
