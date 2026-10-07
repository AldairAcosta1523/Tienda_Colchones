"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { servicios } from "@/data/comercial";
import { finalCta } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import { Arrow, ButtonLabel } from "@/components/core/CtaButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormState = { name: string; email: string; model: string; message: string };

/**
 * Formulario de consulta.
 *
 * Es una demostración: no existe backend, así que el mensaje se arma en el navegador
 * y se muestra tal cual, con la opción de copiarlo. Nunca se envía nada ni se simula un envío.
 */
export default function Consulta({ defaultModel = "" }: { defaultModel?: string }) {
  const [form, setForm] = useState<FormState>({ name: "", email: "", model: defaultModel, message: "" });
  const [built, setBuilt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set =
    (k: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCopied(false);
    setBuilt(
      [
        "Consulta para Almara",
        `Nombre: ${form.name}`,
        `Correo: ${form.email}`,
        `Modelo de interés: ${form.model || "Sin definir"}`,
        "",
        form.message,
      ].join("\n")
    );
  };

  const copy = async () => {
    if (!built) return;
    try {
      await navigator.clipboard.writeText(built);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="consulta" id="consulta" data-nav-theme="light">
      <div className="container consulta__grid">
        <div className="consulta__copy">
          <Reveal>
            <Eyebrow>Consulta</Eyebrow>
          </Reveal>
          <SplitLines as="h2" className="h2" lines={["Cuéntanos", <span className="accent" key="a">cómo duermes.</span>]} />
          <Reveal delay={0.2} className="consulta__text">
            <p className="lead">{finalCta.form.intro}</p>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="consulta__form-wrap">
          <form className="form" onSubmit={onSubmit}>
            <div className="form__head">
              <h3 className="h3">{finalCta.form.title}</h3>
              {!servicios.formulario.activo && <p className="form__note">{finalCta.form.sinEnvio}</p>}
            </div>

            <div className="form__row">
              <div className="field">
                <Label htmlFor="f-name">{finalCta.form.fields.name} *</Label>
                <Input id="f-name" required name="name" autoComplete="name" value={form.name} onChange={set("name")} />
              </div>
              <div className="field">
                <Label htmlFor="f-email">{finalCta.form.fields.email} *</Label>
                <Input id="f-email" required type="email" name="email" autoComplete="email" value={form.email} onChange={set("email")} />
              </div>
            </div>

            <div className="field">
              <Label htmlFor="f-model">{finalCta.form.fields.model}</Label>
              <Select name="model" value={form.model} onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}>
                <SelectTrigger id="f-model" aria-label={finalCta.form.fields.model}>
                  <SelectValue placeholder="Selecciona un modelo" />
                </SelectTrigger>
                <SelectContent className="select-almara" position="popper" sideOffset={6}>
                  {finalCta.form.modelOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="field">
              <Label htmlFor="f-message">{finalCta.form.fields.message} *</Label>
              <Textarea id="f-message" required name="message" value={form.message} onChange={set("message")} />
            </div>

            <Button type="submit" variant="brand" size="pill-lg" className="form__submit" data-cursor="link">
              <ButtonLabel>{finalCta.form.submit}</ButtonLabel>
              <Arrow />
            </Button>

            {built && (
              <div className="form__result" role="status" aria-live="polite">
                <p className="form__result-head label">Consulta preparada · no se ha enviado</p>
                <pre>{built}</pre>
                <div className="form__result-actions">
                  <Button type="button" variant="brand-secondary" size="pill" onClick={copy} data-cursor="link">
                    <ButtonLabel>{copied ? "Copiado" : "Copiar consulta"}</ButtonLabel>
                  </Button>
                </div>
              </div>
            )}

          </form>
        </Reveal>
      </div>
    </section>
  );
}
