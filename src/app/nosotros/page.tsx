import type { Metadata } from "next";
import About from "@/components/sections/About";
import Comfort from "@/components/sections/Comfort";
import FinalCta from "@/components/sections/FinalCta";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = metaPagina({
  ruta: "/nosotros/",
  titulo: "Nosotros",
  descripcion:
    "Almara trabaja con pocas referencias y las explica bien: tres construcciones, tres sensaciones y un lenguaje claro sobre firmeza, materiales y medidas.",
});

export default function NosotrosPage() {
  return (
    <>
      <About />
      <Comfort />
      <FinalCta
        eyebrow="La tienda"
        headline={["Empieza por", "el colchón,", "sigue por la cama."]}
        sub="Elige el colchón y completa la cama con base, almohada y ropa de cama."
        primary={{ label: "Ver la tienda", href: "/tienda/" }}
        secondary={{ label: "Escríbenos", href: "/contacto/" }}
      />
    </>
  );
}
