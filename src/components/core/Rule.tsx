import type { CSSProperties } from "react";

/**
 * Línea divisoria que se dibuja al entrar en pantalla (styles/revela.css).
 *
 * Es el separador editorial del sistema: sustituye a los `border-top` estáticos
 * en las secciones donde la lista se revela en secuencia.
 */
export default function Rule({
  className = "",
  delay = 0,
  light = false,
}: {
  className?: string;
  delay?: number;
  light?: boolean;
}) {
  return (
    <span
      className={`rule revela-regla ${light ? "rule--light" : ""} ${className}`}
      style={{ "--d": `${delay}s` } as CSSProperties}
      data-revela="92"
      // El revelador puede marcar `data-visto` antes de que React hidrate: no es un desajuste.
      suppressHydrationWarning
      aria-hidden="true"
    />
  );
}
