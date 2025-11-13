/**
 * Calcula el descuento máximo permitido basado en las ganancias de los productos
 * El descuento no puede ser mayor al 50% de la ganancia total de los productos
 * 
 * @param items - Array de items del carrito
 * @param products - Objeto con los productos (mapa de _id a producto)
 * @returns Descuento máximo permitido como porcentaje
 */
export function calcularDescuentoMaximo(
  items: Array<{
    producto: string;
    cantidad: number;
    tipoVenta: 'unidad' | 'empaque';
    precioUnitario: number;
    precioTotal: number;
  }>,
  products: Map<string, any> | Record<string, any>
): number {
  let subtotal = 0;
  let gananciaTotal = 0;

  // Si es un Map
  const productMap = products instanceof Map 
    ? products 
    : new Map(Object.entries(products || {}));

  for (const item of items) {
    const product = productMap.get(item.producto);
    
    if (!product) continue;

    const precioVenta = item.precioUnitario;
    const precioCompra = item.tipoVenta === 'empaque'
      ? (product.precioCompraCaja || product.precioCompra)
      : product.precioCompra;

    const gananciaUnitaria = precioVenta - precioCompra;
    const gananciaItem = gananciaUnitaria * item.cantidad;

    subtotal += item.precioTotal;
    gananciaTotal += gananciaItem;
  }

  // Si no hay ganancia o subtotal, no permitir descuento
  if (subtotal <= 0 || gananciaTotal <= 0) {
    return 0;
  }

  // El descuento máximo es el 50% de la ganancia total
  const descuentoMaximoEnDinero = (gananciaTotal * 50) / 100;
  
  // Convertir a porcentaje
  const descuentoMaximoEnPorcentaje = (descuentoMaximoEnDinero / subtotal) * 100;

  // Redondear a 2 decimales
  return Math.round(descuentoMaximoEnPorcentaje * 100) / 100;
}

/**
 * Valida si un descuento es válido basado en las ganancias
 * 
 * @param descuentoPorcentaje - Descuento propuesto en porcentaje
 * @param items - Array de items del carrito
 * @param products - Objeto con los productos
 * @returns true si el descuento es válido, false si excede el máximo
 */
export function esDescuentoValido(
  descuentoPorcentaje: number,
  items: Array<{
    producto: string;
    cantidad: number;
    tipoVenta: 'unidad' | 'empaque';
    precioUnitario: number;
    precioTotal: number;
  }>,
  products: Map<string, any> | Record<string, any>
): boolean {
  const descuentoMaximo = calcularDescuentoMaximo(items, products);
  return descuentoPorcentaje <= descuentoMaximo;
}

/**
 * Obtiene un mensaje descriptivo del límite de descuento
 */
export function obtenerMensajeDescuentoMaximo(
  descuentoMaximo: number,
  subtotal: number
): string {
  const descuentoMaximoEnDinero = (subtotal * descuentoMaximo) / 100;
  return `Descuento máximo permitido: ${descuentoMaximo.toFixed(2)}% ($${descuentoMaximoEnDinero.toFixed(2)})`;
}
