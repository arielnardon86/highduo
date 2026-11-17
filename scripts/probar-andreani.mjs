// Prueba rápida contra Andreani (QA por defecto) sin deployar nada.
// Uso:
//   node --env-file=.env scripts/probar-andreani.mjs cotizar 1425
//   node --env-file=.env scripts/probar-andreani.mjs crear 1425
//   node --env-file=.env scripts/probar-andreani.mjs etiqueta API0000000428931
//   node --env-file=.env scripts/probar-andreani.mjs seguimiento 360000101651699
import { writeFileSync } from 'node:fs';
import * as andreani from '../lib/andreani.js';
import { ORIGEN, REMITENTE, carritoABulto } from '../lib/envio-config.js';

const [cmd, arg] = process.argv.slice(2);
const bulto = carritoABulto([{ slug: 'mopa-plana-premium', cantidad: 1 }]);

try {
  if (cmd === 'cotizar') {
    console.log(await andreani.cotizar({ cpDestino: arg || '1425', bultos: [bulto] }));
  } else if (cmd === 'crear') {
    const r = await andreani.crearOrden({
      pedidoId: `TEST-${Date.now()}`, origen: ORIGEN, remitente: REMITENTE, bultos: [bulto],
      destinatario: { nombreCompleto: 'Cliente Prueba', email: 'prueba@example.com', documentoNumero: '30000000', telefono: '1100000000' },
      destino: { codigoPostal: arg || '1425', calle: 'Av Santa Fe', numero: '3000', localidad: 'CABA', region: 'AR-C', pais: 'Argentina' },
    });
    console.log(JSON.stringify(r, null, 2));
  } else if (cmd === 'etiqueta') {
    const { data } = await andreani.obtenerEtiqueta(arg);
    writeFileSync(`etiqueta-${arg}.pdf`, data);
    console.log(`Guardada etiqueta-${arg}.pdf`);
  } else if (cmd === 'seguimiento') {
    console.log(await andreani.estadoEnvio(arg), await andreani.trazasEnvio(arg));
  } else if (cmd === 'login') {
    console.log('Token OK:', (await andreani.obtenerToken()).slice(0, 12) + '…');
  } else {
    console.log('Comandos: login | cotizar <cp> | crear <cp> | etiqueta <agrupador> | seguimiento <numero>');
  }
} catch (e) {
  console.error(e.message, JSON.stringify(e.body, null, 2) || '');
  process.exit(1);
}
