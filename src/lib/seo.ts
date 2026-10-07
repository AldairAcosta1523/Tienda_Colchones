import type { Metadata } from "next";
import { site } from "@/data/content";
import { SITE_URL } from "@/lib/site";

/**
 * Metadata de una página: canonical, Open Graph y Twitter con la misma URL y el mismo texto.
 *
 * Next reemplaza `openGraph` entero cuando una página declara el suyo (no lo fusiona con el del
 * layout), así que se construye completo aquí para no perder `siteName`, `locale` ni la imagen.
 * La imagen (`app/og.png/route.tsx`) va en ruta relativa: se resuelve contra `metadataBase`,
 * que es el despliegue actual.
 *
 * `ruta` es la ruta pública con barra final (el sitio usa `trailingSlash`), p. ej. `/tienda/`.
 */
/** Imagen para redes de todo el sitio (1200 × 630). */
export const IMAGEN_SOCIAL = { url: "/og.png", width: 1200, height: 630, alt: `${site.name} · ${site.tagline}` };

export function metaPagina({
  ruta,
  titulo,
  descripcion,
  indexable = true,
}: {
  ruta: string;
  /** Título corto; el layout añade « | Almara». */
  titulo?: string;
  descripcion: string;
  indexable?: boolean;
}): Metadata {
  const url = `${SITE_URL}${ruta}`;
  const tituloSocial = titulo ? `${titulo} | ${site.name}` : site.title;
  const imagen = IMAGEN_SOCIAL;
  return {
    ...(titulo ? { title: titulo } : {}),
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_PE",
      siteName: site.name,
      title: tituloSocial,
      description: descripcion,
      url,
      images: [imagen],
    },
    twitter: { card: "summary_large_image", title: tituloSocial, description: descripcion, images: [imagen.url] },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
  };
}
