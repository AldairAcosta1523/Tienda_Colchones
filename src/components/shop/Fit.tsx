import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import type { ModelPage } from "@/data/models";

/** Para quién es el colchón y cómo cuidarlo. Solo aplica a los modelos con ficha editorial redactada (models.ts). */
export default function Fit({ editorial }: { editorial: ModelPage }) {
  return (
    <section className="fit" data-nav-theme="light">
      <div className="container fit__grid">
        <div className="fit__side">
          <Reveal>
            <Eyebrow>¿Es para ti?</Eyebrow>
          </Reveal>
          <SplitLines as="h2" className="h2" lines={["Cómo se siente", <span className="accent" key="a">al acostarse.</span>]} />
          <Reveal delay={0.16} className="fit__blocks">
            <div>
              <h3 className="label">Pensado para</h3>
              <p>{editorial.fit.forWho}</p>
            </div>
            <div>
              <h3 className="label">Postura al dormir</h3>
              <p>{editorial.fit.sleepers}</p>
            </div>
            <div>
              <h3 className="label">Si buscas otra cosa</h3>
              <p>{editorial.fit.alternative}</p>
            </div>
          </Reveal>
        </div>

        <div className="fit__aside">
          <Reveal className="fit__card fit__card--care">
            <h3 className="h3">Cuidados</h3>
            <ul className="fit__care">
              {editorial.care.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
