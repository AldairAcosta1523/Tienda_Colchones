import type { Metadata } from "next";
import CheckoutClient from "@/components/shop/CheckoutClient";
import { checkout } from "@/data/tienda";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = {
  ...metaPagina({ ruta: "/checkout/", titulo: "Finalizar compra", descripcion: "Completa tus datos de entrega para preparar el pedido." }),
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="checkout" data-nav-theme="light">
      <div className="container">
        <h1 className="h2 checkout__titulo">{checkout.titulo}</h1>
        <p className="checkout__intro lead">{checkout.intro}</p>
        <CheckoutClient />
      </div>
    </section>
  );
}
