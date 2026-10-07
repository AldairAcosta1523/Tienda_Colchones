/**
 * Escala de firmeza: la etiqueta del catálogo colocada sobre un eje suave → firme.
 *
 * No añade datos: solo traduce a posición las cuatro etiquetas que ya existen en el catálogo.
 * Si apareciera una etiqueta desconocida, no se dibuja marcador en lugar de inventar un nivel.
 */
const NIVEL: Record<string, number> = {
  suave: 1,
  "suave-envolvente": 1,
  "media-suave": 2,
  media: 3,
  "media-firme": 4,
  firme: 5,
};

export default function Firmeza({ valor, className = "" }: { valor: string; className?: string }) {
  const nivel = NIVEL[valor.toLowerCase()];
  return (
    <div
      className={`firmeza ${className}`}
      role="img"
      aria-label={
        nivel ? `Firmeza ${valor.toLowerCase()}: nivel ${nivel} de 5, de suave a firme` : `Firmeza ${valor.toLowerCase()}`
      }
    >
      <div className="firmeza__eje" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`firmeza__paso${n === nivel ? " is-activo" : ""}`} />
        ))}
      </div>
      <div className="firmeza__extremos" aria-hidden="true">
        <span>Suave</span>
        <span>Firme</span>
      </div>
    </div>
  );
}
