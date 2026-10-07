"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { envio as condicionesEnvio, precio } from "@/data/catalog";
import { DEMO, puedeComprar } from "@/data/comercial";
import { useCarrito } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ButtonLabel } from "@/components/core/CtaButton";

type Campos = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  distrito: string;
  referencia: string;
  notas: string;
};

const VACIO: Campos = { nombre: "", email: "", telefono: "", direccion: "", distrito: "", referencia: "", notas: "" };

/**
 * Checkout.
 *
 * Valida de verdad y arma el pedido de verdad, pero **no cobra**: no hay pasarela conectada ni
 * servidor que reciba nada. Por eso no se pide ningún dato de tarjeta —sería enseñar a escribir
 * datos bancarios en una demo— y el resultado se llama "pedido preparado", nunca "confirmado".
 */
export default function CheckoutClient() {
  const { lineas, subtotal, envio, total, unidades, listo } = useCarrito();
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof Campos, string>>>({});
  const [pedido, setPedido] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const set = (k: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCampos((c) => ({ ...c, [k]: e.target.value }));
    setErrores((x) => ({ ...x, [k]: undefined }));
  };

  const validar = (): boolean => {
    const e: Partial<Record<keyof Campos, string>> = {};
    if (campos.nombre.trim().length < 3) e.nombre = "Escribe tu nombre y apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(campos.email.trim())) e.email = "Revisa el correo: falta un formato válido.";
    if (campos.telefono.replace(/\D/g, "").length < 9) e.telefono = "El teléfono necesita al menos 9 dígitos.";
    if (campos.direccion.trim().length < 6) e.direccion = "Indica calle y número.";
    if (campos.distrito.trim().length < 3) e.distrito = "Indica el distrito de entrega.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    setCopiado(false);
    if (!validar()) {
      // Lleva el foco al primer campo con problema, que es lo que espera quien usa teclado.
      const primero = document.querySelector<HTMLElement>("[data-error='true']");
      primero?.focus();
      return;
    }
    const resumen = [
      "VISTA PREVIA DEL PEDIDO — Almara (simulación, sin cobro)",
      "",
      `Cliente:   ${campos.nombre}`,
      `Correo:    ${campos.email}`,
      `Teléfono:  ${campos.telefono}`,
      `Entrega:   ${campos.direccion}, ${campos.distrito}`,
      campos.referencia ? `Referencia: ${campos.referencia}` : "",
      campos.notas ? `Notas:     ${campos.notas}` : "",
      "",
      "Artículos",
      ...lineas.map((l) => `  ${l.cantidad} × ${l.producto.nombre} (${l.variante.nombre}, ${l.variante.medida}, ${l.variante.sku}) — ${precio(l.importe)}`),
      "",
      `Subtotal:  ${precio(subtotal)}`,
      `Envío:     ${envio === 0 ? "Gratis" : precio(envio)}`,
      `Total:     ${precio(total)}`,
    ]
      .filter(Boolean)
      .join("\n");
    setPedido(resumen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copiar = async () => {
    if (!pedido) return;
    try {
      await navigator.clipboard.writeText(pedido);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  if (!listo) {
    return (
      <p className="carrito__cargando" role="status">
        Recuperando tu carrito…
      </p>
    );
  }

  if (pedido) {
    return (
      <div className="ckres">
        <p className="ckres__eyebrow label">Vista previa · pedido simulado, sin cobro</p>
        <h2 className="h2 ckres__titulo">Así quedaría tu pedido.</h2>
        <p className="ckres__intro">
          Los datos son válidos y el resumen está listo. En esta demostración el pedido no se envía ni se cobra: nada
          ha salido de tu navegador.
        </p>

        <pre className="ckres__pedido">{pedido}</pre>

        <div className="ckres__acciones">
          <Button type="button" variant="brand" size="pill" onClick={copiar}>
            <ButtonLabel>{copiado ? "Copiado" : "Copiar el pedido"}</ButtonLabel>
          </Button>
          <Button asChild variant="brand-secondary" size="pill">
            <Link href="/tienda/">
              <ButtonLabel>Volver a la tienda</ButtonLabel>
            </Link>
          </Button>
        </div>

      </div>
    );
  }

  if (!DEMO && !puedeComprar) {
    // Apagar la demostración no habilita cobros: sin pasarela y backend, la compra se cierra por
    // otro canal. Ver docs/INTEGRACIONES.md.
    return (
      <div className="carrito__vacio" role="status">
        <p className="carrito__vacio-titulo">El pago en línea no está disponible todavía</p>
        <p>Escríbenos y cerramos el pedido contigo.</p>
        <Link href="/contacto/" className="btn btn--primary">
          <ButtonLabel>Ir a contacto</ButtonLabel>
        </Link>
      </div>
    );
  }

  if (lineas.length === 0) {
    return (
      <div className="carrito__vacio">
        <p className="carrito__vacio-titulo">No hay nada que pagar todavía</p>
        <p>Añade algún producto al carrito y vuelve por aquí.</p>
        <Link href="/tienda/" className="btn btn--primary">
          <ButtonLabel>Ir a la tienda</ButtonLabel>
        </Link>
      </div>
    );
  }

  const campo = (
    k: keyof Campos,
    etiqueta: string,
    opciones: { tipo?: string; requerido?: boolean; autoComplete?: string; ancho?: "full" | "half"; area?: boolean } = {}
  ) => {
    const { tipo = "text", requerido = true, autoComplete, ancho = "full", area = false } = opciones;
    const error = errores[k];
    return (
      <div className={`ckfield ckfield--${ancho}${error ? " is-error" : ""}`}>
        <Label htmlFor={`ck-${k}`}>
          {etiqueta} {requerido && <span aria-hidden="true">*</span>}
        </Label>
        {area ? (
          <Textarea
            id={`ck-${k}`}
            name={k}
            value={campos[k]}
            onChange={set(k)}
            rows={3}
            data-error={!!error}
            aria-invalid={!!error}
            aria-describedby={error ? `ck-${k}-error` : undefined}
          />
        ) : (
          <Input
            id={`ck-${k}`}
            name={k}
            type={tipo}
            value={campos[k]}
            onChange={set(k)}
            autoComplete={autoComplete}
            data-error={!!error}
            aria-invalid={!!error}
            aria-describedby={error ? `ck-${k}-error` : undefined}
          />
        )}
        {error && (
          <p className="ckfield__error" id={`ck-${k}-error`} role="alert">
            <AlertCircle size={14} strokeWidth={1.8} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="checkout__layout">
      <form className="checkout__form" onSubmit={onSubmit} noValidate>
        <fieldset className="cksec">
          <legend className="cksec__titulo">
            <span className="cksec__n label">01</span> Contacto
          </legend>
          <div className="ckgrid">
            {campo("nombre", "Nombre y apellido", { autoComplete: "name" })}
            {campo("email", "Correo electrónico", { tipo: "email", autoComplete: "email", ancho: "half" })}
            {campo("telefono", "Teléfono", { tipo: "tel", autoComplete: "tel", ancho: "half" })}
          </div>
        </fieldset>

        <fieldset className="cksec">
          <legend className="cksec__titulo">
            <span className="cksec__n label">02</span> Entrega
          </legend>
          <p className="cksec__nota">
            Solo entregamos en {condicionesEnvio.zona}. Plazo estimado: {condicionesEnvio.plazo}.
          </p>
          <div className="ckgrid">
            {campo("direccion", "Dirección", { autoComplete: "street-address" })}
            {campo("distrito", "Distrito", { autoComplete: "address-level2", ancho: "half" })}
            {campo("referencia", "Referencia", { requerido: false, ancho: "half" })}
            {campo("notas", "Notas para la entrega", { requerido: false, area: true })}
          </div>
        </fieldset>

        <fieldset className="cksec">
          <legend className="cksec__titulo">
            <span className="cksec__n label">03</span> Pago
          </legend>
          <p className="cksec__nota">
            {DEMO
              ? "En esta demostración no se piden datos de pago. Al continuar verás una vista previa del pedido."
              : "El pago se confirma en el siguiente paso."}
          </p>
        </fieldset>

        <Button type="submit" variant="brand" size="pill" className="checkout__enviar">
          <ButtonLabel>{DEMO ? "Simular pedido" : "Continuar al pago"}</ButtonLabel>
        </Button>
        <p className="checkout__legal">
          {DEMO ? "Al continuar no se realiza ningún cargo. " : ""}Consulta la{" "}
          <Link href="/politicas/privacidad/" className="link-underline">
            política de privacidad
          </Link>
          .
        </p>
      </form>

      <Card asChild className="checkout__resumen">
        <aside aria-label="Resumen del pedido">
        <CardHeader className="carrito__resumen-head">
          <CardTitle className="carrito__resumen-titulo">Tu pedido</CardTitle>
        </CardHeader>
        <CardContent className="carrito__resumen-body">
        <ul className="ckresumen__lineas">
          {lineas.map((l) => (
            <li key={`${l.slug}-${l.varianteId}`}>
              <span className="ckresumen__cant">{l.cantidad}×</span>
              <span className="ckresumen__nombre">
                {l.producto.nombre}
                <span className="ckresumen__variante">{l.variante.nombre}</span>
              </span>
              <span className="ckresumen__importe">{precio(l.importe)}</span>
            </li>
          ))}
        </ul>
        <dl className="carrito__totales">
          <div>
            <dt>Subtotal · {unidades} art.</dt>
            <dd>{precio(subtotal)}</dd>
          </div>
          <div>
            <dt>Envío</dt>
            <dd>{envio === 0 ? "Gratis" : precio(envio)}</dd>
          </div>
          <Separator className="carrito__separador" />
          <div className="carrito__total">
            <dt>Total</dt>
            <dd>{precio(total)}</dd>
          </div>
        </dl>
        <Link href="/carrito/" className="carrito__seguir link-underline">
          Editar el carrito
        </Link>
        </CardContent>
        </aside>
      </Card>
    </div>
  );
}
