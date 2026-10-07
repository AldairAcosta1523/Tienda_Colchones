import Link from "next/link";
import { enlaceWhatsApp, servicios } from "@/data/comercial";

/**
 * Métodos de pago, en ficha, carrito y pie.
 *
 * Solo enseña lo confirmado en `servicios.pagos.metodos`. Si no hay nada confirmado, en vez de
 * una fila de logos que aparente medios habilitados, ofrece consultar por un canal real.
 */
export default function MetodosPago({
  className = "",
  contexto = "",
  sinEtiqueta = false,
}: {
  className?: string;
  contexto?: string;
  /** En el pie la etiqueta «Pago» competía con los títulos de columna. */
  sinEtiqueta?: boolean;
}) {
  const { metodos } = servicios.pagos;
  const wa = enlaceWhatsApp(`Hola, quiero saber las opciones de pago${contexto ? ` para ${contexto}` : ""}.`);

  return (
    <p className={`pago ${className}`}>
      {!sinEtiqueta && <span className="pago__label label">Pago</span>}
      {metodos.length > 0 ? (
        <span className="pago__lista">{metodos.join(" · ")}</span>
      ) : wa ? (
        <a href={wa} className="link-underline" target="_blank" rel="noopener noreferrer">
          Consulta las opciones de pago disponibles
        </a>
      ) : (
        <Link href="/contacto/" className="link-underline">
          Consulta las opciones de pago disponibles
        </Link>
      )}
    </p>
  );
}
