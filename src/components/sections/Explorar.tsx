import Link from "next/link";
import { colchonesDeColeccion, colecciones, medidasDisponibles, precio, precioEnMedida, productosDeCategoria } from "@/data/catalog";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import Rule from "@/components/core/Rule";
import { Arrow } from "@/components/core/CtaButton";

/**
 * Exploración por colección y por medida.
 *
 * Dos listas generadas desde el catálogo: cada colección con su cuenta y su «desde», y cada
 * medida con cuántos modelos la fabrican. Todos los enlaces abren /colchones/ con el filtro
 * aplicado, así que llevan a resultados reales.
 */
export default function Explorar() {
  const colchones = productosDeCategoria("colchones");
  const medidas = medidasDisponibles(colchones);

  return (
    <section className="explorar" id="explorar" data-nav-theme="dark">
      <div className="container explorar__grid">
        <div className="explorar__head">
          <Reveal y={10}>
            <Eyebrow className="eyebrow--light" index="03">
              Colecciones y medidas
            </Eyebrow>
          </Reveal>
          <SplitLines as="h2" className="h2 explorar__titulo" lines={["Elige por dónde", "quieres entrar."]} />
          <Reveal delay={0.12} y={0} className="explorar__intro">
            <p className="lead">Por colección, si tienes claro el presupuesto. Por medida, si ya sabes qué cama tienes.</p>
          </Reveal>
        </div>

        <div className="explorar__col">
          <h3 className="label explorar__sub">Colecciones</h3>
          <ul className="explorar__lista">
            {colecciones.map((c, i) => {
              const lista = colchonesDeColeccion(c.id);
              const desde = Math.min(...lista.flatMap((p) => p.variantes.map((v) => v.precio)));
              return (
                <li key={c.id}>
                  <Rule light delay={i * 0.06} />
                  <Link href={`/colchones/?coleccion=${c.id}`} className="explorar__item">
                    <span className="explorar__nombre">{c.nombre}</span>
                    <span className="explorar__nota">{c.resumen}</span>
                    <span className="explorar__dato">
                      {lista.length} modelos · desde {precio(desde)}
                    </span>
                    <Arrow />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="explorar__col">
          <h3 className="label explorar__sub">Medidas</h3>
          <ul className="explorar__lista">
            {medidas.map((m, i) => {
              const con = colchones.filter((p) => precioEnMedida(p, m) !== null);
              const desde = Math.min(...con.map((p) => precioEnMedida(p, m)!));
              const dims = con[0]?.variantes.find((v) => v.nombre === m)?.medida;
              return (
                <li key={m}>
                  <Rule light delay={i * 0.05} />
                  <Link href={`/colchones/?medida=${encodeURIComponent(m)}`} className="explorar__item">
                    <span className="explorar__nombre">{m}</span>
                    <span className="explorar__nota">{dims}</span>
                    <span className="explorar__dato">
                      {con.length} modelos · desde {precio(desde)}
                    </span>
                    <Arrow />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
