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
  async printReceipt(sale: PrinterSale): Promise<void> {
    const receiptData = this.generateReceipt(sale);

    // Crear un Blob con los datos ESC/POS
    const blob = new Blob([receiptData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    try {
      // Intenta enviar directamente a la impresora térmica
      // Esto funciona mejor con la API WebUSB o una app específica
      const response = await fetch('/api/print/thermal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: receiptData
      });

      if (!response.ok) {
        throw new Error('Error al enviar a la impresora');
      }
    } catch (error) {
      console.error('Error en impresión térmica:', error);
      // Fallback: Imprimir como PDF
      throw error;
    } finally {
      URL.revokeObjectURL(url);
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
 * Función auxiliar para imprimir directamente
 */
export async function printThermalReceipt(sale: PrinterSale, paperWidth: 58 | 80 = 80): Promise<void> {
  const printer = new ThermalPrinter({ paperWidth });
  await printer.printReceipt(sale);
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
