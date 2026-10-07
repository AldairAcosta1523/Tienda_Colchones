"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Selector de cantidad sobre el Button de shadcn. El valor vive fuera; aquí solo se pulsa. */
export default function QuantityStepper({
  valor,
  max = 10,
  min = 1,
  etiqueta,
  onChange,
}: {
  valor: number;
  max?: number;
  min?: number;
  etiqueta: string;
  onChange: (n: number) => void;
}) {
  const tope = Math.min(max, 10);
  return (
    <div className="qty" role="group" aria-label={etiqueta}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="qty__btn"
        onClick={() => onChange(valor - 1)}
        disabled={valor <= min}
        aria-label="Quitar una unidad"
      >
        <Minus strokeWidth={1.8} aria-hidden="true" />
      </Button>
      <span className="qty__valor" aria-live="polite">
        {valor}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="qty__btn"
        onClick={() => onChange(valor + 1)}
        disabled={valor >= tope}
        aria-label="Añadir una unidad"
      >
        <Plus strokeWidth={1.8} aria-hidden="true" />
      </Button>
    </div>
  );
}
