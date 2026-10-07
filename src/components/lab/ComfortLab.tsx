"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { alAcercarse, MQ } from "@/lib/gsap";
import { lab } from "@/data/content";
import Reveal from "@/components/core/Reveal";
import SplitLines from "@/components/core/SplitLines";
import Eyebrow from "@/components/core/Eyebrow";
import type { HotspotFrame, HotspotId, MattressScene, ViewId } from "./mattressScene";
import { QUALITY } from "@/lib/imagen";
import { esperarScrollQuieto } from "@/lib/scrollQuieto";

/**
 * Almara Comfort Lab: colchón 3D explorable.
 *
 * - Three.js se importa de forma diferida cuando la sección se acerca al viewport: no pesa en la
 *   carga inicial ni bloquea el primer render.
 * - El bucle de render solo corre con la sección en pantalla.
 * - Sin WebGL se muestra una fotografía y el panel de información sigue funcionando.
 * - Los hotspots son botones reales del DOM colocados sobre el canvas: foco, teclado y lector
 *   de pantalla funcionan igual que en el resto de la página.
 */
export default function ComfortLab() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<MattressScene | null>(null);
  const entranceRef = useRef(0);
  const hotspotRefs = useRef<Partial<Record<HotspotId, HTMLButtonElement | null>>>({});

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ViewId | null>("perspective");
  const [active, setActive] = useState<HotspotId>("confort");
  const [exploded, setExploded] = useState(false);
  const [interacted, setInteracted] = useState(false);

  /* Carga diferida de la escena + pausa fuera de pantalla. */
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let cancelled = false;
    let visible = false;

    const near = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || sceneRef.current || cancelled) return;
        near.disconnect();
        // Evaluar three.js cuesta ~170 ms de hilo principal: también espera a una pausa del
        // scroll (y a un hueco libre) para no dar un tirón al acercarse a la sección.
        await esperarScrollQuieto(180, 4000);
        await new Promise<void>((r) =>
          "requestIdleCallback" in window ? requestIdleCallback(() => r(), { timeout: 800 }) : setTimeout(r, 0)
        );
        if (cancelled) return;
        const mod = await import("./mattressScene");
        if (cancelled) return;
        if (!mod.hasWebGL()) {
          setWebgl(false);
          return;
        }
        // Montar la escena es lo más caro de la página: se empieza cuando el scroll se detiene,
        // para que el trabajo caiga en una pausa y no en mitad de un desplazamiento.
        await esperarScrollQuieto();
        if (cancelled) return;
        try {
          const scene = await mod.createMattressScene({
            canvas,
            container: stage,
            reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            onFrame: placeHotspots,
            onInteract: () => setInteracted(true),
          });
          if (cancelled) {
            scene.dispose();
            return;
          }
          sceneRef.current = scene;
          scene.setEntrance(entranceRef.current);
          scene.setActive(visible);
          setWebgl(true);
          setReady(true);
        } catch {
          setWebgl(false);
        }
      },
      // Margen amplio: da tiempo a construir la escena en los huecos libres antes de llegar.
      { rootMargin: "1600px 0px" }
    );
    // Se observa la sección y no el visor: en móvil la sección va con content-visibility y lo de
    // dentro no tiene caja (ni avisa) hasta que está casi en pantalla.
    near.observe(sectionRef.current ?? stage);

    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sceneRef.current?.setActive(visible && !document.hidden);
    });
    onScreen.observe(stage);

    const onVisibility = () => sceneRef.current?.setActive(visible && !document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  /** Coloca los hotspots sin pasar por React: se llama en cada frame. */
  function placeHotspots(frames: HotspotFrame[]) {
    for (const f of frames) {
      const el = hotspotRefs.current[f.id];
      if (!el) continue;
      el.style.transform = `translate3d(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0)`;
      el.dataset.visible = f.visible ? "true" : "false";
      el.tabIndex = f.visible ? 0 : -1;
    }
  }

  /* Entrada coordinada con el scroll: el colchón sube y termina de girar al llegar. GSAP se carga
     cuando el visor se acerca, con margen de sobra antes de que empiece la entrada. */
  useEffect(() => {
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!stage || !section) return;
    if (!window.matchMedia(MQ.motion).matches) {
      entranceRef.current = 1;
      sceneRef.current?.setEntrance(1);
      return;
    }
    return alAcercarse(section, ({ ScrollTrigger }) => {
      ScrollTrigger.create({
        trigger: stage,
        start: "top 92%",
        end: "top 38%",
        scrub: true,
        onUpdate: (self) => {
          entranceRef.current = self.progress;
          sceneRef.current?.setEntrance(self.progress);
        },
      });
    });
  }, []);

  const chooseView = (id: ViewId) => {
    setView(id);
    setExploded(false);
    sceneRef.current?.setView(id);
    sceneRef.current?.setExplode(false);
    setInteracted(true);
  };
  const chooseHotspot = (id: HotspotId) => {
    setActive(id);
    setView(null);
    setExploded(id === "soporte");
    sceneRef.current?.focusHotspot(id);
    setInteracted(true);
  };
  const toggleExplode = () => {
    const next = !exploded;
    setExploded(next);
    sceneRef.current?.setExplode(next);
    setInteracted(true);
  };

  const girar = (dir: 1 | -1) => {
    setView(null);
    sceneRef.current?.rotateBy(dir * 0.6);
    setInteracted(true);
  };
  /** Flechas sobre el visor: el modelo también se gira sin ratón ni dedo. */
  const alTeclear = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    girar(e.key === "ArrowLeft" ? -1 : 1);
  };

  const current = lab.hotspots.find((h) => h.id === active)!;
  const activeIndex = lab.hotspots.findIndex((h) => h.id === active);
  const viewIndex = view ? lab.views.findIndex((v) => v.id === view) : -1;

  return (
    <section ref={sectionRef} className="lab" id="lab" data-nav-theme="light">
      <div className="container">
        <div className="lab__head">
          <div className="lab__titulo">
            <Reveal y={10}>
              <Eyebrow index="04">{lab.eyebrow}</Eyebrow>
            </Reveal>
            <SplitLines as="h2" className="display lab__title" lines={[lab.title[0], lab.title[1]]} />
          </div>
          <Reveal delay={0.12} y={0} className="lab__intro">
            <p className="lead">{lab.intro}</p>
          </Reveal>
        </div>

        <div className="lab__grid">
          <div className="lab__visor theme-dark">
            <div ref={stageRef} className={`lab__stage${ready ? " is-ready" : ""}`}>
              {webgl === false ? (
                <div className="lab__fallback">
                  <Image src={lab.fallback.image.src} alt={lab.fallback.image.alt} fill sizes="(max-width: 1023px) 100vw, 62vw" quality={QUALITY} />
                  <p className="lab__fallback-note">{lab.fallback.note}</p>
                </div>
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    className="lab__canvas"
                    data-cursor-label="Girar"
                    tabIndex={0}
                    onKeyDown={alTeclear}
                    aria-label="Modelo tridimensional de un colchón Almara. Arrastra o usa las flechas izquierda y derecha para girarlo; los controles de vista y los puntos de información están a continuación."
                  />
                  {!ready && (
                    <p className="lab__loading label" aria-live="polite">
                      <span className="lab__loading-bar" aria-hidden="true" />
                      Preparando el modelo
                    </p>
                  )}

                  <div className="lab__hotspots">
                    {lab.hotspots.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        ref={(el) => {
                          hotspotRefs.current[h.id] = el;
                        }}
                        className={`lab__hotspot${active === h.id ? " is-active" : ""}`}
                        data-visible="false"
                        aria-label={`${h.title}: ver detalle`}
                        aria-pressed={active === h.id}
                        onClick={() => chooseHotspot(h.id)}
                      >
                        <span className="lab__hotspot-dot" aria-hidden="true">
                          {h.n}
                        </span>
                        <span className="lab__hotspot-label" aria-hidden="true">
                          {h.title}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="lab__marca label" aria-hidden="true">
                    Comfort Lab <span>Esquema orientativo</span>
                  </p>
                  <p className={`lab__hint label${interacted ? " is-hidden" : ""}`} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 9h14M5 5.5 1.5 9 5 12.5M13 5.5 16.5 9 13 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {lab.hint}
                  </p>
                </>
              )}
            </div>

            {webgl !== false && (
              <div className="lab__controls">
                <div className="lab__grupo">
                  <span className="label lab__grupo-label" id="lab-vistas">
                    Vista
                  </span>
                  <div
                    className="lab__segmentos"
                    role="group"
                    aria-labelledby="lab-vistas"
                    style={{ ["--i" as string]: Math.max(0, viewIndex), ["--n" as string]: lab.views.length }}
                    data-sin-vista={viewIndex < 0 ? "" : undefined}
                  >
                    <span className="lab__segmentos-marca" aria-hidden="true" />
                    {lab.views.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`lab__view${view === v.id ? " is-active" : ""}`}
                        aria-pressed={view === v.id}
                        disabled={!ready}
                        onClick={() => chooseView(v.id)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lab__grupo lab__grupo--giro">
                  <span className="label lab__grupo-label" id="lab-giro">
                    Girar
                  </span>
                  <div className="lab__giro" role="group" aria-labelledby="lab-giro">
                    <button type="button" className="lab__giro-btn" disabled={!ready} onClick={() => girar(-1)} aria-label="Girar a la izquierda">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M13 8H4M7.5 3.5 3 8l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" className="lab__giro-btn" disabled={!ready} onClick={() => girar(1)} aria-label="Girar a la derecha">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={`lab__capas${exploded ? " is-active" : ""}`}
                  role="switch"
                  aria-checked={exploded}
                  disabled={!ready}
                  onClick={toggleExplode}
                >
                  <span className="lab__capas-pista" aria-hidden="true">
                    <span />
                  </span>
                  <span className="lab__capas-texto">{exploded ? lab.explode.close : lab.explode.open}</span>
                </button>
              </div>
            )}
          </div>

          <div className="lab__panel">
            <p className="label lab__panel-cuenta num" aria-hidden="true">
              0{activeIndex + 1} <span>/ 0{lab.hotspots.length}</span>
            </p>
            <ul className="lab__list">
              {lab.hotspots.map((h) => (
                <li key={h.id} className={`lab__item${active === h.id ? " is-active" : ""}`}>
                  <button type="button" className="lab__item-btn" aria-expanded={active === h.id} onClick={() => chooseHotspot(h.id)}>
                    <span className="label lab__item-n">{h.n}</span>
                    <span className="lab__item-title">{h.title}</span>
                    <span className="lab__item-signo" aria-hidden="true" />
                  </button>
                  <div className="lab__item-body" aria-hidden={active !== h.id}>
                    <p>{h.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="sr-only" aria-live="polite">
              {current.title}: {current.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
