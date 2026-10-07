import { MessageCircle } from "lucide-react";
import { enlaceWhatsApp } from "@/data/comercial";

/**
 * Enlace a WhatsApp con mensaje contextual. No renderiza nada mientras no haya un número
 * confirmado en `contacto.whatsapp`: así el canal aparece en cabecera, ficha y contacto el día
 * que exista, sin tocar los componentes.
 */
export default function WhatsApp({
  mensaje,
  children = "Escríbenos por WhatsApp",
  className = "",
}: {
  mensaje: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const href = enlaceWhatsApp(mensaje);
  if (!href) return null;
  return (
    <a href={href} className={`whatsapp ${className}`} target="_blank" rel="noopener noreferrer">
      <MessageCircle size={16} strokeWidth={1.7} aria-hidden="true" />
      <span>{children}</span>
    </a>
  );
}
