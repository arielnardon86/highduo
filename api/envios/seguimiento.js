// GET /api/envios/seguimiento?numero=360000101651699   (público: para la página "seguí tu pedido")
import { estadoEnvio, trazasEnvio } from '../../lib/andreani.js';

export default async function handler(req, res) {
  const numero = String(req.query.numero || '');
  if (!/^\d{6,20}$/.test(numero)) return res.status(400).json({ error: 'Número de envío inválido' });
  try {
    const [estado, trazas] = await Promise.all([estadoEnvio(numero), trazasEnvio(numero).catch(() => ({ eventos: [] }))]);
    res.setHeader('Cache-Control', 's-maxage=300'); // 5 min
    res.status(200).json({
      numero,
      estado: estado.estado,
      fechaEstado: estado.fechaEstado,
      eventos: (trazas.eventos || []).map((ev) => ({
        fecha: ev.Fecha, estado: ev.Estado || ev.Evento, motivo: ev.Motivo, sucursal: ev.Sucursal,
      })),
    });
  } catch (e) {
    res.status(e.status === 404 ? 404 : 502).json({ error: 'No se encontró el envío' });
  }
}
