# Integraciones y datos pendientes

Todo lo que el sitio necesita del cliente o de un proveedor para dejar de ser una demostración.
La configuración vive en un solo sitio, `src/data/comercial.ts`:

- `DEMO`: cómo se presenta el sitio (franja global, «Simular pedido»). Es independiente de lo
  que funciona de verdad.
- `servicios`: qué está conectado. Apagar `DEMO` sin encender servicios deja el checkout
  bloqueado con un aviso y un enlace a contacto; nunca una compra aparente.
- `contacto`: correo, WhatsApp, teléfono, dirección, horario, RUC y razón social. Los campos en
  `null` no se renderizan.

## Orden recomendado para pasar a producción

1. Rellenar `contacto` con los datos reales (ver lista abajo).
2. Conectar y encender cada servicio cuando esté probado.
3. Revisar las políticas en `src/data/tienda.ts`: plazos, coberturas y garantías son ejemplos.
4. Poner `DEMO = false`.

## Servicios

| Servicio | Flag | Qué hace falta | Dónde se conecta |
|---|---|---|---|
| Pasarela de pago | `servicios.pagos.activo` + `metodos` | Cuenta en Culqi, Niubiz o Mercado Pago. Claves privadas en variables de entorno del servidor, nunca en `NEXT_PUBLIC_*`. La lista `metodos` solo lleva lo confirmado por el proveedor (p. ej. «Visa», «Mastercard», «Yape»). | Paso 03 de `src/components/shop/CheckoutClient.tsx`: hoy, con `DEMO`, termina en una vista previa; sin `DEMO` y sin pasarela, bloquea. |
| Backend de pedidos | `servicios.pedidos.activo` | Endpoint que reciba el pedido, reserve stock y devuelva un número de seguimiento. El resumen que hoy se muestra en la vista previa ya tiene todos los campos. | `onSubmit` en `CheckoutClient.tsx`. |
| Correo transaccional | (parte de pedidos) | Proveedor (Resend, SES, Postmark) y plantillas de confirmación al comprador y aviso interno. | Desde el backend de pedidos. |
| Formulario de consulta | `servicios.formulario.activo` | Un endpoint o servicio (Resend, Formspree, CRM). Hoy la consulta se arma en el navegador y el usuario la envía desde su correo. | `src/components/sections/Consulta.tsx`. |
| Cálculo de envío real | — | Tarifas por distrito del transportista. Hoy: regla fija en `envio` de `src/data/catalog.ts`. | `src/data/catalog.ts`. |
| Analítica (GA4) | `NEXT_PUBLIC_GA_ID` | Identificador de medición. Con la variable definida, `layout.tsx` carga gtag con IP anonimizada y la política de privacidad lo declara. **Pendiente**: decidir si se exige consentimiento previo (banner) según la política de datos del cliente; hoy no hay mecanismo de consentimiento. | `src/app/layout.tsx`, `src/data/tienda.ts` (privacidad). |
| WhatsApp | `contacto.whatsapp` | Número comercial en formato internacional sin «+» (p. ej. `51987654321`). Al existir, aparece en ficha (con modelo y medida), contacto y «Consulta las opciones de pago». | `src/components/shop/WhatsApp.tsx`, `MetodosPago.tsx`. |

## Datos del cliente

| Dato | Dónde | Estado |
|---|---|---|
| Correo real | `contacto.email` | Hoy `hola@almara.example` (dominio reservado, no es un buzón). |
| Teléfono y WhatsApp | `contacto.telefono`, `contacto.whatsapp` | `null`: no se muestran. |
| Dirección y horario | `contacto.direccion`, `contacto.horario` | Ejemplo. |
| RUC y razón social | `contacto.ruc`, `contacto.razonSocial` | `null`: el pie no lo imprime. |
| Condiciones de envío, prueba y garantía | `src/data/tienda.ts`, `envio` en `catalog.ts` | Ejemplos redactados; cada política lo dice en su último bloque. |
| Métodos de pago confirmados | `servicios.pagos.metodos` | Vacío: se ofrece consultar. |
| Entrega con subida al domicilio y retiro del colchón antiguo | Pendiente de decidir | No se publica nada hasta confirmar cobertura, condiciones y costo. |
| Testimonios | Pendiente | No hay huecos reservados; se añadirían antes del cierre comercial solo con autorización por escrito. |

## Legal (Perú)

No se ha añadido ninguna página nueva para no aparentar cumplimiento. Pendiente de revisión con
el cliente y su asesoría:

- Política de privacidad conforme a la Ley 29733 (protección de datos personales) una vez que
  existan formularios que envíen datos. El texto actual describe lo que hace el sitio hoy.
- Libro de Reclamaciones virtual (obligatorio para venta en línea) y su enlace en el pie.
- Términos y condiciones de venta cuando haya pasarela.

## Catálogo

El catálogo actual (18 colchones en 3 colecciones + 6 complementos) es de muestra. Para el
real hace falta, por modelo: nombre, colección, construcción, firmeza, altura, materiales,
textos, fotografías; y por variante: SKU, medida y dimensiones en cm, precio y stock. Si hay
varias marcas, solo marcas reales del cliente. Si el cliente va a gestionar el catálogo sin
desarrollador, hace falta un CMS o API (Sanity, Contentful, Shopify Storefront, un endpoint
propio): el frontend lee hoy de `src/data/*` y el punto de cambio es ese módulo.

## Fotografía

Ver `docs/FOTOGRAFIA.md`: brief de producción. Es la dependencia con más impacto en la
percepción del sitio y no se resuelve desde el código.
