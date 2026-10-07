import { finalCta } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import CtaButton from "@/components/core/CtaButton";
import MediaReveal from "@/components/core/MediaReveal";
import { QUALITY } from "@/lib/imagen";

type Props = {
  eyebrow?: string;
  headline?: string[];
  sub?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

/**
 * Cierre: titular a gran escala a la izquierda, fotografía vertical a la derecha, sobre el mismo
 * verde que el pie. CTA y pie se leen como una sola pieza de cierre, no como dos plantillas
 * apiladas. Sin velo sobre la foto: el texto ya no va encima.
 */
export default function FinalCta({
  eyebrow = finalCta.eyebrow,
  headline = finalCta.headline,
  sub = finalCta.sub,
  primary = { label: finalCta.cta, href: "#coleccion" },
  secondary = { label: finalCta.secondary, href: "#guia" },
}: Props) {
  return (
    <section className="final" data-nav-theme="dark">
      <div className="container final__grid">
        <div className="final__inner">
          <Reveal y={10}>
            <Eyebrow className="eyebrow--light">{eyebrow}</Eyebrow>
          </Reveal>
          <SplitLines
            as="h2"
            className="t-mega final__title"
            stagger={0.09}
            lines={[
              headline[0],
              headline[1],
              <em className="accent" key="a">
                {headline[2]}
              </em>,
            ]}
          />
          <Reveal delay={0.16} y={0} className="final__sub">
            <p className="lead">{sub}</p>
          </Reveal>
          <Reveal delay={0.24} stagger={0.07} y={12} className="final__ctas">
            <CtaButton href={primary.href} size="lg" variant="inverse">
              {primary.label}
            </CtaButton>
            <CtaButton href={secondary.href} size="lg" variant="ghost">
              {secondary.label}
            </CtaButton>
          </Reveal>
        </div>

        <div className="final__foto">
          <MediaReveal
            src={finalCta.image.src}
            alt={finalCta.image.alt}
            sizes="(max-width: 899px) 100vw, 40vw"
            ratio="4 / 5"
            quality={QUALITY}
            parallax={5}
            position="38% center"
          />
        </div>
      </div>
    </section>
  );
}
