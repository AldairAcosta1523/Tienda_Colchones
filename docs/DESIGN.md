# Almara — Documento de diseño

Almara es una **marca conceptual de colchones** creada como pieza de portafolio: demuestra la
transformación completa de un sitio existente (identidad, dirección de arte, contenido, estructura)
conservando su base técnica.

---

## 0. Rediseño 3.0 — *Contemporary rest / warm editorial luxury*

Esta sección describe el sistema vigente. Donde los apartados siguientes (históricos, versión 2.0)
hablen de terracota como color de marca, DM Serif Display, Manrope, píldoras o esquinas de 20 px,
manda lo que se dice aquí.

**Diagnóstico de la 2.0.** Base técnica sólida, pero visualmente formulaica: todas las secciones
repetían «etiqueta con punto + titular con la última línea en cursiva terracota + párrafo a la
derecha», todo eran píldoras y tarjetas de 20 px de radio, había tres rejillas de tarjetas idénticas
y un anillo de cursor persiguiendo al puntero. Se leía como plantilla.

**Copy recortado (2026-09-23).** La composición no cambia; cambia el texto. La home se ordena por lo
que ayuda a decidir y cada dato aparece una vez: firmeza por postura en «Cómo elegir», diferencias en
la comparativa, y el FAQ de la home solo con lo que no está en ninguna de las dos. Se retiraron de la
home The Art of Rest (solo ambiente) y Nuestro confort (repetía las capas del Comfort Lab); los
componentes siguen existiendo. Cada sección conserva etiqueta + titular + párrafo corto: sin el
párrafo, la cabecera queda coja.

**Catálogo ampliado (2026-10-06).** Almara pasa de tres colchones a una tienda con catálogo:
18 colchones de muestra en tres colecciones (Esenciales, Confort, Premium) y seis construcciones,
con variantes por medida (SKU, dimensiones, precio, stock). Portada: hero «Encuentra tu próximo
colchón», Selección Almara (seis tarjetas) y exploración por colección y medida; desaparecen los
tres capítulos y la comparativa fija. Nuevas rutas: `/colchones/` (categoría con filtros propios),
`/comparar/` (2–4 modelos elegidos, precio en la misma medida), `/favoritos/` y `/guia/`
(postura, firmeza, medida y presupuesto → resultados del catálogo). La tienda guarda filtros, orden
y página en la URL, filtra precio y disponibilidad por la variante que cumple la medida y pagina
de 12 en 12. Cabecera y pie se generan desde los datos. Todo el copy con «tres» se reescribió en
lenguaje ampliable.

**Parche comercial (2026-10-05, tarde).** Un solo modo de demostración (`DEMO` en
`src/data/comercial.ts`) con una franja global cerrable, en vez de once avisos repartidos; el
checkout termina en «Simular pedido» y una vista previa, y sin demo ni servicios se bloquea con
aviso. Megamenú con la foto de la portada en «Ver toda la tienda»; pie con «Tres colchones.
Ninguna noche igual.»; «El arte de descansar» en vez de «The Art of Rest». Métodos de pago y
WhatsApp como componentes conectados a la configuración: no muestran nada que no esté
confirmado. La ficha cambia el visor 3D completo por un resumen con enlace al Lab de la portada;
el carrito (cajón y página) sugiere complementos reales. Comparativa con la fila «Recomendado
para». Integraciones y datos pendientes en `docs/INTEGRACIONES.md`; brief fotográfico en
`docs/FOTOGRAFIA.md`.

**Recorte comercial (2026-10-05).** El hero deja una sola acción con peso («Ver colchones») y la
comparación pasa a enlace de texto: dos botones iguales apilados se leían como un formulario. En
la colección desaparecen las tres viñetas de materiales de cada modelo (viven en la ficha y en la
comparativa); queda foto, nombre, para quién es, una frase, eje de firmeza, altura, medidas y
precio. Comfort Lab se titula «Míralo por dentro» y sus tres puntos bajan a una frase. Los bloques
editoriales de /nosotros (marca, confort, sobre Almara) pasan de dos párrafos a uno. Pendiente del
cliente: fotografía de producto en la que se distinga el colchón y no la decoración del dormitorio.

**Rendimiento y transiciones (2026-09-24).** La cortina de entrada y la secuencia del hero son CSS
(`src/styles/intro.css`), no GSAP: arrancan con el primer pintado en vez de esperar a la hidratación
(era lo que retrasaba el LCP). `html.intro` lo decide el script de arranque del layout, una vez por
sesión. Las entradas de un solo disparo usan un IntersectionObserver compartido (hoy
`src/lib/revela.ts`) en lugar de un ScrollTrigger cada una; ScrollTrigger queda para lo que va ligado
al scroll (parallax, velo, Comfort Lab). Entre páginas hay un fundido corto con la View Transitions API (`app/template.tsx`,
`src/styles/transiciones.css`), la cabecera queda fija y la foto de la tarjeta viaja a la ficha.

**Rendimiento en móvil (2026-10-06).** Las entradas al hacer scroll (`Reveal`, `SplitLines`,
`MediaReveal`, `Rule`) ya no usan GSAP: pintan `data-revela` y sus variables, el estado inicial y la
animación están en `src/styles/revela.css` (mismas curvas y tiempos) y un único revelador en línea
(`src/lib/revela.ts`, sustituye a `entrar.ts`) marca `data-visto` al cruzar la línea. Las cabeceras
de las páginas interiores entran con la secuencia CSS de intro. GSAP, ScrollTrigger y Lenis se
importan bajo demanda (`cargarGsap()` en `src/lib/gsap.ts`): Lenis y el cursor solo con puntero fino,
tras la carga; el parallax (≥ 768 px), el velo de la guía y la entrada del Comfort Lab, al acercarse.
La cabecera usa un listener de scroll y un IntersectionObserver para el tema. En pantallas de hasta
1023 px lo que queda lejos usa `content-visibility` (`src/styles/rendimiento.css`).

### Paleta

| Uso | Token | HEX |
|---|---|---|
| Fondo (lino) | `--bg` | `#F5F2EC` |
| Fondo secundario (arena) | `--bg-2` | `#EAE4D8` |
| Superficie | `--surface` | `#FCFAF6` |
| Títulos | `--ink` | `#1E2823` |
| Texto / terciario | `--ink-2` / `--ink-3` | `#3F4640` / `#5C645C` |
| Líneas | `--line` | `#D9D0C2` |
| Marca (verde bosque) | `--brand` | `#283A32` |
| Acento (arcilla) | `--accent` / `--accent-deep` | `#B66F57` / `#8F4E39` |
| Superficie oscura | `--dark` | `#1F2D27` |
| Tintes de colección | `--tint-esencial/natura/signature` | `#EAE4D8` / `#DFE2D5` / `#E9DBCE` |

El verde es el color de acción (botones, superficies oscuras). La arcilla es el único acento y se usa
poco: índices, estados activos, el marcador de firmeza. Nunca como fondo de texto blanco pequeño
(3,9:1); para eso existe `--accent-deep` (6:1). Contrastes medidos: `--ink-3` 4,9:1 sobre arena,
`--accent-deep` 5:1 sobre arena, `--accent-on-dark` 6,6:1 sobre bosque.

### Tipografía

- **Brygada 1918** (variable 400–700) — titulares, nombres de producto, numerales, logo. Titulares
  en 400 para que la página se lea ligera; el 600 se reserva para lo importante: la palabra clave
  del titular (`.accent`) y el logo. Tracking −0,018 a −0,026 em. Sin cursivas en ningún sitio.
- **Schibsted Grotesk** (variable 400–900) — navegación, texto, botones, precios, etiquetas. Todo en
  400 salvo botones (500) y precios o totales (600). Etiquetas en caja normal, 0,84 rem: nada de
  versalitas espaciadas.

(Cambio de tipografía del 2026-10-08: antes Newsreader + Onest. Se probó Young Serif, pero al tener
un solo peso grueso todo se leía en negrita.)

Escalas con `clamp()` atadas a ancho **y** alto (`min(vw, vh)`) para que el hero no empuje la
fotografía fuera del primer pantallazo. `text-wrap: balance/pretty` en titulares y párrafos.

### Forma y composición

Esquinas de 2–4 px, botones rectos, fotografías sin radio. Contenedor de 1520 px, rejilla de doce
columnas y una cabecera de sección constante (índice de capítulo + regla + etiqueta) que numera la
página de 01 a 07. Ritmo de fondos:
`lino → lino → arena / salvia / arcilla clara (colección) → bosque → lino → arena (lab, visor bosque) → lino → bosque → lino → arena → bosque (cierre + pie)`.

| Sección | Composición |
|---|---|
| Cabecera | Enlaces a la izquierda, wordmark centrado, «Buscar» y «Carrito» como palabras; sólida y sin desenfoque al bajar; megamenú que se abre con máscara. Menú móvil a pantalla completa con pie de contacto |
| Hero | Titular a todo el ancho, texto y CTA en columna estrecha, fotografía debajo con margen izquierdo y a sangre por la derecha; pie de foto vertical; tres condiciones en una banda con reglas |
| Categorías | Índice tipográfico; cada familia con su foto en la fila, a todos los anchos. Al pasar el cursor, la foto se acerca (mismo hover que las tarjetas); ninguna foto cambia por otra |
| Colección | Una banda por colchón con tinte propio, foto alternando de lado, nombre a gran tamaño, ficha con escala de firmeza, altura, medidas y precio |
| Nuestro confort | Solo en /nosotros. Editorial + corte esquemático enlazado a la lista de capas |
| Comfort Lab | Visor bosque, barra de controles propia (vistas segmentadas con marca deslizante, giro, interruptor de capas), panel numerado |
| Complementos | Riel con scroll nativo y ajuste a tarjeta, flechas y barra de avance; confirmación en la propia ficha de medida |
| Cómo elegir | Tres columnas con reglas y numerales en cursiva; enlace a la comparativa |
| Comparativa | Tabla con foto, escala de firmeza y fila de acciones; por debajo de 768 px, selector de producto con pestañas |
| Condiciones | Cuatro columnas con reglas, sin iconos |
| FAQ | Preguntas en serif, signo + sin círculo |
| Cierre + pie | Misma superficie bosque: titular, foto vertical, enlaces y wordmark a sangre |

### Movimiento

Tokens: micro 220 ms · botón 360 ms · contenido 420 ms · revelado 700–800 ms · máscara 1,05 s ·
stagger 70–100 ms.

**Ajuste 2026-09-23 (más natural):** contenido 0,6 s · máscara 0,85 s · asentado 1,15 s · regla 0,7 s ·
stagger 60 ms; recorrido de entrada 12 px, zoom de asentado 1,05, parallax 4 %. Los valores que cada
sección pasa a mano se multiplican por `MOVE.suavidad` (0,6), así que se suavizan todos por igual.
Lenis: `lerp` 0,15; las zonas con scroll propio (carrito, menú, filtros, desplegables) quedan
fuera con `data-lenis-prevent` o por su rol. No todo sube desde abajo: los titulares entran por máscara de línea (sin
rotación), las fotografías por `clip-path` + asentado de escala, las reglas se dibujan, los párrafos
de apoyo solo funden (`y={0}`) y las listas entran escalonadas. Se retiraron el efecto magnético
de los botones y el anillo de cursor (queda solo la etiqueta contextual «Explorar»/«Girar»).
No hay animaciones perpetuas salvo la barra de carga del Lab mientras carga.

**Comfort Lab.** La cámara pasó de interpolación exponencial a un amortiguador crítico
(`amortiguar`, tipo SmoothDamp): arranca y frena de forma continua. El yaw elige siempre el giro más
corto (`girocorto`), así que pedir «Frontal» tras varias vueltas ya no las deshace de golpe. Se
añadieron giro por botones y por flechas de teclado sobre el visor.

### Verificación

`scripts/home-qa.mjs` comprueba desbordes y consola a 375, 390, 768, 1024 y 1440 px, las
interacciones (categorías, capas, Lab, riel, carrito, FAQ por teclado, megamenú), el móvil (menú,
comparativa por pestañas, áreas táctiles) y `prefers-reduced-motion`.
`scripts/shot-view.mjs` captura un viewport en el selector indicado.

---

## 1. Posicionamiento

Marca de descanso premium accesible. Pocas referencias, bien explicadas. El tono es comercial pero
verificable: no hay certificaciones, porcentajes clínicos, garantías, años de experiencia, reseñas
ni promesas médicas. Donde haría falta un dato de negocio que no existe, se omite o se marca como
demostración.

**Propuesta:** tres construcciones (Esencial, Natura, Signature) que se eligen por *firmeza*, no por
nombre comercial.

---

## 2. Dirección de arte

Referencia: interiorismo cálido, textiles naturales, fotografía de producto con luz natural.
Nada de estética corporativa, degradados ni sombras duras.

### Paleta

| Uso | Token | HEX |
|---|---|---|
| Fondo principal (marfil) | `--bg` | `#F8F5F0` |
| Fondo secundario (arena) | `--bg-2` | `#EDE5DA` |
| Superficie (blanco crema) | `--surface` | `#FFFCF8` |
| Títulos (espresso) | `--ink` | `#332820` |
| Texto | `--ink-2` | `#554C44` |
| Texto terciario | `--ink-3` | `#6F665C` |
| Bordes (beige piedra) | `--line` | `#DDD4C8` |
| Marca (terracota) | `--brand` | `#AC6040` |
| Terracota para texto pequeño | `--brand-deep` | `#9C583C` |
| Acento bienestar (salvia) | `--sage` / `--sage-deep` | `#8D9A80` / `#5E6A53` |
| Superficie oscura (espresso) | `--dark` | `#2A201A` |

El terracota aparece solo en botones primarios, enlaces con flecha, la palabra en cursiva de cada
título y los puntos de las etiquetas. El salvia queda reservado a detalles de bienestar (viñetas de
cuidados, etiqueta de medidas, eyebrow de la sección de confort).

Los valores se ajustaron para cumplir **WCAG AA**: terracota `#AC6040` da 4.67:1 con texto blanco
encima; `--ink-3` alcanza 4.5:1 sobre marfil y arena; `--on-dark-3` subió a 58 % de opacidad.

### Tipografía

- **DM Serif Display** — títulos (`display`, `h2`, nombres de modelo, wordmark, footer).
  Una sola variante, en redonda; la cursiva se reserva para la palabra de acento de cada título.
- **Manrope** — interfaz, texto corrido, botones, navegación y microetiquetas (`.label`,
  Manrope 600 en caja alta con 0.16em de tracking).

Cada titular se escribe con saltos de línea intencionales en `src/data/content.ts` (array de líneas)
y se anima línea a línea con máscara.

### Ritmo de fondos y composición

`marfil → marfil → arena → foto a sangre → marfil → espresso → marfil → arena → campaña → marfil → espresso`

Ninguna sección repite la composición de la anterior: columna fija + lista, secuencia editorial de
producto sobre rejilla de doce columnas, apertura fotográfica a pantalla completa, editorial 50/50,
secuencia numerada sobre fondo oscuro, acordeón y cierre de campaña.

---

## 3. Estructura de la landing

| Sección | Composición | Momento |
|---|---|---|
| Hero | Texto 1fr + fotografía de 52vw a sangre por la derecha | Secuencia de apertura coreografiada |
| Categorías | Cuatro tarjetas 3:4 con recuento y precio de entrada | Revelado escalonado |
| Colección | Rejilla de 12 columnas; cada modelo la ocupa distinto (7/5, 4/7 invertido, 7/3 desplazado) + riel de progreso lateral | Recorrido de foto a foto, hover de producto |
| *El lujo de sentirte en casa* | Fotografía que se abre de marco a sangre completa | Transición inmersiva |
| Nuestro confort | Editorial 50/50 con detalle de tejido y ficha de capas | Parallax + revelado en secuencia |
| Almara Comfort Lab | Escenario 3D + panel de tres puntos | Colchón explorable: giro, vistas y despiece |
| Completa tu cama | Rejilla de tres tarjetas de producto con precio y compra rápida | Revelado escalonado |
| Cómo elegir | Espresso, columna fija + secuencia numerada | Cambio de tono con velo |
| Nosotros | Editorial invertido, foto vertical con deriva propia | Texto y foto a ritmos distintos |
| Comparativa | Tabla de los tres colchones, con scroll horizontal por debajo de 640 px | Revelado de cabecera |
| Condiciones | Cuatro promesas enlazadas a su política | Revelado escalonado |
| FAQ | Columna fija + acordeón | Lectura tranquila |
| Cierre | Campaña a sangre con deriva lenta | Titular a gran escala |
| Consulta | Copia + formulario de demostración | — |
| Pie | Wordmark de remate a ancho de página | Máscara final |

## 3b. Componentes: shadcn/ui con piel Almara

Toda la interfaz —no solo la tienda— se construye con primitivas de shadcn/ui sobre Radix. El
comportamiento accesible (foco, teclado, `role`, estados) viene de ahí; el aspecto se aplica en una
única capa de adaptación, `src/styles/shadcn-almara.css`, que apunta a los `data-slot` de cada
primitiva y les pone los tokens de marca.

| Pieza de la tienda | Primitiva |
|---|---|
| Panel del carrito, menú móvil, panel de filtros | `Sheet` (Radix Dialog: trampa de foco, `Escape`, aislamiento del resto del árbol) |
| Tarjeta de producto y cajas de resumen | `Card` (+ `Badge` para «Agotado», `Button` para la compra rápida) |
| Selector de medida | `RadioGroup` — un radiogroup de verdad, con flechas y `role="radio"` |
| Filtros | `Checkbox`, `Slider`, `Label`, `Select` |
| Formulario de checkout | `Input`, `Textarea`, `Label`, `Alert`, `Button` |
| Comparativas | `Table` |
| Carrito restaurándose | `Skeleton` |
| Cantidades, quitar, vaciar, limpiar filtros | `Button` (`ghost`, `link`, `outline`, `brand`) |

El `Button` tiene variantes de marca (`brand`, `brand-secondary`, `brand-inverse`, `brand-ghost`) y
tamaños `pill`, que reutilizan el botón con relleno animado de `components.css`. Así conviven el
sistema de movimiento propio y la API de shadcn sin duplicar estilos.

Tres primitivas se ampliaron en su propio archivo en lugar de duplicarlas:

- `Card` acepta `asChild`, porque una tarjeta de producto es un `<article>`.
- `radio-group` exporta `RadioGroupCard`: el mismo radio de Radix pintado como ficha de medida.
- `Sheet` acepta `closeLabel`, porque su aspa venía con el texto «Close» en un sitio en español.

**Escala de apilado**: barra 900 · velo del panel 950 · panel 960 · enlace de salto 1000 ·
preloader 2000. La barra lleva `backdrop-filter`, así que crea contexto de apilado y los paneles
tienen que declararse por encima.

---

## 4. Arquitectura de tienda

### Fichas de producto (`/producto/<slug>/`)

Galería a la izquierda, **panel de compra pegajoso** a la derecha: migas → nombre → resumen →
descripción → precio de la variante elegida → selector de medida → stock → cantidad + añadir →
beneficios → promesas enlazadas a sus políticas. Debajo: ficha técnica y capas, comparativa (con la
fila actual destacada) y relacionados. Por debajo de 1024 px el panel deja de ser pegajoso y aparece
una **barra de compra fija** al pie con nombre, precio y botón.

El precio que se ve es siempre el de la variante seleccionada, no un "desde": el número que se
añade al carrito es el mismo que se acaba de leer.

### Catálogo (`/tienda/`)

Columna de filtros pegajosa (categoría, firmeza, medida, precio máximo) + barra con búsqueda y
orden. Los filtros se reflejan en la URL (`?categoria=`, `?q=`), así que un enlace del megamenú o
del pie llega ya filtrado. Por debajo de 1024 px la columna se convierte en un panel lateral.

### Tarjeta de producto

Foto 4:5 con segunda imagen al pasar el cursor, nombre, resumen, precio "desde" y **compra rápida
por medida**: cada talla es un botón que añade esa variante exacta. No se adivina una variante por
defecto, y una medida sin stock aparece tachada y deshabilitada. El bloque de compra se ancla al pie
de la tarjeta (`margin-top: auto`) para que toda la fila remate a la misma altura.

### Carrito

Panel lateral que se abre al añadir (con trampa de foco y cierre con `Escape`) y página completa con
los mismos totales. El estado guarda solo `{slug, varianteId, cantidad}` en `localStorage` y se
resuelve contra el catálogo en cada render: si un producto cambia de precio o se queda sin stock, el
carrito se corrige solo en lugar de arrastrar datos viejos.

### Checkout

Tres bloques numerados —contacto, entrega, pago—. Validación real en cliente antes de continuar.
El bloque de pago **no pide datos de tarjeta**; explica qué pasarela faltaría. Al enviar aparece un
"pedido preparado" copiable y la lista de integraciones pendientes. La ruta es `noindex`.

---

## 5. Sistema de movimiento — *The Art of Rest*

El motor es el que ya traía el proyecto (GSAP + ScrollTrigger + Lenis, sincronizados en
`src/lib/SmoothScroll.tsx`). Lo que cambia en la versión 2.0 es que el movimiento deja de ser un
`fade-up` repetido y pasa a tener sistema, jerarquía y tres momentos coreografiados.

### Valores únicos (`src/lib/motion.ts` + espejo CSS en `tokens.css`)

| Uso | Duración | Easing |
|---|---|---|
| Hover de enlaces | 0.28 s | `--e-ui` (`cubic-bezier(.22,1,.36,1)`) |
| Hover de fotografía | 0.9 s (`--t-foto`) | `--e-ui` · escala 1.04 (`--foto-zoom`) · toda la tarjeta o fila · sin cambio de foto · regla única en `components.css` |
| Botones (relleno, relevo de etiqueta, flecha) | 0.42 s | `--e-ui` / `--e-mask` |
| Revelado de contenido | 0.9 s | `expo.out` |
| Apertura de máscara fotográfica | 1.2 s | `power3.inOut` |
| Asentado de la fotografía (escala) | 1.6 s | `power2.out` |
| Secuencia del hero | ≈2.3 s | curvas mixtas |
| Recorridos ligados al scroll | según scroll | lineal (`none`) |

Ninguna animación usa rebote: en una marca de descanso, el movimiento frena, no salta.

### Primitivas

- `Reveal` — opacidad + `translateY`, con stagger opcional.
- `SplitLines` — máscara por línea; los saltos son los escritos a mano en `content.ts`.
  (Se descartó `SplitText`: partir automáticamente perdería esos saltos intencionales y obligaría
  a re-partir en cada resize.)
- `MediaReveal` — tres capas con un target cada una: `clip-path` en el marco (apertura),
  `yPercent` en la capa intermedia (parallax de scroll) y `scale` en la imagen (asentado).
  Así ninguna animación pisa a otra. Lanza un `ScrollTrigger.refresh()` agrupado al cargar la foto.
- `Rule` — divisoria que se dibuja (`scaleX`), sustituye a los `border-top` estáticos.
- `Cursor` — anillo contextual; con `data-cursor-label` se convierte en pastilla con una acción
  real ("Explorar"). Desactivado en punteros gruesos, sobre inputs y con reduced-motion.

### Los tres momentos

1. **Apertura.** Preloader de ≈1.4 s (marfil → wordmark bajo máscara → línea → cortina que sube)
   que emite `almara:ready`. El hero encadena entonces etiqueta → título por líneas → fotografía
   con máscara y zoom-out → descripción → botones → señales → indicador de scroll. Los retardos
   viven en un único objeto `BEAT` dentro de `Hero.tsx`.
2. **Apertura full-bleed.** Entre la colección y la editorial, la fotografía pasa de marco con
   márgenes a sangre completa. Se anima `clip-path` (compositor) en vez de `width`, así no hay
   recálculo de layout. El texto va **fuera** del marco recortado y entra cuando la apertura ya
   terminó. El scroll nunca se bloquea.
3. **Cambio de tono.** La sección espresso entra bajo un velo del color claro anterior que se
   retira con el scroll, y el bloque sube con esquinas redondeadas como un panel. El velo solo
   existe con JS y movimiento: por defecto está retraído y no puede tapar nada.

### Rendimiento del Comfort Lab

Arrancar una escena 3D es caro y, mal hecho, congela la página justo cuando el usuario llega.
Medido con `scripts/perf.mjs`, la tarea de arranque bloqueaba el hilo **8,5 s** en el entorno de
prueba. Qué se hizo, en orden de impacto:

1. **Construcción por fases.** `createMattressScene` es asíncrona y cede el hilo entre bloques
   (renderer → capas → acolchado → hotspots), y compila los shaders con `compileAsync`. Un único
   bloque de 8,5 s pasó a tareas de ~135 ms. Se probó `requestIdleCallback` y salió peor: agrupaba
   fases en una sola tarea larga.
2. **Fuera el entorno PMREM.** Renderizar un cubemap de `RoomEnvironment` al arrancar no compensa
   en materiales tan mate; se sustituyó por un hemisférico algo más intenso.
3. **Render bajo demanda.** El bucle solo pinta si algo se mueve; el vaivén de reposo se apaga a
   los 9 s para que la escena pueda quedarse quieta. Fuera de pantalla no pinta nada (comprobado
   contando `drawElements`: 0 llamadas).
4. **Calidad adaptativa.** Si la media de fotograma pasa de 24 ms, baja la densidad de píxeles y
   luego el tamaño del mapa de sombras. Nunca sube de nuevo, para que la imagen no oscile, y no
   toca nada que obligue a recompilar shaders.
5. **Montaje en las pausas del scroll.** Antes de empezar, y entre fases, se espera a que el
   desplazamiento se detenga (`esperarScrollQuieto`, con tope para no bloquearse nunca). El trabajo
   caro cae en una pausa en lugar de competir con el scroll: `lab` y `guide` pasaron de 38–109 ms
   de media a 16,7–21 ms, es decir 60 fps.
6. Texturas a la mitad de resolución, menos segmentos de geometría y densidad de píxeles tope 1.5.

### Composición: capas que sobraban

Medido con una auditoría del DOM tras recorrer la página (`will-change`, `clip-path`,
`backdrop-filter` activos), había coste permanente invisible en los fotogramas:

| | Antes | Después |
|---|---|---|
| Elementos con `will-change` | 33 | 2 |
| Máscaras `clip-path` activas | 10 | 4 |
| `backdrop-filter` sobre fotos | 3 | 0 |

- `.split-line__inner` declaraba `will-change: transform` en CSS: una capa de composición viva por
  cada línea de título (más de treinta) para animaciones que ocurren **una sola vez**.
- `MediaReveal` dejaba `clip-path: inset(0%)` en línea al terminar; ahora se limpia con
  `clearProps`, y las nueve fotografías vuelven a ser capas normales.
- Las etiquetas de firmeza usaban `backdrop-filter` sobre una foto en movimiento; con fondo opaco
  se ve igual y no hay que recomponer la zona en cada fotograma.
- El parallax de las fotos queda restringido a pantallas anchas.
- Lenis pasó de `lerp: 0.085` a `0.12`: el anterior hacía que la página persiguiera a la rueda,
  que se percibe como pastosidad más que como suavidad.

Con esto, 9 de las 12 secciones van a 60 fps limpios en el banco de pruebas; `lab` y `guide` son
las únicas que bajan, y ahí la medición usa renderizado por software, muy por debajo de una GPU real.

### Carga inicial

Medida con `scripts/carga.mjs`, que simula además un equipo modesto (CPU 4× más lenta, 4 Mbps).
El peso no era el problema —156 KB en la primera vista, con las fotos optimizadas por `next/image`—
sino **cuándo queda el contenido a la vista**, que es lo que se percibe como lentitud:

| | Antes | Ahora |
|---|---|---|
| Escritorio, primera visita | 2355 ms | 1568 ms |
| Móvil lento (CPU 4×, 4 Mbps) | 3872 ms | 2208 ms |
| Navegación interna (clic en un modelo) | 2120 ms | **184 ms** |

Tres decisiones:

1. **La cortina se reproduce una sola vez por sesión.** Antes reaparecía en cada navegación
   interna: pulsar un colchón costaba más de dos segundos de espera antes de leer nada.
2. **Secuencia comprimida.** La apertura pasó de ~2,0 s a ~0,6 s hasta que el contenido está a la
   vista, y los tiempos del hero arrancan antes. Sigue siendo una entrada coreografiada, no un fade.
3. **Se salta en equipos lentos.** Si el navegador tarda más de 1,2 s en llegar a ejecutarla, la
   cortina solo añadiría espera sobre una espera: se omite y el contenido aparece de inmediato.

### Rendimiento general

Solo se animan `transform`, `opacity` y `clip-path`. `will-change` se declara en los dos elementos
que lo necesitan y se limpia al terminar. Los `ScrollTrigger` viven dentro de un `gsap.context`
(`alAcercarse` en `src/lib/gsap.ts`), así que se revierten con el componente; con reduced-motion no
se crean y GSAP ni se descarga.

## 5b. Almara Comfort Lab (3D)

Sección protagonista entre la editorial de materiales y "Cómo elegir": un colchón tridimensional
que se gira, se mira desde tres vistas y se abre por capas.

**Referencias consultadas.** Fichas de Awwwards de *BD Barcelona Design* (GSAP + Barba + Locomotive,
microinteracciones y scroll), *Finely Crafted* (WebGL + GSAP, recorrido 3D con nota 8.6 en
animaciones) y el caso de estudio de *Noomo* (Three.js + GSAP; "cada interacción y hover tiene su
propia idea y propósito", y el aviso de que los ScrollTrigger sin agrupar les costaron rendimiento).
De ahí salen tres decisiones: el 3D ocupa **una** sección y no toda la página, cada interacción del
modelo tiene función (girar, cambiar de vista, abrir), y los recálculos de scroll van agrupados.
Solo se pudieron verificar las fichas y el artículo: el sitio actual de BD ya es otro desarrollo, así
que no se ha copiado ni inferido ninguna interacción concreta.

**Por qué Three.js directo y no React Three Fiber.** R3F 9.7 declara `react >=19 <19.3` y el
proyecto usa React 19.3. Su reconciliador depende de internos de React, así que forzar la
instalación habría dejado una dependencia frágil. La escena vive en `mattressScene.ts` (sin React)
y `ComfortLab.tsx` solo la monta, la pausa y le pasa estado.

**El modelo es procedural, no un GLB.** Cuatro capas reales (`RoundedBoxGeometry`): base, núcleo,
acogida y tapa. El acolchado tiene **relieve geométrico** (plano de 128×96 con `displacementMap`
generado en canvas, rombos que se apagan hacia el borde) más `bumpMap` para la luz; vivos de
terracota hechos con `TubeGeometry` sobre un rectángulo redondeado; etiqueta bordada, asas, trama
de tejido como relieve en los laterales; y caras interiores con textura propia (espuma perforada,
núcleo de siete zonas) que solo se ven al abrir las capas. Luz cálida (clave `#ffdcb8` con sombra
PCF + relleno frío bajo + hemisferio) y `RoomEnvironment` procedural: cero descargas de HDR o modelo.

**Convivencia con la página**
- El módulo de Three se importa cuando la sección está a 900 px del viewport: no pesa en la carga
  inicial ni bloquea el primer render.
- El bucle de render solo corre con la sección en pantalla y la pestaña visible.
- `touch-action: pan-y` en el canvas: en táctil el arrastre solo gira en horizontal y el gesto
  vertical sigue desplazando la página. No hay zoom con rueda: la rueda es de Lenis.
- La entrada la conduce un `ScrollTrigger` con scrub (el colchón sube y termina de girar).
- Los hotspots son **botones reales del DOM** colocados cada frame sobre la proyección de su ancla
  (sin pasar por React); se ocultan cuando su cara no mira a la cámara y salen del orden de tabulación.
- Sin WebGL: fotografía + el mismo panel de información. Con `prefers-reduced-motion`: sin vaivén
  de reposo, sin entrada por scroll y con cambios de cámara inmediatos.
- Todo se libera en `dispose()`: geometrías, materiales, texturas, PMREM, renderer y listeners.

## 6. Accesibilidad

HTML semántico con un solo `h1` por página, breadcrumbs, `aria` en acordeón y menú, skip link,
foco visible con contraste en claro y oscuro, imágenes con texto alternativo descriptivo y
navegación completa por teclado (el desplegable de Colchones es un `DropdownMenu` de Radix).

Con `prefers-reduced-motion` no hay preloader, ni Lenis, ni parallax, ni aperturas de máscara: todo
queda visible y en su sitio, y el relevo de etiqueta de los botones se degrada a un cambio de color.
Ningún contenido depende de que una animación llegue a ejecutarse: los estados iniciales se aplican
desde JS (no desde el CSS servido) y la única excepción —la máscara del hero— lleva una animación de
seguridad que la abre a los 3 s si el bundle nunca corre. Los efectos de hover no ocultan
información: todo lo que aparece al pasar el cursor está también en el texto visible.

---

## 7. Fotografía

Nueve imágenes en `public/images/`, descargadas de **Unsplash** (licencia Unsplash, uso comercial y
demostrativo permitido). Criterio de selección: dormitorios con luz natural, paletas arena/crema/
madera y textiles visibles. `detalle-tejido.jpg` es un recorte 4:5 del original del hero, hecho para
tener un plano de detalle coherente con la portada; `immersive-dormitorio.jpg` (lino terracota sobre
cabecero de roble) se eligió por ser la que mejor resume la paleta de la marca, y por eso sostiene
el momento a pantalla completa.

Todas comparten un mismo etalonaje (`--photo-grade`: un velo cálido con algo menos de saturación) para
que fotos de autores distintos se lean como una sola serie. Todas se sirven con `next/image` (AVIF/WebP, `sizes` por breakpoint, `priority` solo en las dos
portadas).

---

## 8. Honestidad de la demo

- El formulario **no envía nada**: arma el texto de la consulta en el navegador y lo muestra para
  copiar. No hay endpoint ni confirmación falsa (se eliminó `/api/demo` y `nodemailer`).
- **Precios, stock y condiciones son datos de demostración** y viven centralizados en
  `src/data/catalog.ts` (productos, variantes, stock, envío) y `src/data/tienda.ts` (políticas),
  con una cabecera que lo dice y una estructura pensada para sustituirlos por los de un negocio
  real. Ningún componente inventa un número ni una promoción.
- **No hay precios anteriores, descuentos ni "antes S/"**: inventar un precio tachado sería inventar
  un descuento.
- **El checkout no cobra.** No hay pasarela ni backend, así que no se piden datos de tarjeta y el
  resultado se llama *pedido preparado*, nunca *compra confirmada* ni *gracias por tu pedido*. Cada
  política termina con un bloque «Qué falta para que esto sea real».
- **Ningún control es decorativo.** Una medida agotada aparece deshabilitada y dice por qué; el
  envío solo cubre la zona declarada y fuera de ella el pedido no se puede completar.
- No hay reseñas, valoraciones, certificaciones ni años de experiencia, porque no existen.
- El correo usa el dominio reservado `almara.example` (RFC 2606).
- El JSON-LD declara `Product` con `AggregateOffer` **a partir de los precios reales del catálogo**,
  junto a `WebSite`, `BreadcrumbList` y `FAQPage`. No se declaran `AggregateRating` ni `Review`:
  no hay valoraciones que declarar.
- Aviso discreto en el pie: *Proyecto demostrativo de diseño y desarrollo web. Marca conceptual.*
