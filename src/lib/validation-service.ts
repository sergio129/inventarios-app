/**
 * Servicio de validaciones para inventario
 */

export interface ValidationResult {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

/**
 * Validar código de barras duplicado
 */
export async function validarCodigoBarraDuplicado(
  codigoBarras: string,
  idProductoActual?: string
): Promise<boolean> {
  if (!codigoBarras) return true; // Si está vacío, es válido (campo opcional)

  try {
    const response = await fetch(`/api/products?codigoBarras=${encodeURIComponent(codigoBarras)}`);
    if (response.ok) {
      const products = await response.json();
      // Si hay más de 1 producto o si el único tiene diferente ID, es duplicado
      return products.length === 0 || (products.length === 1 && products[0]._id === idProductoActual);
    }
  } catch (error) {
    console.error('Error validando código de barras:', error);
  }
  return true;
}

/**
 * Validar que el precio de venta sea mayor que el precio de compra
 */
export function validarPreciosCoherentes(
  precioCompra: number,
  precioVenta: number
): { valido: boolean; mensaje: string } {
  if (precioCompra <= 0 || precioVenta <= 0) {
    return {
      valido: false,
      mensaje: 'Los precios deben ser mayores a 0',
    };
  }

  if (precioVenta <= precioCompra) {
    return {
      valido: false,
      mensaje: 'El precio de venta debe ser mayor que el precio de compra',
    };
  }

  // Advertencia si el margen es muy pequeño (<10%)
  const margen = ((precioVenta - precioCompra) / precioCompra) * 100;
  if (margen < 10) {
    return {
      valido: true,
      mensaje: `⚠️ Advertencia: Margen muy pequeño (${margen.toFixed(1)}%). Se recomienda mínimo 10%`,
    };
  }

  return { valido: true, mensaje: '' };
}

/**
 * Validación completa de un producto
 */
export function validarProducto(producto: any): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validar stock
  const totalStock =
    (producto.stockCajas * producto.unidadesPorCaja) + (producto.stockUnidadesSueltas || 0);
  if (totalStock < 0) {
    errores.push('El stock no puede ser negativo');
  }

  // Validar precios
  if (producto.precio <= 0) {
    errores.push('El precio de venta debe ser mayor a 0');
  }

  if (producto.precioCompra <= 0) {
    errores.push('El precio de compra debe ser mayor a 0');
  }

  if (producto.precio > 0 && producto.precioCompra > 0) {
    const preciosValidacion = validarPreciosCoherentes(producto.precioCompra, producto.precio);
    if (!preciosValidacion.valido) {
      errores.push(preciosValidacion.mensaje);
    } else if (preciosValidacion.mensaje) {
      advertencias.push(preciosValidacion.mensaje);
    }
  }

  // Validar cajas
  if (producto.unidadesPorCaja < 1) {
    errores.push('Unidades por caja debe ser mínimo 1');
  }

  // Validar stock mínimo
  if (producto.stockMinimo < 0) {
    errores.push('Stock mínimo no puede ser negativo');
  }

  // Advertencia: stock bajo
  if (totalStock > 0 && totalStock <= 2) {
    advertencias.push('⚠️ Este producto tiene stock bajo');
  }

  // Advertencia: precios de caja inconsistentes
  if (
    producto.precioCaja > 0 &&
    producto.precio > 0 &&
    producto.unidadesPorCaja > 0
  ) {
    const precioEsperadoCaja = producto.precio * producto.unidadesPorCaja;
    const diferencia = Math.abs(producto.precioCaja - precioEsperadoCaja) / precioEsperadoCaja;
    if (diferencia > 0.1) {
      // Más del 10% de diferencia
      advertencias.push(
        `⚠️ Precio de caja inconsistente. Esperado: $${precioEsperadoCaja.toFixed(2)}, Actual: $${producto.precioCaja.toFixed(2)}`
      );
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Validar cambios críticos (para alertar al usuario)
 */
export function validarCambiosCriticos(productoAnterior: any, productoNuevo: any): string[] {
  const alertas: string[] = [];

  // Cambio de precio muy radical
  if (productoAnterior.precio > 0 && productoNuevo.precio > 0) {
    const diferenciaPorcentaje = Math.abs(
      ((productoNuevo.precio - productoAnterior.precio) / productoAnterior.precio) * 100
    );
    if (diferenciaPorcentaje > 50) {
      alertas.push(
        `⚠️ Cambio de precio muy grande (+${diferenciaPorcentaje.toFixed(1)}%). ¿Está seguro?`
      );
    }
  }

  // Reducción de stock muy radical
  const stockAnterior = (productoAnterior.stockCajas * productoAnterior.unidadesPorCaja) + (productoAnterior.stockUnidadesSueltas || 0);
  const stockNuevo = (productoNuevo.stockCajas * productoNuevo.unidadesPorCaja) + (productoNuevo.stockUnidadesSueltas || 0);

  if (stockAnterior > 0 && stockNuevo === 0) {
    alertas.push('⚠️ El stock será 0. ¿Desactivar el producto?');
  }

  return alertas;
}
