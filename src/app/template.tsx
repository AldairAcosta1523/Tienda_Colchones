import { ViewTransition, type ReactNode } from "react";

/**
 * Transición entre páginas.
 *
 * Una plantilla (a diferencia del layout) se vuelve a montar en cada navegación, así que aquí
 * sí se disparan la entrada y la salida. React usa la View Transitions API del navegador: la
 * página que se va se desvanece y la nueva entra con un fundido corto (ver styles/transiciones.css).
 * Sin soporte en el navegador, la navegación funciona igual que antes, sin animar.
 *
 * `default="none"`: solo anima al cambiar de página, no en cada actualización de estado.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="pagina-entra" exit="pagina-sale" default="none">
      <div className="pagina">{children}</div>
    </ViewTransition>
  );
}
