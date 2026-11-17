// Cliente mínimo para la API de Andreani (Transporte & Distribución).
// Documentación: https://developers.andreani.com/document
//
// IMPORTANTE: este archivo corre SOLO en el servidor (funciones /api).
// Nunca lo importes desde el navegador: usa tu usuario y contraseña de Andreani.

const BASE_URLS = {
  qa: 'https://apisqa.andreani.com',
  prod: 'https://apis.andreani.com',
};

function config() {
  const env = (process.env.ANDREANI_ENV || 'qa').toLowerCase();
  const cfg = {
    baseUrl: BASE_URLS[env] || BASE_URLS.qa,
    usuario: process.env.ANDREANI_USUARIO,
    password: process.env.ANDREANI_PASSWORD,
    cliente: process.env.ANDREANI_CLIENTE,
    contrato: process.env.ANDREANI_CONTRATO,
    contratoSucursal: process.env.ANDREANI_CONTRATO_SUCURSAL || null,
  };
  for (const k of ['usuario', 'password', 'cliente', 'contrato']) {
    if (!cfg[k]) throw new Error(`Falta la variable de entorno ANDREANI_${k.toUpperCase()}`);
  }
  return cfg;
}

export class AndreaniError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// --- Login: GET /login con Basic Auth. El token dura 24 hs; lo cacheamos 23 hs.
let tokenCache = { token: null, vence: 0 };

export async function obtenerToken({ forzar = false } = {}) {
  if (!forzar && tokenCache.token && Date.now() < tokenCache.vence) return tokenCache.token;
  const { baseUrl, usuario, password } = config();
  const basic = Buffer.from(`${usuario}:${password}`).toString('base64');
  const res = await fetch(`${baseUrl}/login`, { headers: { Authorization: `Basic ${basic}` } });
  if (!res.ok) throw new AndreaniError(`Login Andreani falló (${res.status})`, res.status, await res.text());
  // Andreani devuelve el token en el header x-authorization-token (y en algunas versiones también en el body).
  let token = res.headers.get('x-authorization-token');
  if (!token) {
    const body = await res.json().catch(() => ({}));
    token = body.token || body.accessToken;
  }
  if (!token) throw new AndreaniError('Login Andreani OK pero no vino el token', res.status);
  tokenCache = { token, vence: Date.now() + 23 * 60 * 60 * 1000 };
  return token;
}

async function llamar(path, { method = 'GET', body, accept = 'application/json', auth = true } = {}) {
  const { baseUrl } = config();
  const hacer = async (token) => {
    const headers = { Accept: accept };
    if (auth) headers['x-authorization-token'] = token;
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  };
  let res = await hacer(auth ? await obtenerToken() : null);
  if (res.status === 401 && auth) res = await hacer(await obtenerToken({ forzar: true })); // token vencido
  if (!res.ok) {
    const txt = await res.text();
    let detalle; try { detalle = JSON.parse(txt); } catch { detalle = txt; }
    throw new AndreaniError(`Andreani ${method} ${path} -> ${res.status}`, res.status, detalle);
  }
  return res;
}

// --- Cotizador: GET /v1/tarifas
// bultos: [{ kilos, volumenCm3, valorDeclarado, altoCm, largoCm, anchoCm }]
export async function cotizar({ cpDestino, bultos, contrato, sucursalOrigen }) {
  const cfg = config();
  const q = new URLSearchParams({ cpDestino: String(cpDestino), contrato: contrato || cfg.contrato, cliente: cfg.cliente });
  if (sucursalOrigen) q.set('sucursalOrigen', sucursalOrigen);
  bultos.forEach((b, i) => {
    q.set(`bultos[${i}][volumen]`, String(b.volumenCm3));
    if (b.kilos != null) q.set(`bultos[${i}][kilos]`, String(b.kilos));
    if (b.valorDeclarado != null) q.set(`bultos[${i}][valorDeclarado]`, String(b.valorDeclarado));
    for (const d of ['altoCm', 'largoCm', 'anchoCm']) if (b[d] != null) q.set(`bultos[${i}][${d}]`, String(b[d]));
  });
  const res = await llamar(`/v1/tarifas?${q}`);
  return res.json(); // { pesoAforado, tarifaSinIva: {...}, tarifaConIva: { total, ... } }
}

// --- Crear orden de envío (B2C): POST /v2/ordenes-de-envio
// Respuesta: { estado, agrupadorDeBultos, bultos: [{ numeroDeEnvio, ... }], etiquetasPorAgrupador, ... }
export async function crearOrden({ pedidoId, origen, destino, remitente, destinatario, bultos, contrato }) {
  const cfg = config();
  const body = {
    contrato: contrato || (destino.sucursalId ? cfg.contratoSucursal || cfg.contrato : cfg.contrato),
    idPedido: String(pedidoId),
    origen: { postal: origen },
    destino: destino.sucursalId ? { sucursal: { id: String(destino.sucursalId) } } : { postal: destino },
    remitente: {
      nombreCompleto: remitente.nombreCompleto,
      email: remitente.email,
      documentoTipo: remitente.documentoTipo,
      documentoNumero: remitente.documentoNumero,
      telefonos: [{ tipo: 1, numero: remitente.telefono }],
    },
    destinatario: [{
      nombreCompleto: destinatario.nombreCompleto,
      email: destinatario.email,
      documentoTipo: destinatario.documentoTipo || 'DNI',
      documentoNumero: destinatario.documentoNumero,
      telefonos: [{ tipo: 2, numero: destinatario.telefono }],
    }],
    bultos: bultos.map((b) => ({
      kilos: b.kilos,
      volumenCm: b.volumenCm3,
      valorDeclaradoSinImpuestos: b.valorDeclarado,
      altoCm: b.altoCm, largoCm: b.largoCm, anchoCm: b.anchoCm,
      referencias: [
        { meta: 'idCliente', contenido: String(pedidoId) },
        ...(b.observaciones ? [{ meta: 'observaciones', contenido: b.observaciones }] : []),
      ],
    })),
  };
  const res = await llamar('/v2/ordenes-de-envio', { method: 'POST', body });
  return res.json();
}

// --- Estado de la orden (Pendiente / Solicitado / Creado / Rechazado)
export async function estadoOrden(numeroDeEnvio) {
  return (await llamar(`/v2/ordenes-de-envio/${encodeURIComponent(numeroDeEnvio)}`)).json();
}

// --- Etiqueta: GET /v2/ordenes-de-envio/{agrupadorDeBultos}/etiquetas  -> PDF (o ZPL)
export async function obtenerEtiqueta(agrupadorOnumero, { formato = 'pdf', bulto } = {}) {
  const q = bulto ? `?bulto=${encodeURIComponent(bulto)}` : '';
  const accept = formato === 'zpl' ? 'application/zpl' : 'application/pdf';
  const res = await llamar(`/v2/ordenes-de-envio/${encodeURIComponent(agrupadorOnumero)}/etiquetas${q}`, { accept });
  return { contentType: res.headers.get('content-type') || accept, data: Buffer.from(await res.arrayBuffer()) };
}

// --- Seguimiento (v3)
export async function estadoEnvio(numeroAndreani) {
  return (await llamar(`/v3/envios/${encodeURIComponent(numeroAndreani)}`)).json();
}
export async function trazasEnvio(numeroAndreani) {
  return (await llamar(`/v3/envios/${encodeURIComponent(numeroAndreani)}/trazas`)).json(); // { eventos: [...] }
}

// --- Sucursales (no requiere token)
export async function sucursales(params = {}) {
  const q = new URLSearchParams(params).toString();
  return (await llamar(`/v2/sucursales${q ? `?${q}` : ''}`, { auth: false })).json();
}
