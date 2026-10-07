import type { MetadataRoute } from "next";
import { productos } from "@/data/catalog";
import { listaPoliticas } from "@/data/tienda";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const fija = (ruta: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${ruta}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  });

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    fija("/tienda/", 0.9),
    fija("/colchones/", 0.9),
    fija("/guia/", 0.6),
    ...productos.map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    fija("/nosotros/", 0.5),
    fija("/faq/", 0.5),
    fija("/contacto/", 0.5),
    ...listaPoliticas.map((p) => fija(`/politicas/${p.slug}/`, 0.3)),
  ];
}
