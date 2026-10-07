# Brief de fotografía

## Diagnóstico de los assets actuales (`public/images/`)

| Archivo | Uso | Medidas | Problema |
|---|---|---|---|
| `colchon-esencial.jpg` | Esencial | 2000×2390 | Dormitorio clásico blanco con lámparas y espejo: se ve la decoración, no el colchón. Luz distinta a las otras dos. |
| `colchon-natura.jpg` | Natura | 2000×2000 | Dormitorio bohemio con plantas y cojines naranjas. Paleta ajena a la marca (lino, bosque, arcilla). |
| `colchon-signature.jpg` | Signature | 2000×1500 | Hotel oscuro con paneles de madera y luz cálida de noche. Contrasta con las anteriores. |
| `almohada-nube.jpg` | Almohada Nube | 1600×1600 | Almohada sobre sofá gris con manta de lana: ambiente de salón, no de dormitorio. |
| `almohada-lino.jpg` | Almohada Lino | 1400×800 | Encuadre apaisado recortado a 4:5 en tarjeta; pierde la mitad. |
| `protector-impermeable.jpg` | Protector | 1600×1797 | Pila de mantas con velas: no muestra el producto. |
| `sabanas-lino.jpg` | Sábanas | 1400×800 | Apaisada; bien de paleta, corta de resolución para 4:5. |
| `base-madera.jpg`, `base-tapizada.jpg` | Bases | 1600×1067 | Dormitorios genéricos; la base casi no se ve. |
| `hero-dormitorio.jpg`, `cta-dormitorio.jpg`, `detalle-tejido.jpg`, `guia-confort.jpg`, `immersive-dormitorio.jpg`, `nosotros.jpg` | Ambiente | 1200–2600 px | Coherentes entre sí (lino, madera clara, luz de mañana). Son la referencia de dirección. |

Lo que se puede hacer desde el código ya está hecho: mismo `--photo-grade`, mismas proporciones
por contexto y recortes (`position`) ajustados. Eso **no** convierte tres dormitorios distintos
en una colección coherente. Hace falta producción.

## Dirección común

- **Luz**: natural, suave, de mañana; ventana lateral, sin flash ni contraluz duro.
- **Paleta**: lino crudo, arena, madera clara, verde bosque como acento, arcilla en un detalle.
  Nada de naranja saturado, negro ni cromados.
- **Cámara**: misma altura (≈ 1,10 m), misma focal (35–50 mm equivalente), misma distancia para
  los tres colchones. Que se puedan poner lado a lado y se vea la diferencia de altura
  (24 / 27 / 31 cm).
- **Protagonista**: el colchón. Sin cabecero llamativo, sin cuadros, sin plantas delante.
  Ropa de cama retirada en la foto de estudio; media cama vestida en la de ambiente.

## Por modelo (Esencial, Natura, Signature)

| Toma | Descripción | Proporción | Archivo |
|---|---|---|---|
| Estudio | Colchón sobre base baja neutra, fondo lino liso, tres cuartos a 30°, sin ropa de cama. Que se lea el perfil y el grosor. | 5:6 (mín. 2000×2400) | `colchon-{modelo}-estudio.jpg` |
| Macro | Detalle del tejido y la costura perimetral, 20–30 cm de distancia. Natura: funda de algodón; Signature: pillow top y tacto seda; Esencial: acolchado en rombo. | 4:5 (mín. 1600×2000) | `colchon-{modelo}-detalle.jpg` |
| Ambiente | Mismo dormitorio para los tres (misma pared, misma ventana), solo cambia el colchón y un textil de acento. | 3:2 (mín. 2400×1600) | `colchon-{modelo}-ambiente.jpg` |

## Complementos

| Producto | Toma | Proporción | Archivo |
|---|---|---|---|
| Almohada Nube y Almohada Lino | Sobre el colchón Esencial, de frente, con luz lateral; una segunda toma de perfil para ver la altura (14 / 12 cm). | 4:5 | `almohada-{nube,lino}.jpg`, `-perfil.jpg` |
| Juego de sábanas de lino | Cama vestida con la esquina doblada mostrando la bajera; rayas visibles. | 4:5 y 3:2 | `sabanas-lino.jpg`, `-ambiente.jpg` |
| Protector impermeable | Esquina del protector levantada sobre el colchón; que se vea el rizo. | 4:5 | `protector-impermeable.jpg` |
| Base de madera y Base tapizada | Base sin colchón, tres cuartos, mismo fondo que el estudio; una segunda con colchón encima. | 5:6 | `base-{madera,tapizada}.jpg`, `-con-colchon.jpg` |

## Entrega técnica

- JPEG calidad 90, perfil sRGB, sin marcas de agua, sin metadatos personales.
- Lado largo ≥ 2400 px en ambiente y hero; ≥ 2000 px en producto. Next genera el resto.
- Nombres en minúsculas, sin acentos, guiones; sustituir los archivos actuales con el mismo
  nombre donde coincida para no tocar `src/data/catalog.ts` ni `content.ts`.
- Las versiones responsive las genera `next/image` a partir de `images.qualities` en
  `next.config.ts`; no hace falta entregar tamaños.
