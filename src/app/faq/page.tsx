import type { Metadata } from "next";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import { faq } from "@/data/content";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = metaPagina({
  ruta: "/faq/",
  titulo: "Preguntas frecuentes",
  descripcion:
    "Firmeza, medidas, cuidados y condiciones de compra: lo que conviene saber antes de elegir colchón.",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.items.map((i) => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: { "@type": "Answer", text: i.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Faq comoTitulo1 />
      <FinalCta
        eyebrow="Contacto"
        headline={["¿Sigues con", "dudas sobre", "la firmeza?"]}
        sub="Cuéntanos cómo duermes y te decimos qué construcción se acerca más."
        primary={{ label: "Escríbenos", href: "/contacto/" }}
        secondary={{ label: "Ver la tienda", href: "/tienda/" }}
      />
    </>
  );
}
