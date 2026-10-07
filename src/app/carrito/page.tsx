import type { Metadata } from "next";
import CartPage from "@/components/shop/CartPage";
import { metaPagina } from "@/lib/seo";

export const metadata: Metadata = metaPagina({
  ruta: "/carrito/",
  titulo: "Carrito",
  descripcion:
    "Revisa los productos que has añadido antes de finalizar la compra.", indexable: false,
});

export default function CarritoPage() {
  return (
    <section className="carrito" data-nav-theme="light">
      <div className="container">
        <h1 className="h2 carrito__titulo">Tu carrito</h1>
        <CartPage />
      </div>
    </section>
  );
}
