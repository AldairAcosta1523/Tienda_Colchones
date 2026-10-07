import Hero from "@/components/sections/Hero";
import Categorias from "@/components/sections/Categorias";
import Destacados from "@/components/sections/Destacados";
import Explorar from "@/components/sections/Explorar";
import ComfortLab from "@/components/lab/ComfortLab";
import CompletaTuCama from "@/components/sections/CompletaTuCama";
import Guide from "@/components/sections/Guide";
import Promesas from "@/components/sections/Promesas";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import { faq } from "@/data/content";

/**
 * Home.
 *
 * Presenta una empresa con catálogo y lleva al siguiente paso: qué categorías hay, una selección
 * de colchones como entrada, colecciones y medidas para explorar, cómo están hechos, qué completa
 * la cama, cómo elegir y con qué condiciones. No intenta mostrar todos los modelos: para eso
 * están /colchones/ y /tienda/. La cabecera, el pie y el carrito viven en el layout.
 */
const FAQ_HOME = faq.items.slice(3, 6);

export default function Page() {
  return (
    <>
      <Hero />
      <Categorias />
      <Destacados />
      <Explorar />
      <ComfortLab />
      <CompletaTuCama />
      <Guide />
      <Promesas />
      <Faq items={FAQ_HOME} />
      <FinalCta />
    </>
  );
}
