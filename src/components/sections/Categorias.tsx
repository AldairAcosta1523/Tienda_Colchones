import Image from "next/image";
import Link from "next/link";
import { categorias, productosDeCategoria, precio, precioDesde } from "@/data/catalog";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import Rule from "@/components/core/Rule";
import { Arrow } from "@/components/core/CtaButton";
import { QUALITY } from "@/lib/imagen";

/**
 * Las cuatro familias del catálogo como índice, no como rejilla de tarjetas.
 *
 * Cada familia lleva su foto en su fila a todos los anchos; al pasar el cursor por la fila, la
 * foto se acerca como en las tarjetas (regla común en components.css). No hay cambio de foto ni
 * estado, así que es un componente de servidor: solo las entradas animadas se hidratan.
 */
export default function Categorias() {
  return (
    <section className="cats" id="categorias" data-nav-theme="light">
      <div className="container cats__grid">
        <div className="cats__head">
          <Reveal y={10}>
            <Eyebrow index="01">La tienda</Eyebrow>
          </Reveal>
          <SplitLines as="h2" className="h2 cats__title" lines={["Empieza por donde", "te haga falta."]} />
          <Reveal delay={0.12} y={0} className="cats__intro">
            <p>
              Colchones, almohadas, ropa de cama y bases, con el precio de entrada a la vista.
            </p>
          </Reveal>
        </div>

        <ul className="cats__lista">
          {categorias.map((c, i) => {
            const lista = productosDeCategoria(c.id);
            const desde = Math.min(...lista.map(precioDesde));
            return (
              <li key={c.id} className="cat">
                <Rule delay={i * 0.06} />
                <Link href={c.id === "colchones" ? "/colchones/" : `/tienda/?categoria=${c.id}`} className="cat__link">
                  <span className="cat__n label" aria-hidden="true">
                    0{i + 1}
                  </span>
                  {/* Decorativa: el nombre de la fila ya da nombre al enlace. */}
                  <span className="cat__thumb">
                    <Image src={c.imagen.src} alt="" fill sizes="(max-width: 1023px) 24vw, 200px" quality={QUALITY} />
                  </span>
                  <span className="cat__cuerpo">
                    <span className="cat__nombre">{c.nombre}</span>
                    <span className="cat__resumen">{c.resumen}</span>
                  </span>
                  <span className="cat__meta num">
                    <span>
                      {lista.length} {lista.length === 1 ? "producto" : "productos"}
                    </span>
                    <span>desde {precio(desde)}</span>
                  </span>
                  <span className="cat__flecha" aria-hidden="true">
                    <Arrow />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
