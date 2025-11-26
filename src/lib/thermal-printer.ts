/**
 * Utilidades para impresión térmica ESC/POS
 * Diseñado para impresoras térmicas de recibos de alta velocidad
 * Ancho típico: 80mm (384 caracteres) o 58mm (288 caracteres)
 */

// Comandos ESC/POS
const ESC = '\x1B'; // ESC
const GS = '\x1D'; // GS

interface ThermalPrinterConfig {
  paperWidth?: 58 | 80; // Ancho en mm (58 o 80)
  charsPerLine?: number; // Caracteres por línea (manual override)
}

interface PrinterSale {
  numeroFactura: string;
  cliente?: {
    nombre: string;
    cedula?: string;
    telefono?: string;
  };
  items: Array<{
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
  }>;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  notas?: string;
  fechaVenta: Date;
}

class ThermalPrinter {
  private config: Required<ThermalPrinterConfig>;
  private buffer: string = '';

  constructor(config: ThermalPrinterConfig = {}) {
    const paperWidth = config.paperWidth || 80;
    const charsPerLine = config.charsPerLine || (paperWidth === 58 ? 32 : 48);

    this.config = {
      paperWidth,
      charsPerLine
    };
  }

  /**
   * Reinicializa la impresora
   */
  private reset(): string {
    return `${ESC}@`; // Reiniciar impresora
  }

  /**
   * Establece alineación de texto
   * align: 0 = izquierda, 1 = centro, 2 = derecha
   */
  private setAlign(align: 0 | 1 | 2): string {
    return `${ESC}a${String.fromCharCode(align)}`;
  }

  /**
   * Establece tamaño de fuente
   * size: 0 = normal, 1 = 2x ancho, 2 = 2x alto, 3 = 2x ancho y alto
   */
  private setFontSize(size: 0 | 1 | 2 | 3): string {
    return `${GS}!${String.fromCharCode(size)}`;
  }

  /**
   * Establece negrita
   */
  private setBold(enabled: boolean): string {
    return `${ESC}E${enabled ? '\x01' : '\x00'}`;
  }

  /**
   * Corta el papel (corte total o parcial)
   */
  private cut(partial: boolean = false): string {
    return `${GS}V${partial ? 'B' : 'A'}\x00`;
  }

  /**
   * Línea vacía
   */
  private emptyLine(): string {
    return '\n';
  }

  /**
   * Línea separadora
   */
  private separator(): string {
    return '-'.repeat(this.config.charsPerLine) + '\n';
  }

  /**
   * Alinea texto a la derecha
   */
  private alignRight(text: string): string {
    const padding = Math.max(0, this.config.charsPerLine - text.length);
    return ' '.repeat(padding) + text;
  }

  /**
   * Alinea texto al centro
   */
  private alignCenter(text: string): string {
    const padding = Math.max(0, (this.config.charsPerLine - text.length) / 2);
    return ' '.repeat(Math.floor(padding)) + text;
  }

  /**
   * Genera línea de producto con cantidad, precio y total alineados
   */
  private productLine(
    name: string,
    quantity: number,
    unitPrice: number,
    total: number
  ): string {
    const maxNameLength = this.config.charsPerLine - 15;
    const shortName = name.substring(0, maxNameLength);

    const line1 = `${shortName}\n`;
    const qtyStr = `x${quantity}`;
    const priceStr = `$${unitPrice.toFixed(0)}`;
    const totalStr = `$${total.toFixed(0)}`;

    const spacing1 = Math.max(
      1,
      this.config.charsPerLine - qtyStr.length - priceStr.length
    );
    const line2 = `${qtyStr}${' '.repeat(spacing1)}${priceStr}\n`;

    const spacing2 = Math.max(
      1,
      this.config.charsPerLine - totalStr.length
    );
    const line3 = `${' '.repeat(spacing2)}${totalStr}\n`;

    return line1 + line2 + line3;
  }

  /**
   * Genera línea de total con label y valor
   */
  private totalLine(label: string, value: number, isBold: boolean = false): string {
    const valueStr = `$${value.toFixed(0)}`;
    const spacing = Math.max(1, this.config.charsPerLine - label.length - valueStr.length);
    const line = `${label}${' '.repeat(spacing)}${valueStr}\n`;

    if (isBold) {
      return this.setBold(true) + line + this.setBold(false);
    }
    return line;
  }

  /**
   * Genera el recibo en formato de texto plano (sin comandos ESC/POS)
   * Compatible con impresoras que no soportan ESC/POS correctamente
   */
  generatePlainTextReceipt(sale: PrinterSale): string {
    const center = (text: string) => {
      const padding = Math.max(0, Math.floor((this.config.charsPerLine - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const right = (text: string) => {
      const padding = Math.max(0, this.config.charsPerLine - text.length);
      return ' '.repeat(padding) + text;
    };

    const line = (label: string, value: string) => {
      const spacing = Math.max(1, this.config.charsPerLine - label.length - value.length);
      return label + ' '.repeat(spacing) + value;
    };

    let receipt = '\r\n';

    // Encabezado
    receipt += center('UNIK RETAIL') + '\r\n';
    receipt += center('Sistema de Gestion de Inventario') + '\r\n';
    receipt += center('Factura Electronica') + '\r\n';
    receipt += '\r\n';

    // Información de la factura
    receipt += `Factura: ${sale.numeroFactura}\r\n`;
    receipt += `Fecha: ${new Date(sale.fechaVenta).toLocaleDateString('es-CO')}\r\n`;
    receipt += `Hora: ${new Date(sale.fechaVenta).toLocaleTimeString('es-CO')}\r\n`;
    receipt += '\r\n';

    // Información del cliente
    if (sale.cliente?.nombre) {
      receipt += `Cliente: ${sale.cliente.nombre}\r\n`;
      if (sale.cliente.cedula) {
        receipt += `Cedula: ${sale.cliente.cedula}\r\n`;
      }
      if (sale.cliente.telefono) {
        receipt += `Telefono: ${sale.cliente.telefono}\r\n`;
      }
      receipt += '\r\n';
    }

    // Separador
    receipt += '-'.repeat(this.config.charsPerLine) + '\r\n';

    // Encabezado de productos
    receipt += 'Descripcion\r\n';
    receipt += 'Cant.      Precio    Total\r\n';
    receipt += '-'.repeat(this.config.charsPerLine) + '\r\n';

    // Productos
    for (const item of sale.items) {
      const maxNameLength = this.config.charsPerLine - 2;
      const shortName = item.nombreProducto.substring(0, maxNameLength);
      receipt += `${shortName}\r\n`;
      
      const qtyStr = `x${item.cantidad}`;
      const priceStr = `$${item.precioUnitario.toLocaleString('es-CO')}`;
      const totalStr = `$${item.precioTotal.toLocaleString('es-CO')}`;
      
      receipt += line(qtyStr, priceStr) + '\r\n';
      receipt += right(totalStr) + '\r\n';
    }

    // Separador final
    receipt += '-'.repeat(this.config.charsPerLine) + '\r\n';

    // Totales
    receipt += line('Subtotal:', `$${sale.subtotal.toLocaleString('es-CO')}`) + '\r\n';

    if (sale.descuento > 0) {
      const descuentoMonto = (sale.subtotal * sale.descuento) / 100;
      receipt += line(`Descuento (${sale.descuento}%):`, `-$${descuentoMonto.toLocaleString('es-CO')}`) + '\r\n';
    }

    if (sale.impuesto > 0) {
      receipt += line('Impuesto:', `$${sale.impuesto.toLocaleString('es-CO')}`) + '\r\n';
    }

    receipt += line('TOTAL:', `$${sale.total.toLocaleString('es-CO')}`) + '\r\n';
    receipt += '\r\n';

    // Método de pago
    receipt += center(`Metodo de Pago: ${sale.metodoPago.toUpperCase()}`) + '\r\n';
    receipt += '\r\n';

    // Notas
    if (sale.notas) {
      receipt += `Notas: ${sale.notas}\r\n`;
      receipt += '\r\n';
    }

    // Pie de página
    receipt += center('Gracias por su compra') + '\r\n';
    receipt += center('Vuelva pronto!') + '\r\n';
    receipt += '\r\n\r\n\r\n\r\n';

    return receipt;
  }

  /**
   * Genera el recibo completo en formato ESC/POS
   */
  generateReceipt(sale: PrinterSale): string {
    let receipt = '';

    // Reiniciar
    receipt += this.reset();

    // Encabezado
    receipt += this.setAlign(1); // Centrado
    receipt += this.setBold(true);
    receipt += this.alignCenter('UNIK RETAIL') + '\n';
    receipt += this.setBold(false);
    receipt += this.alignCenter('Sistema de Gestión de Inventario') + '\n';
    receipt += this.alignCenter('Factura Electrónica') + '\n';
    receipt += this.emptyLine();

    // Información de la factura
    receipt += this.setAlign(0); // Izquierda
    receipt += `Factura: ${sale.numeroFactura}\n`;
    receipt += `Fecha: ${new Date(sale.fechaVenta).toLocaleDateString('es-CO')}\n`;
    receipt += `Hora: ${new Date(sale.fechaVenta).toLocaleTimeString('es-CO')}\n`;
    receipt += this.emptyLine();

    // Información del cliente
    if (sale.cliente?.nombre) {
      receipt += this.setBold(true);
      receipt += `Cliente: ${sale.cliente.nombre}\n`;
      receipt += this.setBold(false);
      if (sale.cliente.cedula) {
        receipt += `Cédula: ${sale.cliente.cedula}\n`;
      }
      if (sale.cliente.telefono) {
        receipt += `Teléfono: ${sale.cliente.telefono}\n`;
      }
      receipt += this.emptyLine();
    }

    // Separador
    receipt += this.separator();

    // Encabezado de productos
    receipt += this.setBold(true);
    receipt += `Descripción\n`;
    receipt += `Cant.      Precio    Total\n`;
    receipt += this.setBold(false);
    receipt += this.separator();

    // Productos
    for (const item of sale.items) {
      receipt += this.productLine(
        item.nombreProducto,
        item.cantidad,
        item.precioUnitario,
        item.precioTotal
      );
    }

    // Separador final
    receipt += this.separator();

    // Totales
    receipt += this.totalLine('Subtotal:', sale.subtotal);

    if (sale.descuento > 0) {
      const descuentoMonto = (sale.subtotal * sale.descuento) / 100;
      receipt += this.totalLine(`Descuento (${sale.descuento}%)`, -descuentoMonto);
    }

    if (sale.impuesto > 0) {
      receipt += this.totalLine('Impuesto:', sale.impuesto);
    }

    receipt += this.totalLine('TOTAL:', sale.total, true);
    receipt += this.emptyLine();

    // Método de pago
    receipt += this.setAlign(1);
    receipt += `Método de Pago: ${sale.metodoPago.toUpperCase()}\n`;
    receipt += this.emptyLine();

    // Notas
    if (sale.notas) {
      receipt += this.setAlign(0);
      receipt += `Notas: ${sale.notas}\n`;
      receipt += this.emptyLine();
    }

    // Pie de página
    receipt += this.setAlign(1);
    receipt += this.alignCenter('Gracias por su compra') + '\n';
    receipt += this.alignCenter('¡Vuelva pronto!') + '\n';
    receipt += this.emptyLine();

    // Cortar papel
    receipt += this.cut(false); // Corte total

    return receipt;
  }

  /**
   * Envía el recibo a la impresora por defecto del navegador
   * Nota: Requiere que la impresora esté configurada en el SO
   */
  async printReceipt(sale: PrinterSale, usePlainText: boolean = true): Promise<void> {
    // Usar texto plano por defecto para mejor compatibilidad
    const receiptData = usePlainText 
      ? this.generatePlainTextReceipt(sale)
      : this.generateReceipt(sale);

    try {
      // Enviar a la impresora térmica
      const response = await fetch('/api/print/thermal', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: receiptData
      });

      if (!response.ok) {
        throw new Error('Error al enviar a la impresora');
      }
    } catch (error) {
      console.error('Error en impresión térmica:', error);
      throw error;
    }
  }

  /**
   * Genera vista previa en HTML (para debugging)
   */
  generatePreview(sale: PrinterSale): string {
    const receipt = this.generateReceipt(sale);
    const escaped = receipt
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    return `
      <div style="font-family: monospace; white-space: pre-wrap; background: #f5f5f5; padding: 20px; border-radius: 4px; max-width: 400px; margin: 20px auto;">
        ${escaped}
      </div>
    `;
  }
}

/**
 * Función auxiliar para imprimir directamente (usa texto plano por defecto)
 */
export async function printThermalReceipt(sale: PrinterSale, paperWidth: 58 | 80 = 80, usePlainText: boolean = true): Promise<void> {
  const printer = new ThermalPrinter({ paperWidth });
  await printer.printReceipt(sale, usePlainText);
}

/**
 * Función para generar vista previa
 */
export function generateThermalPreview(sale: PrinterSale, paperWidth: 58 | 80 = 80): string {
  const printer = new ThermalPrinter({ paperWidth });
  return printer.generatePreview(sale);
}

export { ThermalPrinter };
export type { ThermalPrinterConfig, PrinterSale };
