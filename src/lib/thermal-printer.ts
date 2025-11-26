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
   * Optimizado para 58mm - cada producto en UNA sola línea
   */
  generatePlainTextReceipt(sale: PrinterSale): string {
    const width = this.config.charsPerLine;
    
    const center = (text: string) => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const line = (label: string, value: string) => {
      const maxLabel = width - value.length - 1;
      const truncLabel = label.length > maxLabel ? label.substring(0, maxLabel) : label;
      const spacing = Math.max(1, width - truncLabel.length - value.length);
      return truncLabel + ' '.repeat(spacing) + value;
    };

    const sep = () => '='.repeat(width);

    let r = '\r\n';

    // Encabezado compacto
    r += center('UNIK RETAIL') + '\r\n';
    r += center('Gestion Inventario') + '\r\n';
    r += sep() + '\r\n';
    
    // Info básica en una línea cada una
    r += `No: ${sale.numeroFactura}\r\n`;
    const f = new Date(sale.fechaVenta);
    r += `${f.toLocaleDateString('es-CO')} ${f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\r\n`;
    
    // Cliente si existe
    if (sale.cliente?.nombre) {
      const nomCorto = sale.cliente.nombre.substring(0, width - 5);
      r += `Cli: ${nomCorto}\r\n`;
      if (sale.cliente.cedula) {
        r += `CC: ${sale.cliente.cedula}\r\n`;
      }
    }
    
    r += sep() + '\r\n';

    // Productos - CADA UNO EN UNA SOLA LÍNEA
    // Formato: NombreCorto Cant Precio
    for (const item of sale.items) {
      const cant = `${item.cantidad}x`;
      const precio = `$${(item.precioTotal / 1000).toFixed(0)}k`;
      
      // Calcular espacio disponible para nombre
      const espacioInfo = cant.length + precio.length + 2; // +2 para espacios
      const maxNom = width - espacioInfo;
      
      let nom = item.nombreProducto;
      if (nom.length > maxNom) {
        nom = nom.substring(0, maxNom - 2) + '..';
      }
      
      // Armar línea: "Nombre 2x $10k"
      const espacioRestante = width - nom.length - espacioInfo;
      r += nom + ' '.repeat(espacioRestante + 1) + cant + ' ' + precio + '\r\n';
    }

    r += sep() + '\r\n';

    // Totales compactos
    const formatMoney = (val: number) => `$${(val / 1000).toFixed(1)}k`;
    
    r += line('Subtotal:', formatMoney(sale.subtotal)) + '\r\n';

    if (sale.descuento > 0) {
      const descMonto = (sale.subtotal * sale.descuento) / 100;
      r += line(`Desc ${sale.descuento}%:`, `-${formatMoney(descMonto)}`) + '\r\n';
    }

    if (sale.impuesto > 0) {
      r += line('Impuesto:', formatMoney(sale.impuesto)) + '\r\n';
    }

    r += sep() + '\r\n';
    r += line('TOTAL:', formatMoney(sale.total)) + '\r\n';
    r += sep() + '\r\n';
    r += center(`Pago: ${sale.metodoPago.toUpperCase()}`) + '\r\n';
    r += '\r\n';
    
    if (sale.notas) {
      r += `Nota: ${sale.notas}\r\n\r\n`;
    }
    
    r += center('Gracias por su compra') + '\r\n';
    r += center('Vuelva pronto!') + '\r\n';
    r += '\r\n\r\n';

    return r;
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
 * Ancho predeterminado: 58mm (32 caracteres)
 */
export async function printThermalReceipt(sale: PrinterSale, paperWidth: 58 | 80 = 58, usePlainText: boolean = true): Promise<void> {
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
