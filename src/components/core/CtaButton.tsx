"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { scrollToHash } from "@/lib/SmoothScroll";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "inverse";
  size?: "md" | "lg";
  external?: boolean;
  className?: string;
  arrow?: boolean;
  /** @deprecated El efecto magnético se retiró: dificultaba el clic sin aportar nada. */
  magnetic?: boolean;
};

const VARIANT = {
  primary: "brand",
  secondary: "brand-secondary",
  ghost: "brand-ghost",
  inverse: "brand-inverse",
} as const;

export function Arrow() {
  return (
    <svg className="btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Etiqueta con relevo: al hacer hover el texto sube dentro de una máscara y entra su copia.
 * Es CSS puro (transform + opacity), así que no depende de JS ni cuesta layout.
 */
export function ButtonLabel({ children }: { children: ReactNode }) {
  return (
    <span className="btn__label">
      <span className="btn__label-in">{children}</span>
      <span className="btn__label-in btn__label-in--alt" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

/** Anclas (#id) usan scroll suave; si el ancla no existe en la página actual, navega al home. */
export function onAnchorClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  e.preventDefault();
  if (document.querySelector(href)) {
    scrollToHash(href);
    history.replaceState(null, "", href);
  } else {
    window.location.assign(`/${href}`);
  }
}

/**
 * CTA de marca sobre el Button de shadcn/ui (variantes "brand-*"), renderizado como enlace.
 */
export default function CtaButton({
  href,
  children,
  variant = "primary",
  size = "md",
  external,
  className = "",
  arrow = true,
}: Props) {
  const inner = (
    <>
      <ButtonLabel>{children}</ButtonLabel>
      {arrow && <Arrow />}
    </>
  );

  const isInternal = href.startsWith("/") && !external;
  return (
    <Button asChild variant={VARIANT[variant]} size={size === "lg" ? "pill-lg" : "pill"} className={className}>
      {isInternal ? (
        <Link href={href} data-cursor="link">
          {inner}
        </Link>
      ) : (
        <a
          href={href}
          onClick={(e) => onAnchorClick(e, href)}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          data-cursor="link"
        >
          {inner}
        </a>
      )}
    </Button>
  );
}
