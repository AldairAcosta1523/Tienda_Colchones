import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  // Las fichas vivían en /colchones/<slug>/; se conservan las URL antiguas.
  async redirects() {
    return [
      // /colchones/ es ahora la página de categoría; solo las fichas antiguas se redirigen.
      { source: "/colchones/:slug", destination: "/producto/:slug", permanent: true },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 solo optimiza las calidades declaradas: si falta una, avisa en consola.
    // Una sola calidad para todo el sitio (src/lib/imagen.ts).
    qualities: [90],
    // Pasos intermedios: con los de serie, una foto a 52vw en 1440 px saltaba de 750 a 1080
    // o se quedaba corta; así cada pantalla recibe una versión cercana a su tamaño real.
    deviceSizes: [640, 750, 828, 960, 1080, 1280, 1440, 1680, 1920, 2240, 2560, 3840],
    // Las fotos no cambian entre despliegues: que la CDN las guarde un mes.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
