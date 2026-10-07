"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FIRMEZAS, medidasDisponibles, precio, precioEnMedida, productosDeCategoria, type Firmeza } from "@/data/catalog";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ButtonLabel } from "@/components/core/CtaButton";

/**
 * Guía de elección: tres preguntas que filtran el catálogo real.
 *
 * Postura → firmezas compatibles (orientación general, no consejo médico). Medida → solo
 * modelos que la fabrican. Presupuesto → precio de esa medida, no el «desde». Si no hay
 * coincidencias, se dice y se ofrece relajar cada criterio.
 */
const POSTURAS: { id: string; nombre: string; firmezas: Firmeza[] }[] = [
  { id: "lado", nombre: "De lado", firmezas: ["Suave", "Media-suave", "Media"] },
  { id: "arriba", nombre: "Boca arriba", firmezas: ["Media", "Media-firme", "Firme"] },
  { id: "abajo", nombre: "Boca abajo", firmezas: ["Media-firme", "Firme"] },
  { id: "mixta", nombre: "Cambio mucho", firmezas: ["Media-suave", "Media", "Media-firme"] },
];

const colchones = productosDeCategoria("colchones");
const MEDIDAS = medidasDisponibles(colchones);
const MAX = Math.max(...colchones.flatMap((p) => p.variantes.map((v) => v.precio)));
const MIN = Math.min(...colchones.flatMap((p) => p.variantes.map((v) => v.precio)));

export default function GuiaClient() {
  const [postura, setPostura] = useState<string>("");
  const [firmeza, setFirmeza] = useState<Firmeza | "">("");
  const [medida, setMedida] = useState<string>("");
  const [tope, setTope] = useState(MAX);

  const firmezasSugeridas = POSTURAS.find((p) => p.id === postura)?.firmezas ?? [];

  const resultados = useMemo(() => {
    return colchones
      .filter((p) => {
        if (firmeza) return p.firmeza === firmeza;
        if (firmezasSugeridas.length) return p.firmeza && firmezasSugeridas.includes(p.firmeza);
        return true;
      })
      .filter((p) => {
        const pr = medida ? precioEnMedida(p, medida) : Math.min(...p.variantes.map((v) => v.precio));
        return pr !== null && pr <= tope;
      })
      .sort((a, b) => a.orden - b.orden);
  }, [firmeza, firmezasSugeridas, medida, tope]);

  const hayCriterios = postura || firmeza || medida || tope < MAX;

  const paso = (n: string, titulo: string, children: React.ReactNode) => (
    <fieldset className="guiaq__paso">
      <legend>
        <span className="label guiaq__n">{n}</span>
        <span className="h3">{titulo}</span>
      </legend>
      {children}
    </fieldset>
  );

  const opcion = (activo: boolean, onClick: () => void, texto: string) => (
    <button key={texto} type="button" className={`chip chip--opcion${activo ? " is-activo" : ""}`} aria-pressed={activo} onClick={onClick}>
      {texto}
    </button>
  );

  return (
    <div className="guiaq">
      <div className="guiaq__form">
        {paso("01", "¿Cómo duermes?", (
          <div className="guiaq__opciones">
            {POSTURAS.map((p) =>
              opcion(postura === p.id, () => {
                setPostura(postura === p.id ? "" : p.id);
                setFirmeza("");
              }, p.nombre)
            )}
          </div>
        ))}
        {paso("02", "¿Qué firmeza prefieres?", (
          <>
            <div className="guiaq__opciones">
              {FIRMEZAS.map((f) => {
                const sugerida = firmezasSugeridas.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    className={`chip chip--opcion${firmeza === f ? " is-activo" : ""}${sugerida && !firmeza ? " is-sugerida" : ""}`}
                    aria-pressed={firmeza === f}
                    onClick={() => setFirmeza(firmeza === f ? "" : f)}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            {postura && !firmeza && (
              <p className="guiaq__nota">Para dormir {POSTURAS.find((p) => p.id === postura)!.nombre.toLowerCase()} solemos sugerir {firmezasSugeridas.map((f) => f.toLowerCase()).join(", ")}. Es orientativo: elige la que prefieras.</p>
            )}
          </>
        ))}
        {paso("03", "¿Qué medida necesitas?", (
          <div className="guiaq__opciones">
            {MEDIDAS.map((m) => opcion(medida === m, () => setMedida(medida === m ? "" : m), m))}
          </div>
        ))}
        {paso("04", "¿Hasta cuánto quieres gastar?", (
          <div className="guiaq__rango">
            <Slider min={MIN} max={MAX} step={100} value={[tope]} onValueChange={([v]) => setTope(v)} aria-label={`Presupuesto máximo: ${precio(tope)}`} />
            <p className="filtros__rango-valor">
              Hasta <strong>{precio(tope)}</strong>
              {medida && (
                <span className="filtros__rango-nota">
                  {" "}
                  en <span className="nowrap">{medida}</span>
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="guiaq__resultados">
        <p className="tienda__cuenta" role="status" aria-live="polite">
          {!hayCriterios
            ? `${colchones.length} colchones en el catálogo. Responde para acotar.`
            : resultados.length === 0
              ? "Ningún modelo cumple todos los criterios."
              : `${resultados.length} ${resultados.length === 1 ? "modelo encaja" : "modelos encajan"}`}
        </p>

        {resultados.length === 0 ? (
          <div className="tienda__vacio">
            <p className="tienda__vacio-titulo">Afloja un criterio y volvemos a buscar.</p>
            <div className="guiaq__opciones">
              {tope < MAX && opcion(false, () => setTope(MAX), "Quitar el presupuesto")}
              {medida && opcion(false, () => setMedida(""), `Quitar ${medida}`)}
              {(firmeza || postura) && opcion(false, () => { setFirmeza(""); setPostura(""); }, "Quitar la firmeza")}
            </div>
          </div>
        ) : (
          <>
            <h2 className="sr-only">Modelos que encajan</h2>
            <ul className="tienda__grid guiaq__grid">
              {resultados.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <ProductCard producto={p} medidasFiltro={medida ? [medida] : []} />
                </li>
              ))}
            </ul>
            {(resultados.length > 6 || hayCriterios) && (
              <div className="tienda__mas">
                <Button asChild variant="brand-secondary" size="pill">
                  <Link
                    href={{
                      pathname: "/colchones/",
                      query: {
                        ...(firmeza ? { firmeza } : firmezasSugeridas.length ? { firmeza: firmezasSugeridas.join(",") } : {}),
                        ...(medida ? { medida } : {}),
                        ...(tope < MAX ? { max: String(tope) } : {}),
                      },
                    }}
                  >
                    <ButtonLabel>Ver {resultados.length > 6 ? `los ${resultados.length}` : "en la tienda"} con estos filtros</ButtonLabel>
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
