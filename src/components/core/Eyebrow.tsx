import type { ReactNode } from "react";

/** Etiqueta de sección: índice de capítulo opcional, una línea corta y el texto. */
export default function Eyebrow({
  children,
  className = "",
  index,
}: {
  children: ReactNode;
  className?: string;
  index?: string;
}) {
  return (
    <p className={`eyebrow ${className}`}>
      {index && <span className="eyebrow__index">{index}</span>}
      <span className="eyebrow__dot" aria-hidden="true" />
      {children}
    </p>
  );
}
