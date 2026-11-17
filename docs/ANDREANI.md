# Envíos con Andreani

## 1. Credenciales
1. Ser cliente Andreani (si no lo sos, registrate como PyME en andreani.com).
2. En **andreani.com > Integraciones** generá usuario/contraseña de API. Pedile a tu comercial el **código de cliente** y el **número de contrato** (domicilio y, si querés, sucursal).
3. Copiá `.env.example` a `.env` y completalo. Empezá con `ANDREANI_ENV=qa`.

## 2. Probar desde tu compu (Node 20+)
```
npm run andreani -- login
npm run andreani -- cotizar 1425
npm run andreani -- crear 1425          # devuelve agrupadorDeBultos y numeroDeEnvio
npm run andreani -- etiqueta API000...  # guarda el PDF
npm run andreani -- seguimiento 3600...
```

## 3. Endpoints (funciones serverless, formato Vercel: carpeta /api)
| Ruta | Quién la llama | Para qué |
|---|---|---|
| `POST /api/envios/cotizar` `{cp, items:[{slug,cantidad}]}` | Checkout (público) | Mostrar costo de envío |
| `POST /api/envios/crear` (header `x-admin-key`) | Webhook de Mercado Pago / vos | Dar de alta el envío cuando el pago se aprueba |
| `GET /api/envios/etiqueta?agrupador=...&key=...` | Vos | Imprimir la etiqueta PDF |
| `GET /api/envios/seguimiento?numero=...` | Cliente (público) | Página "seguí tu pedido" |

## 4. Flujo de una venta
1. Cliente pone su CP → `cotizar` → sumás el envío al total.
2. Paga con Mercado Pago → tu webhook verifica el pago → `crear`.
3. Guardás `agrupadorDeBultos` (etiqueta) y `numeroDeEnvio` (tracking) en el pedido.
4. Imprimís la etiqueta, pegás en la caja y despachás / llevás a sucursal.
5. Le mandás al cliente el `numeroDeEnvio`.

## Pendientes
- Completar pesos/medidas reales y precios en `lib/envio-config.js`.
- Las credenciales van SOLO en variables de entorno del hosting, nunca en el JS del navegador.
- Documentación oficial: https://developers.andreani.com/document (las planillas .xlsx de cada endpoint tienen todos los campos).
