import Link from "next/link";
import { contact, footer, site } from "@/data/content";
import { categorias, colecciones, colchonesDeColeccion, productosDeCategoria } from "@/data/catalog";
import { listaPoliticas } from "@/data/tienda";
import SplitLines from "@/components/core/SplitLines";
import MetodosPago from "@/components/shop/MetodosPago";
import { contacto } from "@/data/comercial";

/** Pie diseñado, no añadido: el wordmark funciona como remate tipográfico de la página. */
export default function Footer() {
  return (
    <footer className="footer" data-nav-theme="dark">
      <div className="container footer__grid">
        <div className="footer__intro">
          <p className="footer__claim">{site.tagline}</p>
          <a className="footer__mail link-underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </div>

        <div className="footer__col">
          <h2 className="label footer__title">Colchones</h2>
          <ul>
            <li>
              <Link href="/colchones/" className="link-underline">
                Todos los colchones <span className="footer__n">{productosDeCategoria("colchones").length}</span>
              </Link>
            </li>
            {colecciones.map((c) => (
              <li key={c.id}>
                <Link href={`/colchones/?coleccion=${c.id}`} className="link-underline">
                  {c.nombre} <span className="footer__n">{colchonesDeColeccion(c.id).length}</span>
                </Link>
              </li>
            ))}
            {categorias
              .filter((c) => c.id !== "colchones")
              .map((c) => (
                <li key={c.id}>
                  <Link href={`/tienda/?categoria=${c.id}`} className="link-underline">
                    {c.nombre}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div className="footer__col">
          <h2 className="label footer__title">Explorar</h2>
          <ul>
            {footer.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h2 className="label footer__title">Condiciones</h2>
          <ul>
            {listaPoliticas.map((p) => (
              <li key={p.slug}>
                <Link href={`/politicas/${p.slug}/`} className="link-underline">
                  {p.titulo}
                </Link>
              </li>
            ))}
            <li className="footer__muted">{contact.hours}</li>
            <li className="footer__muted">
              <MetodosPago className="pago--pie" sinEtiqueta />
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer__markline">
        <SplitLines as="p" className="footer__mark" lineClassName="footer__mark-line" start="top 96%" lines={["Almara"]} />
      </div>

      <div className="container footer__bottom">
        <span>
          {footer.copyright}
          {contacto.ruc && ` ${contacto.razonSocial} · RUC ${contacto.ruc}.`}
        </span>
        <span className="footer__muted">{contact.address}</span>
      </div>
    </footer>
  );
}
