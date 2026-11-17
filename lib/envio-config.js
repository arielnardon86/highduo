// Datos de envío de cada producto y del depósito de origen.
// ⚠️ COMPLETAR con medidas y pesos REALES del paquete ya embalado (no del producto suelto).
// Las tarifas de Andreani se calculan por peso aforado (volumen), así que esto importa.

export const PRODUCTOS = {
  'cepillo-extensible-multiuso':            { kilos: 0.6, altoCm: 10, largoCm: 60, anchoCm: 10, precio: 0 },
  'escobilla-inodoro-base-adhesiva':        { kilos: 0.4, altoCm: 12, largoCm: 40, anchoCm: 12, precio: 0 },
  'kit-repuesto-microfibra':                { kilos: 0.2, altoCm: 5,  largoCm: 25, anchoCm: 20, precio: 0 },
  'limpiavidrios-3en1-extensible':          { kilos: 0.7, altoCm: 10, largoCm: 60, anchoCm: 15, precio: 0 },
  'mopa-plana-premium':                     { kilos: 1.2, altoCm: 10, largoCm: 70, anchoCm: 15, precio: 0 },
  'mopa-ultra-absorbente-pva':              { kilos: 1.0, altoCm: 10, largoCm: 70, anchoCm: 15, precio: 0 },
  'organizador-porta-escoba-adhesivo':      { kilos: 0.3, altoCm: 5,  largoCm: 30, anchoCm: 10, precio: 0 },
  'secador-piso-vidrios-multifuncional':    { kilos: 0.8, altoCm: 10, largoCm: 60, anchoCm: 15, precio: 0 },
  'set-escoba-pala-plegable':               { kilos: 1.5, altoCm: 15, largoCm: 80, anchoCm: 30, precio: 0 },
};

// Dirección desde donde despachás (completar).
export const ORIGEN = {
  codigoPostal: process.env.ORIGEN_CP || '0000',
  calle: process.env.ORIGEN_CALLE || 'COMPLETAR',
  numero: process.env.ORIGEN_NUMERO || '0',
  localidad: process.env.ORIGEN_LOCALIDAD || 'COMPLETAR',
  region: process.env.ORIGEN_PROVINCIA || '',
  pais: 'Argentina',
};

export const REMITENTE = {
  nombreCompleto: process.env.REMITENTE_NOMBRE || 'High Duo',
  email: process.env.REMITENTE_EMAIL || '',
  documentoTipo: 'CUIT',
  documentoNumero: process.env.REMITENTE_CUIT || '',
  telefono: process.env.REMITENTE_TELEFONO || '',
};

// Convierte un carrito [{ slug, cantidad }] en UN bulto (B2C admite 1 bulto de hasta 50 kg).
// Simplificación: suma pesos y volúmenes. Si mandás cajas grandes, ajustá esto.
export function carritoABulto(items) {
  let kilos = 0, volumenCm3 = 0, valorDeclarado = 0;
  for (const { slug, cantidad = 1 } of items) {
    const p = PRODUCTOS[slug];
    if (!p) throw new Error(`Producto desconocido: ${slug}`);
    const n = Math.max(1, Math.floor(Number(cantidad)));
    kilos += p.kilos * n;
    volumenCm3 += p.altoCm * p.largoCm * p.anchoCm * n;
    valorDeclarado += (p.precio || 0) * n;
  }
  if (kilos > 50) throw new Error('El pedido supera 50 kg: requiere contrato B2B');
  return { kilos: Number(kilos.toFixed(2)), volumenCm3: Math.ceil(volumenCm3), valorDeclarado };
}
