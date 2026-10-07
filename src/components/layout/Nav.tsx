"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, Search, ShoppingBag } from "lucide-react";
import { categorias, colecciones, colchonesDeColeccion, medidasDisponibles, precio, precioEnMedida, productos, productosDeCategoria } from "@/data/catalog";
import { useFavoritos } from "@/lib/listas";
import { contact } from "@/data/content";
import { useCarrito } from "@/lib/cart";
import { QUALITY } from "@/lib/imagen";
import Wordmark from "@/components/core/Wordmark";
import { scrollToHash } from "@/lib/SmoothScroll";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMedia } from "@/lib/useMedia";
import { hayConsulta } from "@/lib/busqueda";
import BuscadorPredictivo from "./BuscadorPredictivo";

const ENLACES = [
  { label: "Tienda", href: "/tienda/" },
  { label: "Guía", href: "/guia/" },
  { label: "Nosotros", href: "/nosotros/" },
  { label: "Contacto", href: "/contacto/" },
];

/** El megamenú se arma desde el catálogo: colecciones y medidas con sus cuentas. */
const COLCHONES = productosDeCategoria("colchones");
const MEDIDAS_NAV = medidasDisponibles(COLCHONES);

export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const ddBtn = useRef<HTMLAnchorElement>(null);
  const buscarBtn = useRef<HTMLButtonElement>(null);
  // Escape devuelve el foco a «Colchones»; ese foco no debe volver a abrir el panel.
  const escCerro = useRef(false);
  const pathname = usePathname();
  const esHome = pathname === "/";
  const { unidades, abrir, listo } = useCarrito();
  const favoritos = useFavoritos();

  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Mismo corte que shop.css y components.css: por debajo, la banda no existe y se busca en el menú.
  const esMovil = useMedia("(max-width: 1023px)");
  // Si la ventana pasa a ancho móvil con la banda abierta, la banda (oculta por CSS) se cierra y el
  // foco vuelve al botón: si no, la cabecera quedaba en modo búsqueda y el foco caía al <body>.
  useEffect(() => {
    if (!esMovil) return;
    setBuscando((abierta) => {
      if (abierta && document.activeElement?.closest(".nav__buscador")) buscarBtn.current?.focus();
      return false;
    });
  }, [esMovil]);
  // En el menú móvil, con algo escrito los resultados sustituyen a los enlaces. `visto`: al borrar
  // la búsqueda, los enlaces vuelven sin repetir la entrada escalonada.
  const enBusqueda = hayConsulta(consulta);
  const [visto, setVisto] = useState(false);
  if (open && enBusqueda && !visto) setVisto(true);
  if (!open && visto) setVisto(false);

  // La barra solo puede ser transparente sobre un hero; en el resto de rutas va sólida.
  const sobreHero = esHome;

  // Barra sólida al bajar y escondida mientras se baja: un listener pasivo agrupado por fotograma.
  // Antes era un ScrollTrigger más uno por sección con tema, y obligaban a cargar GSAP al arrancar.
  // La entrada de los grupos (.nav__enter) es CSS (styles/intro.css).
  useEffect(() => {
    let last = window.scrollY;
    let wasScrolled = false;
    let wasHidden = false;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const y = window.scrollY;
      const isScrolled = y > 24;
      if (isScrolled !== wasScrolled) {
        wasScrolled = isScrolled;
        setScrolled(isScrolled);
      }
      const ocultar = (isHidden: boolean) => {
        if (isHidden === wasHidden) return;
        wasHidden = isHidden;
        setHidden(isHidden);
        if (isHidden) setMega(false);
      };
      const dy = y - last;
      if (y <= 160) {
        ocultar(false);
        last = y;
      } else if (Math.abs(dy) >= 4) {
        // Solo cuenta el movimiento real: Lenis desplaza dentro de su propio fotograma y el último
        // evento de cada deslizamiento repite la misma y; antes eso contaba como «subir» y la
        // cabecera reaparecía mientras se bajaba.
        ocultar(dy > 0);
        last = y;
      }
    };
    const alScroll = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Tema claro/oscuro: el de la sección que pasa por debajo de la barra. El observador mira una
  // franja de 1 px a 70 px del borde superior (lo que antes eran los ScrollTrigger «top 70px»).
  useEffect(() => {
    const secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-theme]"));
    let io: IntersectionObserver | undefined;
    let t = 0;
    const observar = () => {
      io?.disconnect();
      io = new IntersectionObserver(
        (entradas) => {
          for (const e of entradas) {
            if (e.isIntersecting) setTheme((e.target as HTMLElement).dataset.navTheme === "dark" ? "dark" : "light");
          }
        },
        { rootMargin: `-70px 0px -${Math.max(0, window.innerHeight - 71)}px 0px` }
      );
      secciones.forEach((s) => io!.observe(s));
    };
    // La franja depende del alto de la ventana: se rehace al cambiarlo (con pausa, que en móvil la
    // barra del navegador cambia el alto a cada rato).
    const alRedimensionar = () => {
      window.clearTimeout(t);
      t = window.setTimeout(observar, 150);
    };
    observar();
    window.addEventListener("resize", alRedimensionar);
    return () => {
      window.removeEventListener("resize", alRedimensionar);
      window.clearTimeout(t);
      io?.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
  }, [open]);

  // Al cambiar de ruta se cierra todo lo que estuviera desplegado.
  useEffect(() => {
    setOpen(false);
    setMega(false);
    setBuscando(false);
  }, [pathname]);

  const megaEnter = () => {
    // Con la banda de búsqueda abierta el megamenú no se despliega: quedaba debajo de ella.
    if (buscando) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setMega(true);
  };
  const megaLeave = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMega(false), 140);
  };

  /** Anclas de la home: scroll suave si existe, si no navegación normal. */
  const irAncla = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setOpen(false);
    if (!document.querySelector(href)) {
      window.location.assign(`/${href}`);
      return;
    }
    setTimeout(() => scrollToHash(href), open ? 120 : 0);
    history.replaceState(null, "", href);
  };

  const cls = [
    "nav",
    `nav--${theme}`,
    !sobreHero && "nav--solida",
    open && "is-open",
    scrolled && "is-scrolled",
    hidden && !open && "is-hidden",
    mega && "is-mega-open",
    buscando && "is-buscando",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header
      ref={ref}
      className={cls}
      onMouseLeave={megaLeave}
      // Teclado: el panel se cierra al salir el foco de la cabecera o con Escape (WCAG 1.4.13,
      // 2.4.11): antes se quedaba abierto tapando la página por la que seguía el foco.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && !e.currentTarget.matches(":hover")) setMega(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !mega) return;
        setMega(false);
        if (document.activeElement !== ddBtn.current) {
          escCerro.current = true;
          ddBtn.current?.focus();
        }
      }}
      style={{ viewTransitionName: "cabecera" }}
    >
      <div className="nav__bar">
        <nav className="nav__links" aria-label="Principal">
          <div className="nav__dd nav__enter" onMouseEnter={megaEnter}>
            <Link
              href="/colchones/"
              className="nav__link nav__dd-btn"
              aria-expanded={mega}
              ref={ddBtn}
              onFocus={() => {
                if (escCerro.current) {
                  escCerro.current = false;
                  return;
                }
                megaEnter();
              }}
            >
              <span className="link-underline">Colchones</span>
              <ChevronDown className="nav__dd-caret" size={12} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>

          {ENLACES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav__link nav__enter"
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <span className="link-underline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link href="/" className="nav__logo nav__enter" aria-label="Almara, ir al inicio">
          <Wordmark />
        </Link>

        <div className="nav__acciones nav__enter">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="nav__icono"
            ref={buscarBtn}
            // En móvil la banda no existe: la lupa abre el menú, que ya enfoca su buscador.
            onClick={() => {
              if (esMovil) {
                setOpen(true);
                return;
              }
              setMega(false);
              setBuscando((v) => !v);
            }}
            aria-expanded={esMovil ? open : buscando}
            aria-controls={esMovil ? "mobile-menu" : buscando ? "buscador-cabecera" : undefined}
            aria-label="Buscar productos"
          >
            <Search className="nav__icono-svg" size={18} strokeWidth={1.6} aria-hidden="true" />
            <span className="nav__icono-texto link-underline" aria-hidden="true">
              Buscar
            </span>
          </Button>
          <Button asChild variant="ghost" size="icon" className="nav__icono nav__favoritos">
            <Link href="/favoritos/">
              <Heart className="nav__icono-svg" size={18} strokeWidth={1.6} aria-hidden="true" />
              <span className="sr-only">Favoritos{favoritos.listo && favoritos.slugs.length ? `, ${favoritos.slugs.length} guardados` : ""}</span>
              <span className="nav__icono-texto link-underline" aria-hidden="true">
                Favoritos
              </span>
              <Badge className={`nav__cuenta${favoritos.listo && favoritos.slugs.length > 0 ? " is-lleno" : ""}`} aria-hidden="true">
                {favoritos.listo ? favoritos.slugs.length : 0}
              </Badge>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="nav__icono nav__carrito"
            onClick={abrir}
            aria-label={`Abrir el carrito${listo && unidades ? `, ${unidades} artículos` : ""}`}
          >
            <ShoppingBag className="nav__icono-svg" size={18} strokeWidth={1.6} aria-hidden="true" />
            <span className="nav__icono-texto link-underline" aria-hidden="true">
              Carrito
            </span>
            <Badge className={`nav__cuenta${listo && unidades > 0 ? " is-lleno" : ""}`} aria-hidden="true">
              {listo ? unidades : 0}
            </Badge>
          </Button>
          <button
            className="nav__burger"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Buscador desplegable */}
      {buscando && (
        <div className="nav__buscador" id="buscador-cabecera">
          <BuscadorPredictivo
            variante="cabecera"
            valor={consulta}
            onValor={setConsulta}
            autoFocus
            placeholder="Buscar colchones, almohadas, lino…"
            className="container nav__buscador-inner"
            onNavegar={() => {
              setBuscando(false);
              setOpen(false);
            }}
            onSalir={() => {
              setBuscando(false);
              buscarBtn.current?.focus();
            }}
          />
        </div>
      )}

      {/* Megamenú de categorías */}
      <div className={`mega${mega ? " is-open" : ""}`} onMouseEnter={megaEnter} aria-hidden={!mega}>
        <div className="container mega__grid">
          <div className="mega__col">
            <h2 className="label mega__titulo">Colecciones</h2>
            <ul className="mega__lista">
              {colecciones.map((c) => {
                const lista = colchonesDeColeccion(c.id);
                const desde = Math.min(...lista.flatMap((p) => p.variantes.map((v) => v.precio)));
                return (
                  <li key={c.id}>
                    <Link href={`/colchones/?coleccion=${c.id}`} className="mega__producto" tabIndex={mega ? 0 : -1}>
                      <span className="mega__producto-nombre">{c.nombre}</span>
                      <span className="mega__producto-nota">{lista.length} modelos</span>
                      <span className="mega__producto-precio">desde {precio(desde)}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/colchones/" className="mega__producto mega__producto--todos" tabIndex={mega ? 0 : -1}>
                  <span className="mega__producto-nombre">Todos los colchones</span>
                  <span className="mega__producto-nota">{COLCHONES.length} modelos</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="mega__col">
            <h2 className="label mega__titulo">Por medida</h2>
            <ul className="mega__lista mega__lista--medidas">
              {MEDIDAS_NAV.map((m) => {
                const n = COLCHONES.filter((p) => precioEnMedida(p, m) !== null).length;
                return (
                  <li key={m}>
                    <Link href={`/colchones/?medida=${encodeURIComponent(m)}`} className="mega__categoria" tabIndex={mega ? 0 : -1}>
                      <span className="mega__categoria-nombre">{m}</span>
                      <span className="mega__categoria-nota">{n} modelos</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mega__col">
            <h2 className="label mega__titulo">Completa tu cama</h2>
            <ul className="mega__lista">
              {categorias
                .filter((c) => c.id !== "colchones")
                .map((c) => (
                  <li key={c.id}>
                    <Link href={`/tienda/?categoria=${c.id}`} className="mega__categoria" tabIndex={mega ? 0 : -1}>
                      <span className="mega__categoria-nombre">{c.nombre}</span>
                      <span className="mega__categoria-nota">{c.resumen}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <Link href="/tienda/" className="mega__todo" tabIndex={mega ? 0 : -1}>
            {/* La foto del hero: mismo dormitorio que la portada, así el menú no introduce otro ambiente. */}
            <Image
              src="/images/hero-dormitorio.jpg"
              alt=""
              fill
              sizes="(max-width: 1023px) 0px, 24vw"
              quality={QUALITY}
              className="mega__todo-foto"
            />
            <span className="mega__todo-copy">
              <span className="mega__todo-texto">Ver toda la tienda</span>
              <span className="mega__todo-nota">{productos.length} productos</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Menú móvil */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent id="mobile-menu" side="top" className="nav__menu">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">Navegación principal de Almara</SheetDescription>
          <div className={`nav__menu-inner${enBusqueda ? " is-buscando" : ""}`} data-lenis-prevent data-visto={visto || undefined}>
            <BuscadorPredictivo
              variante="menu"
              valor={consulta}
              onValor={setConsulta}
              placeholder="Buscar productos"
              className="nav__menu-buscar"
              onNavegar={() => {
                setOpen(false);
                setConsulta("");
              }}
            />

            {!enBusqueda && (
              <>
                <p className="label nav__menu-label" style={{ ["--d" as string]: "60ms" }}>
                  Colchones
                </p>
                <Link href="/colchones/" className="nav__menu-link nav__menu-link--model" style={{ ["--d" as string]: "100ms" }}>
                  <span className="nav__menu-index">01</span>
                  Todos los colchones
                  <span className="nav__menu-nota">{COLCHONES.length}</span>
                </Link>
                {colecciones.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/colchones/?coleccion=${c.id}`}
                    className="nav__menu-link nav__menu-link--model"
                    style={{ ["--d" as string]: `${145 + i * 45}ms` }}
                  >
                    <span className="nav__menu-index">0{i + 2}</span>
                    {c.nombre}
                    <span className="nav__menu-nota">{colchonesDeColeccion(c.id).length}</span>
                  </Link>
                ))}

                <p className="label nav__menu-label" style={{ ["--d" as string]: "250ms" }}>
                  Tienda
                </p>
                {categorias
                  .filter((c) => c.id !== "colchones")
                  .map((c, i) => (
                    <Link
                      key={c.id}
                      href={`/tienda/?categoria=${c.id}`}
                      className="nav__menu-link nav__menu-link--model"
                      style={{ ["--d" as string]: `${280 + i * 45}ms` }}
                    >
                      <span className="nav__menu-index">0{i + 5}</span>
                      {c.nombre}
                    </Link>
                  ))}
                <Link href="/favoritos/" className="nav__menu-link nav__menu-link--model" style={{ ["--d" as string]: "415ms" }}>
                  <span className="nav__menu-index">08</span>
                  Favoritos
                  {favoritos.listo && favoritos.slugs.length > 0 && <span className="nav__menu-nota">{favoritos.slugs.length}</span>}
                </Link>
                <Link href="/comparar/" className="nav__menu-link nav__menu-link--model" style={{ ["--d" as string]: "440ms" }}>
                  <span className="nav__menu-index">09</span>
                  Comparar
                </Link>

                <p className="label nav__menu-label" style={{ ["--d" as string]: "420ms" }}>
                  Almara
                </p>
                {ENLACES.filter((e) => e.href !== "/tienda/").map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav__menu-link"
                    style={{ ["--d" as string]: `${450 + i * 45}ms` }}
                    onClick={(e) => irAncla(e, item.href)}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="nav__menu-pie" style={{ ["--d" as string]: "620ms" }}>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  <span>{contact.hours}</span>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
