import { hero } from "@/data/content";
import SplitLines from "@/components/core/SplitLines";
import Reveal from "@/components/core/Reveal";
import MediaReveal from "@/components/core/MediaReveal";
import Button, { Arrow } from "@/components/core/CtaButton";
import Link from "next/link";
import Eyebrow from "@/components/core/Eyebrow";
import { QUALITY } from "@/lib/imagen";

/**
 * Hero.
 *
 * Una sola acción con peso (comprar) y otra en texto (comparar): dos botones iguales apilados se
 * leían como un formulario.
 *
 * Composición de portada de revista: el titular ocupa el ancho de la página, el texto funcional
 * se recoge en una columna estrecha a su derecha y la fotografía entra debajo, sangrando por el
 * borde derecho. Nada flota sobre la foto: la foto es el producto.
 *
 * La entrada es una secuencia con un solo reloj (`BEAT`):
 * fotografía → titular por líneas → texto → botones → señales.
 *
 * Toda la secuencia corre en CSS (`trigger="intro"`, ver styles/intro.css) desde el primer
 * pintado: no espera a que cargue el JavaScript. Si hay cortina de entrada, los tiempos se
 * desplazan lo que dura la cortina (`--intro-offset`).
 */
const BEAT = {
  media: 0.05,
  eyebrow: 0.2,
  title: 0.26,
  desc: 0.62,
  ctas: 0.74,
  caption: 0.9,
  signals: 0.96,
};

export default function Hero() {
  return (
    <section className="hero" id="top" data-nav-theme="light">
      <div className="container hero__top">
        <div className="hero__headline">
          <Reveal trigger="intro" delay={BEAT.eyebrow} y={10}>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </Reveal>
          <SplitLines
            as="h1"
            className="hero__title t-mega"
            trigger="intro"
            delay={BEAT.title}
            stagger={0.1}
            lines={[
              <span key="l0">{hero.lines[0]}</span>,
              <span key="l1">
                {hero.lines[1]} <em className="accent">{hero.lines[2]}</em>
              </span>,
            ]}
          />
        </div>

        <div className="hero__aside">
          <Reveal trigger="intro" delay={BEAT.desc} y={14} className="hero__desc">
            <p>{hero.description}</p>
          </Reveal>
          <Reveal trigger="intro" delay={BEAT.ctas} stagger={0.07} y={12} className="hero__ctas">
            <Button href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
            </Button>
            <Link href={hero.secondaryCta.href} className="arrow-link hero__cta-sec">
              {hero.secondaryCta.label}
              <Arrow />
            </Link>
          </Reveal>
        </div>
      </div>

      <div className="hero__stage">
        <MediaReveal
          className="hero__media"
          src={hero.image.src}
          alt={hero.image.alt}
          sizes="100vw"
          quality={QUALITY}
          priority
          trigger="intro"
          delay={BEAT.media}
          parallax={6}
          position="center 62%"
        />
        <Reveal trigger="intro" delay={BEAT.caption} y={0} className="hero__caption">
          <p className="label">{hero.caption}</p>
        </Reveal>
      </div>

      <Reveal
        as="ul"
        trigger="intro"
        delay={BEAT.signals}
        stagger={0.07}
        y={12}
        className="container hero__signals"
        aria-label="Condiciones de la colección"
      >
        {hero.signals.map((s, i) => (
          <li key={s}>
            <span className="label hero__signal-n">0{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
