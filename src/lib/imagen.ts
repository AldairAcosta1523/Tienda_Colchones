/**
 * Calidad única de las fotografías. Por debajo de ~85, AVIF empieza a lavar la textura del lino
 * y de la madera, que es justo lo que vende la marca. Debe figurar en `images.qualities` de
 * next.config.ts: Next 16 solo optimiza las calidades declaradas.
 */
export const QUALITY = 90;

/**
 * Amplía un atributo `sizes` por un factor. Se usa cuando la foto se dibuja más grande que su
 * marco (parallax con margen vertical): sin esto, el navegador elige una versión a la medida del
 * marco y luego la estira, y la foto se ve blanda.
 */
export function ampliarSizes(sizes: string, factor: number) {
  if (factor <= 1) return sizes;
  return sizes
    .split(",")
    .map((parte) => {
      const t = parte.trim();
      const i = t.lastIndexOf(" ");
      const media = i > 0 && t.startsWith("(") ? t.slice(0, i) : "";
      const valor = media ? t.slice(i + 1) : t;
      if (valor === "0px" || valor === "0") return t;
      return `${media ? `${media} ` : ""}calc(${valor} * ${factor})`;
    })
    .join(", ");
}
