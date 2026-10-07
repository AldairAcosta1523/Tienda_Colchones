import type { Metadata, Viewport } from "next";
import { Onest, Newsreader } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import SmoothScroll from "@/lib/SmoothScroll";
import { CarritoProvider } from "@/lib/cart";
import { site } from "@/data/content";
import { ASSETS_URL, ES_PREVIEW, SITE_URL } from "@/lib/site";
import { IMAGEN_SOCIAL } from "@/lib/seo";
import { revelador } from "@/lib/revela";
import Preloader from "@/components/layout/Preloader";
import DemoBanner from "@/components/layout/DemoBanner";
import CompararBarra from "@/components/shop/CompararBarra";
import { ListasProvider } from "@/lib/listas";
import { servicios } from "@/data/comercial";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Cursor from "@/components/core/Cursor";
import CartDrawer from "@/components/shop/CartDrawer";

/* Dos familias, ambas variables (un archivo por estilo): Onest para lo funcional y Newsreader,
   con su eje óptico, para que los titulares grandes afinen el contraste por sí solos. */
const sans = Onest({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal"],
  axes: ["opsz"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  // og:image y twitter:image salen del despliegue actual (un preview enseña su propia imagen).
  metadataBase: new URL(ASSETS_URL),
  title: { default: site.title, template: "%s | Almara" },
  applicationName: site.name,
  category: "shopping",
  description: site.description,
  keywords: ["colchones", "descanso", "dormitorio", "firmeza", "almohadas", "ropa de cama", "Almara", "Perú"],
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: `${SITE_URL}/`,
    images: [IMAGEN_SOCIAL],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [IMAGEN_SOCIAL.url],
  },
  // Los previews de Vercel son copias del sitio: no deben competir con producción en Google.
  robots: ES_PREVIEW ? { index: false, follow: false } : { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/` },
};

export const viewport: Viewport = {
  themeColor: "#F5F2EC",
  width: "device-width",
  initialScale: 1,
};

/* JSON-LD mínimo: solo identidad del sitio. Al tratarse de una marca conceptual,
   no se declaran ofertas, precios ni valoraciones como si fueran reales. */
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: `${SITE_URL}/`,
    inLanguage: "es",
    description: site.description,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon.svg`,
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Antes del primer pintado: <html class="motion"> si no se pidió reducir el movimiento, y
            <html class="intro"> la primera vez por sesión, que es cuando se ve la cortina de
            entrada (styles/intro.css). Va en línea: con next/script `beforeInteractive` llegaba
            después de pintar y la cabecera, el hero y los titulares se veían, se escondían y
            volvían a entrar. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion');try{if(sessionStorage.getItem('almara:intro')!=='1'){d.classList.add('intro');sessionStorage.setItem('almara:intro','1')}}catch(e){}}}catch(e){}",
          }}
        />
        {/* Revelador de las entradas al hacer scroll (lib/revela.ts). Va en línea y no con
            next/script: `beforeInteractive` no se ejecuta al leer el HTML sino cuando arranca el
            JavaScript de Next, y aquí se necesita antes del primer pintado para que lo que está
            fuera de pantalla ya empiece oculto y nada parpadee. */}
        <script dangerouslySetInnerHTML={{ __html: `(${revelador})()` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {/* Analítica (GA4) solo si hay identificador en NEXT_PUBLIC_GA_ID. Sin consentimiento
            previo no se carga nada más que la medición básica; ver docs/INTEGRACIONES.md. */}
        {servicios.analitica.id && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${servicios.analitica.id}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${servicios.analitica.id}',{anonymize_ip:true});`}
            </Script>
          </>
        )}
      </head>
      <body>
        <CarritoProvider>
        <ListasProvider>
          <SmoothScroll>
            <a href="#main" className="skip-link">
              Ir al contenido
            </a>
            <Preloader />
            <Cursor />
            <Nav />
            <main id="main">{children}</main>
            <Footer />
            <CartDrawer />
            <CompararBarra />
            <DemoBanner />
          </SmoothScroll>
        </ListasProvider>
        </CarritoProvider>
      </body>
    </html>
  );
}
