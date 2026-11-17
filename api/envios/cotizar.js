// POST /api/envios/cotizar   (público: lo llama el checkout)
// body: { cp: "1425", items: [{ slug: "mopa-plana-premium", cantidad: 1 }] }
import { cotizar } from '../../lib/andreani.js';
import { carritoABulto } from '../../lib/envio-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' });
  try {
    const { cp, items } = req.body || {};
    if (!/^\d{4}$/.test(String(cp || ''))) return res.status(400).json({ error: 'Código postal inválido (4 dígitos)' });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Carrito vacío' });
    const bulto = carritoABulto(items);
    const t = await cotizar({ cpDestino: cp, bultos: [bulto] });
    res.status(200).json({ precio: Number(t.tarifaConIva.total), moneda: 'ARS', detalle: t });
  } catch (e) {
    console.error(e, e.body);
    res.status(e.status === 400 ? 400 : 502).json({ error: 'No se pudo cotizar el envío', detalle: e.body || e.message });
  }
}
