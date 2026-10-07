"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DEMO } from "@/data/comercial";

const CLAVE = "almara:demo-oculto";

/**
 * La única franja de demostración del sitio. Va fija abajo para no mover la cabecera ni el
 * layout, se puede cerrar y recuerda el cierre durante la sesión. Sustituye a los avisos que
 * antes se repetían en hero, promesas, FAQ, contacto, ficha, carrito, checkout y pie.
 */
export default function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!DEMO) return;
    try {
      setVisible(sessionStorage.getItem(CLAVE) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!DEMO || !visible) return null;

  const cerrar = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(CLAVE, "1");
    } catch {}
  };

  return (
    <aside className="demo-banner" aria-label="Aviso de demostración">
      <p>Sitio de demostración. Las compras no se procesan.</p>
      <button type="button" className="demo-banner__cerrar" onClick={cerrar} aria-label="Ocultar el aviso">
        <X size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </aside>
  );
}
