import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/shop/ProductDetail";
import LabResumen from "@/components/lab/LabResumen";
import Fit from "@/components/shop/Fit";
import { categoriaPorId, precio, precioDesde, productoPorSlug, productos } from "@/data/catalog";
import { getModelPage } from "@/data/models";
import { SITE_URL } from "@/lib/site";
import { metaPagina } from "@/lib/seo";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return productos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = productoPorSlug(slug);
  if (!p) return {};
  return metaPagina({
    ruta: `/producto/${p.slug}/`,
    titulo: p.nombre,
    descripcion: `${p.resumen}. ${p.descripcion}`,
  });
}

export default async function ProductoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const producto = productoPorSlug(slug);
  if (!producto) notFound();

  // Contenido editorial extendido: solo existe para los modelos con ficha redactada.
  const editorial = getModelPage(slug);
  const esColchon = producto.categoria === "colchones";

  // Complementos compatibles: comparten al menos una medida con el producto (una base King para un
  // colchón King); si no hay coincidencia de medida, se completa con otras categorías.
  const medidasDelProducto = new Set(producto.variantes.map((v) => v.nombre));
  const otras = productos.filter((p) => p.categoria !== producto.categoria);
  const compatibles = otras.filter((p) => p.variantes.some((v) => medidasDelProducto.has(v.nombre)));
  const relacionados = [...compatibles, ...otras.filter((p) => !compatibles.includes(p))].slice(0, 3);

  /* JSON-LD: se declara el producto con su rango de precios porque aquí sí hay un catálogo
     con precios y disponibilidad definidos. Se marca como datos de demostración en la web. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion,
    category: categoriaPorId(producto.categoria).nombre,
    url: `${SITE_URL}/producto/${producto.slug}/`,
    image: `${SITE_URL}${producto.imagen.src}`,
    brand: { "@type": "Brand", name: "Almara" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PEN",
      lowPrice: precioDesde(producto),
      highPrice: Math.max(...producto.variantes.map((v) => v.precio)),
      offerCount: producto.variantes.length,
      availability: producto.variantes.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  // Migas de pan para Google: las mismas que se ven en la ficha.
  const migas = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Tienda", item: `${SITE_URL}/tienda/` },
      { "@type": "ListItem", position: 3, name: producto.nombre, item: `${SITE_URL}/producto/${producto.slug}/` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, migas]) }} />
      <ProductDetail producto={producto} editorial={editorial} relacionados={relacionados} />
      {esColchon && editorial && <Fit editorial={editorial} />}
      {esColchon && <LabResumen />}
      <p className="sr-only">Precio desde {precio(precioDesde(producto))}.</p>
    </>
  );
}
