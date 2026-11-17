// GET /api/envios/etiqueta?agrupador=API0000000428931&key=TU_ADMIN_KEY   (PRIVADO) -> PDF para imprimir
import { obtenerEtiqueta } from '../../lib/andreani.js';

export default async function handler(req, res) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  const { agrupador } = req.query;
  if (!agrupador) return res.status(400).json({ error: 'Falta agrupador' });
  try {
    const { contentType, data } = await obtenerEtiqueta(agrupador);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="etiqueta-${agrupador}.pdf"`);
    res.status(200).send(data);
  } catch (e) {
    console.error(e, e.body);
    res.status(502).json({ error: 'No se pudo obtener la etiqueta', detalle: e.body || e.message });
  }
}
