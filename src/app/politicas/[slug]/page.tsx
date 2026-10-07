import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/core/Reveal";
import Eyebrow from "@/components/core/Eyebrow";
import { listaPoliticas, politicas } from "@/data/tienda";
import { metaPagina } from "@/lib/seo";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return listaPoliticas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = listaPoliticas.find((x) => x.slug === slug);
  if (!p) return {};
  return metaPagina({ ruta: `/politicas/${p.slug}/`, titulo: p.titulo, descripcion: p.intro });
}

export default async function PoliticaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const politica = listaPoliticas.find((p) => p.slug === slug);
  if (!politica) notFound();

  return (
    <section className="legal" data-nav-theme="light">
      <div className="container legal__grid">
        <nav className="legal__nav" aria-label="Políticas">
          <h2 className="label legal__nav-titulo">Información</h2>
          <ul>
            {listaPoliticas.map((p) => (
              <li key={p.slug}>
                <Link href={`/politicas/${p.slug}/`} className={p.slug === slug ? "is-actual" : ""} aria-current={p.slug === slug ? "page" : undefined}>
                  {p.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="legal__cuerpo">
          <Reveal trigger="intro">
            <Eyebrow>{politicas.privacidad.slug === slug ? "Legal" : "Condiciones"}</Eyebrow>
          </Reveal>
          <h1 className="h2 legal__titulo">{politica.titulo}</h1>
          <p className="lead legal__intro">{politica.intro}</p>

          {politica.bloques.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 0.05} className="legal__bloque">
              <h2 className="h3">{b.titulo}</h2>
              <p>{b.texto}</p>
            </Reveal>
          ))}

          <p className="legal__demo">
            Almara es una marca conceptual creada como demostración de diseño y desarrollo. Estas condiciones muestran
            cómo se presentarían las de una tienda real, pero no son compromisos: no hay empresa, ni pedidos, ni cobros.
          </p>
        </article>
      </div>
    </section>
  );
}
