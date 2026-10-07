import type { ReactNode, ElementType, CSSProperties } from "react";
import { lineaDe } from "@/lib/revela";
import { STAGGER } from "@/lib/motion";

type Props = {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  lineClassName?: string;
  /**
   * "scroll": anima al entrar en viewport (styles/revela.css) ·
   * "intro": entrada del hero en CSS puro, desde el primer pintado (ver styles/intro.css).
   */
  trigger?: "scroll" | "intro";
  delay?: number;
  stagger?: number;
  start?: string;
  id?: string;
};

/**
 * Headline editorial dividido en líneas. Cada línea vive en un contenedor con overflow hidden
 * y entra con translateY (mask reveal). Sin rotación: el titular sube recto, como una página.
 */
export default function SplitLines({
  lines,
  as: Tag = "h2",
  className = "",
  lineClassName = "",
  trigger = "scroll",
  delay = 0,
  stagger = STAGGER,
  start = "top 82%",
  id,
}: Props) {
  const intro = trigger === "intro";

  return (
    <Tag
      className={`split ${intro ? "intro-split" : "revela-lineas"} ${className}`}
      style={{ "--d": `${delay}s`, "--st": `${stagger}s` } as CSSProperties}
      id={id}
      data-revela={intro ? undefined : lineaDe(start)}
      // El revelador puede marcar `data-visto` antes de que React hidrate: no es un desajuste.
      suppressHydrationWarning={intro ? undefined : true}
    >
      {lines.map((line, i) => (
        <span className={`split-line ${lineClassName}`} key={i}>
          <span className="split-line__inner" style={{ "--i": i } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
