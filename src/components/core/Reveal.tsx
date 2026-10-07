import type { ReactNode, ElementType, CSSProperties } from "react";
import { lineaDe } from "@/lib/revela";
import { MOVE, START, STAGGER } from "@/lib/motion";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Anima los hijos directos con stagger en vez del contenedor. */
  stagger?: number | true;
  delay?: number;
  y?: number;
  start?: string;
  /**
   * "scroll": al entrar en pantalla (styles/revela.css + lib/revela.ts).
   * "intro": entrada del hero en CSS puro, desde el primer pintado y sin esperar a que cargue el
   * JavaScript (ver styles/intro.css). Misma curva y mismos tiempos.
   */
  trigger?: "scroll" | "intro";
  style?: CSSProperties;
  id?: string;
  "aria-label"?: string;
};

/**
 * Revelado base: opacidad + translateY con frenado largo.
 *
 * Solo pinta marcas y variables; el estado inicial lo pone el CSS bajo `html.revela`, así que sin
 * JS (o con reduced motion) el contenido queda visible y legible.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  stagger,
  delay = 0,
  y: yPedido,
  start = START,
  trigger = "scroll",
  style,
  id,
  ...rest
}: Props) {
  const step = stagger === true ? STAGGER : (stagger ?? 0);
  // Los recorridos explícitos de cada sección se suavizan con el mismo factor; el de
  // serie (MOVE.y) ya viene suave. `y={0}` sigue siendo solo fundido.
  const recorrido = yPedido === undefined ? MOVE.y : yPedido * MOVE.suavidad;
  const intro = trigger === "intro";
  const escalonado = stagger !== undefined;

  const clases = intro
    ? `${className} intro-reveal${escalonado ? " intro-reveal--stagger" : ""}${
        // Sin recorrido: solo fundido, sin tocar `transform` (el pie de foto vertical va rotado).
        recorrido === 0 ? " intro-reveal--fundido" : ""
      }`
    : `${className} revela${escalonado ? " revela--stagger" : ""}`;
  const estilo = { ...style, "--d": `${delay}s`, "--st": `${step}s`, "--y": `${recorrido}px` } as CSSProperties;

  return (
    <Tag
      className={clases.trim()}
      style={estilo}
      id={id}
      data-revela={intro ? undefined : lineaDe(start)}
      // El revelador puede marcar `data-visto` antes de que React hidrate: no es un desajuste.
      suppressHydrationWarning={intro ? undefined : true}
      {...rest}
    >
      {children}
    </Tag>
  );
}
