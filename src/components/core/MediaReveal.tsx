"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import { alAcercarse, MQ } from "@/lib/gsap";
import { EASE, MOVE } from "@/lib/motion";
import { QUALITY, ampliarSizes } from "@/lib/imagen";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  /** Relación de aspecto del marco (`4 / 5`, `16 / 10`…). Si se omite, la define el CSS. */
  ratio?: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  /** Recorrido del parallax interno en % (0 lo desactiva). */
  parallax?: number;
  /**
   * "scroll": revela al entrar (styles/revela.css) · "none": sin entrada ·
   * "intro": entrada del hero en CSS puro, desde el primer pintado (ver styles/intro.css). La foto
   * no espera a que cargue el JavaScript para verse, que era lo que retrasaba el LCP.
   */
  trigger?: "scroll" | "intro" | "none";
  delay?: number;
  /** Contenido superpuesto (etiquetas, títulos). */
  children?: ReactNode;
  /** Posición del recorte dentro del marco. */
  position?: string;
};

/**
 * Fotografía con revelado de máscara + zoom-out de asentado + parallax interno.
 *
 * Tres capas separadas para que cada animación tenga su propio target y no compitan:
 *   .media        → clip-path (apertura, CSS)
 *   .media__inner → yPercent (parallax de scroll, GSAP)
 *   .media__img   → scale (asentado de entrada, CSS)
 */
export default function MediaReveal({
  src,
  alt,
  sizes,
  ratio,
  className = "",
  priority,
  quality = QUALITY,
  parallax: parallaxPedido,
  trigger = "scroll",
  delay = 0,
  children,
  position,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Sin valor: el de serie. Con valor explícito de la sección: suavizado con el factor común.
  const parallax = parallaxPedido === undefined ? MOVE.parallax : parallaxPedido * MOVE.suavidad;

  // Parallax interno: la fotografía se mueve unos píxeles dentro de su marco.
  // Solo en pantallas anchas: en móvil son nueve animaciones ligadas al scroll sobre
  // hardware más justo, el efecto casi no se aprecia y así GSAP ni se descarga.
  useEffect(() => {
    const el = ref.current;
    const inner = el?.querySelector<HTMLElement>(".media__inner");
    if (!el || !inner || parallax <= 0 || !window.matchMedia(MQ.wide).matches) return;
    return alAcercarse(el, ({ gsap }) => {
      gsap.fromTo(
        inner,
        { yPercent: -parallax },
        {
          yPercent: parallax,
          ease: EASE.scrub,
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });
  }, [parallax]);

  const modo = trigger === "intro" ? " intro-media" : trigger === "scroll" ? " revela-media" : "";

  return (
    <div
      ref={ref}
      className={`media${modo} ${className}`}
      style={
        {
          ...(ratio ? { "--ratio": ratio } : {}),
          ...(trigger !== "none" ? { "--d": `${delay}s` } : {}),
        } as React.CSSProperties
      }
      data-parallax={parallax > 0 ? "" : undefined}
      data-revela={trigger === "scroll" ? "95" : undefined}
      // El revelador puede marcar `data-visto` antes de que React hidrate: no es un desajuste.
      suppressHydrationWarning={trigger === "scroll" ? true : undefined}
    >
      <div className="media__inner">
        <Image
          src={src}
          alt={alt}
          fill
          // Con parallax la foto mide un 16 % más que el marco (ver .media[data-parallax]).
          sizes={parallax > 0 ? ampliarSizes(sizes, 1.2) : sizes}
          // Next 16 retiró `priority`: para la foto principal, carga inmediata y prioridad alta.
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          quality={quality}
          style={position ? { objectPosition: position } : undefined}
          // Sin ScrollTrigger.refresh() al cargar: con `fill` dentro de un marco de proporción fija,
          // la foto no mueve el layout, y el recálculo (≈100 ms de hilo principal) caía en mitad
          // del scroll cada vez que entraba una imagen nueva: eran los tirones al desplazarse.
        />
      </div>
      {children}
    </div>
  );
}
