import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/core/Eyebrow";
import CtaButton, { Arrow } from "@/components/core/CtaButton";
import { categorias } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

/**
 * 404 con la voz de la marca: dice qué pasó en una frase y ofrece los caminos que casi siempre
 * busca quien llega aquí (la tienda y sus categorías), en lugar de un «volver al inicio» solo.
 */
export default function NoEncontrada() {
  return (
    <section className="no-encontrada" data-nav-theme="light">
      <div className="container no-encontrada__grid">
        <div className="no-encontrada__texto">
          <Eyebrow index="404">Página no encontrada</Eyebrow>
          <h1 className="h2">Esta página no existe.</h1>
          <p className="lead">
            Puede que el enlace esté mal escrito o que la página haya cambiado de sitio. Desde aquí llegas a lo que
            suele buscarse.
          </p>
          <div className="no-encontrada__ctas">
            <CtaButton href="/tienda/" size="lg">
              Ir a la tienda
            </CtaButton>
            <CtaButton href="/" size="lg" variant="secondary">
              Volver al inicio
            </CtaButton>
          </div>
        </div>

        <nav className="no-encontrada__modelos" aria-label="Categorías de la tienda">
          <p className="label">Explorar la tienda</p>
          <ul>
            {categorias.map((c) => (
              <li key={c.id}>
                <Link href={c.id === "colchones" ? "/colchones/" : `/tienda/?categoria=${c.id}`} className="no-encontrada__modelo">
                  <span className="no-encontrada__nombre">{c.nombre}</span>
                  <span className="no-encontrada__nota">{c.resumen}</span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
