/**
 * URLs públicas del sitio.
 *
 * - `SITE_URL`: dominio de producción. Es el que va en canonical, sitemap, robots y og:url,
 *   también desde un preview, para que Google y las redes siempre apunten a la versión buena.
 * - `ASSETS_URL`: despliegue actual. Sirve de base a las URL relativas de metadata
 *   (og:image, twitter:image), así un preview de Vercel enseña su propia imagen y no la de
 *   producción ni, sobre todo, una de localhost que ninguna red social puede descargar.
 *
 * Orden de prioridad: variable explícita → variables de sistema de Vercel → dominio de producción.
 * Solo `next dev` cae en localhost.
 */
const PRODUCCION = "https://demo-colchones.vercel.app";

const conProtocolo = (host?: string) => (host ? `https://${host.replace(/^https?:\/\//, "")}` : undefined);
const sinBarra = (url: string) => url.replace(/\/$/, "");

const esDev = process.env.NODE_ENV === "development";
const local = `http://localhost:${process.env.PORT || 3000}`;

export const SITE_URL = sinBarra(
  process.env.NEXT_PUBLIC_SITE_URL ||
    conProtocolo(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    (esDev ? local : PRODUCCION)
);

/** `true` en los despliegues de preview de Vercel: no se indexan. */
export const ES_PREVIEW = process.env.VERCEL_ENV === "preview";

export const ASSETS_URL = sinBarra(
  (ES_PREVIEW && (conProtocolo(process.env.VERCEL_BRANCH_URL) || conProtocolo(process.env.VERCEL_URL))) ||
    (esDev ? local : SITE_URL)
);
