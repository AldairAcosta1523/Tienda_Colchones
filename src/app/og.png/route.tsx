import { ImageResponse } from "next/og";
import { hero, site } from "@/data/content";

/**
 * Imagen para redes (og:image y twitter:image), servida en /og.png.
 *
 * No usa la convención `opengraph-image`: con `trailingSlash` esa ruta respondía con una
 * redirección 308 y algunas redes no la siguen al leer la imagen. Una ruta con extensión no
 * lleva barra final, así que /og.png contesta 200 a la primera. Se declara en `lib/seo.ts`
 * y en el layout.
 */
export const runtime = "nodejs";
// Se genera en tiempo de compilación: así no se rehace la imagen en cada petición.
export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 76,
          background: "#F5F2EC",
          color: "#1E2823",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Solo el nombre, como el wordmark de la cabecera: sin icono de app. */}
        <div style={{ display: "flex", fontSize: 40, letterSpacing: -0.5 }}>Almara</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#6F665C", fontFamily: "Arial, sans-serif" }}>
            {hero.eyebrow}
          </div>
          {/* Dos líneas fijas, como el titular del hero: «Elige tu colchón / por cómo duermes.» */}
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.02, letterSpacing: -2 }}>
            <div style={{ display: "flex" }}>{hero.lines[0]}</div>
            <div style={{ display: "flex" }}>
              {`${hero.lines[1]} `}
              <span style={{ color: "#8F4E39" }}>{hero.lines[2]}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#554C44",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <span>{hero.signals[0]}</span>
          <span>{site.tagline}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
