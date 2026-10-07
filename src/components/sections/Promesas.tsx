import Link from "next/link";
import { envio } from "@/data/catalog";
import Reveal from "@/components/core/Reveal";
import { Arrow } from "@/components/core/CtaButton";

/**
 * Condiciones de compra.
 *
 * Cada una enlaza a su página, donde se explica qué cubre y qué no.
 */
const PROMESAS = [
  {
    titulo: "Envío en Lima",
    texto: `Gratis desde ${envio.gratisDesde} soles. Entrega en ${envio.plazo}.`,
    href: "/politicas/envio/",
  },
  {
    titulo: "30 noches de prueba",
    texto: "Un colchón se juzga durmiendo, no en una tienda.",
    href: "/politicas/devoluciones/",
  },
  {
    titulo: "10 años de garantía",
    texto: "Sobre el núcleo y los defectos de fabricación.",
    href: "/politicas/garantia/",
  },
  {
    titulo: "Te ayudamos a elegir",
    texto: "Escríbenos antes de comprar si dudas de la firmeza.",
    href: "/contacto/",
  },
];

export default function Promesas() {
  return (
    <section className="promesas" data-nav-theme="light">
      <div className="container">
        <h2 className="sr-only">Condiciones de compra</h2>
        <ul className="promesas__grid">
          {PROMESAS.map((p, i) => (
            <Reveal as="li" key={p.titulo} delay={i * 0.07} y={14} className="promesa">
              <Link href={p.href} className="promesa__link">
                <span className="label promesa__n" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="promesa__titulo">{p.titulo}</h3>
                <p className="promesa__texto">{p.texto}</p>
                <span className="promesa__ir" aria-hidden="true">
                  <Arrow />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
