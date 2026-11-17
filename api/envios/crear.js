// POST /api/envios/crear   (PRIVADO: header x-admin-key)
// Llamalo desde tu webhook de Mercado Pago cuando el pago quede aprobado, o a mano desde tu panel.
// body: { pedidoId, items: [{slug,cantidad}], destinatario: {nombreCompleto,email,documentoNumero,telefono},
//         destino: { codigoPostal, calle, numero, piso?, departamento?, localidad, region } | { sucursalId } }
import { crearOrden } from '../../lib/andreani.js';
import { ORIGEN, REMITENTE, carritoABulto } from '../../lib/envio-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' });
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const { pedidoId, items, destinatario, destino } = req.body || {};
    if (!pedidoId || !items || !destinatario || !destino) return res.status(400).json({ error: 'Faltan datos' });
    const orden = await crearOrden({
      pedidoId, origen: ORIGEN, remitente: REMITENTE, destinatario,
      destino: destino.sucursalId ? destino : { pais: 'Argentina', ...destino },
      bultos: [carritoABulto(items)],
    });
    // Guardá en tu base de datos: orden.agrupadorDeBultos (para la etiqueta) y orden.bultos[0].numeroDeEnvio (tracking)
    res.status(200).json({
      estado: orden.estado,
      agrupadorDeBultos: orden.agrupadorDeBultos,
      numeroDeEnvio: orden.bultos?.[0]?.numeroDeEnvio,
      orden,
    });
  } catch (e) {
    console.error(e, e.body);
    res.status(e.status === 400 ? 400 : 502).json({ error: 'No se pudo crear el envío', detalle: e.body || e.message });
  }
}
