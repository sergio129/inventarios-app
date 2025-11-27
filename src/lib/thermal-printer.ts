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
    tipoVenta?: 'unidad' | 'empaque';
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
   * Genera línea de producto con cantidad, tipo, precio y total alineados
   */
  private productLine(
    name: string,
    quantity: number,
    tipoVenta: 'unidad' | 'empaque' | undefined,
    unitPrice: number,
    total: number
  ): string {
    const maxNameLength = this.config.charsPerLine - 15;
    const shortName = name.substring(0, maxNameLength);
    const tipo = tipoVenta === 'empaque' ? 'Cja' : 'Und';

    const line1 = `${shortName}\n`;
    const qtyStr = `x${quantity} ${tipo}`;
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
    
    // Función para limpiar acentos y caracteres especiales
    const cleanText = (text: string) => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^\x00-\x7F]/g, '') // Solo caracteres ASCII
        .toUpperCase();
    };
    
    // Formatear dinero con centavos
    const formatMoney = (val: number) => {
      return `$${val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };
    
    const center = (text: string) => {
      const cleaned = cleanText(text);
      const padding = Math.max(0, Math.floor((width - cleaned.length) / 2));
      return ' '.repeat(padding) + cleaned;
    };

    const line = (label: string, value: string) => {
      const cleanLabel = cleanText(label);
      const maxLabel = width - value.length - 1;
      const truncLabel = cleanLabel.length > maxLabel ? cleanLabel.substring(0, maxLabel) : cleanLabel;
      const spacing = Math.max(1, width - truncLabel.length - value.length);
      return truncLabel + ' '.repeat(spacing) + value;
    };

    const sep = () => '='.repeat(width);

    let r = '\r\n';

    // Encabezado compacto
    r += center('UNIK') + '\r\n';
    r += center('SALSAMENTARIA Y DESECHABLES') + '\r\n';
     r += center('SAN BERNARDO DEL VIENTO') + '\r\n';
    r += center('NIT: 5096823-0') + '\r\n';
    r += sep() + '\r\n';
    
    // Info básica
    r += `No: ${sale.numeroFactura}\r\n`;
    const f = new Date(sale.fechaVenta);
    const fecha = f.toLocaleDateString('es-CO');
    const hora = f.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s*\.\s*/g, ' ');
    r += `${fecha} ${hora}\r\n`;
    
    // Cliente si existe
    if (sale.cliente?.nombre) {
      const nomLimpio = cleanText(sale.cliente.nombre);
      const nomCorto = nomLimpio.substring(0, width - 5);
      r += `Cli: ${nomCorto}\r\n`;
      if (sale.cliente.cedula) {
        r += `CC: ${sale.cliente.cedula}\r\n`;
      }
    }
    
    r += sep() + '\r\n';

    // Productos - Formato compacto
    // "NombreCorto Cant Tipo $Precio"
    for (const item of sale.items) {
      const tipoAbrev = item.tipoVenta === 'empaque' ? 'Cja' : 'Und';
      const cant = `${item.cantidad}x`;
      const precio = formatMoney(item.precioTotal);
      
      // Espacio necesario para cantidad, tipo y precio
      const espacioInfo = cant.length + tipoAbrev.length + precio.length + 3;
      const maxNom = width - espacioInfo;
      
      // Limpiar y acortar nombre de producto
      let nom = cleanText(item.nombreProducto);
      
      // Acortar mucho más para dejar espacio al precio
      if (nom.length > maxNom) {
        nom = nom.substring(0, maxNom);
      }
      
      // Calcular espacios para alinear precio a la derecha
      const espacios = width - nom.length - cant.length - tipoAbrev.length - precio.length - 2;
      r += nom + ' ' + cant + ' ' + tipoAbrev + ' '.repeat(Math.max(1, espacios)) + precio + '\r\n';
    }

    r += sep() + '\r\n';

    // Totales con valores exactos
    r += line('SUBTOTAL:', formatMoney(sale.subtotal)) + '\r\n';

    if (sale.descuento > 0) {
      const descMonto = (sale.subtotal * sale.descuento) / 100;
      r += line(`DESC ${sale.descuento}%:`, `-${formatMoney(descMonto)}`) + '\r\n';
    }

    if (sale.impuesto > 0) {
      r += line('IMPUESTO:', formatMoney(sale.impuesto)) + '\r\n';
    }

    r += sep() + '\r\n';
    r += line('TOTAL:', formatMoney(sale.total)) + '\r\n';
    r += sep() + '\r\n';
    r += center(`PAGO: ${sale.metodoPago}`) + '\r\n';
    r += '\r\n';
    
    if (sale.notas) {
      const notaLimpia = cleanText(sale.notas);
      r += `Nota: ${notaLimpia}\r\n\r\n`;
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
    receipt += this.alignCenter('UNIK') + '\n';
    receipt += this.alignCenter('SALSAMENTARIA Y DESECHABLES') + '\n';
    receipt += this.setBold(false);
    receipt += this.alignCenter('NIT: 5096823-0') + '\n';
    receipt += this.emptyLine();

    // Información de la factura
    receipt += this.setAlign(0); // Izquierda
    receipt += `Factura: ${sale.numeroFactura}\n`;
    const fecha = new Date(sale.fechaVenta);
    receipt += `Fecha: ${fecha.toLocaleDateString('es-CO')}\n`;
    const hora = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s*\.\s*/g, ' ');
    receipt += `Hora: ${hora}\n`;
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
        item.tipoVenta,
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
   * Envía el recibo a la impresora local del navegador
   * Intenta impresión silenciosa automática usando servidor local
   */
  async printReceipt(sale: PrinterSale, usePlainText: boolean = true): Promise<void> {
    try {
      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') {
        throw new Error('printReceipt solo funciona en el navegador');
      }

      // Obtener configuración local
      const configStr = localStorage.getItem('printerConfig');
      const config = configStr ? JSON.parse(configStr) : { 
        printerType: 'windows', 
        autoprint: true,
        printServerUrl: 'http://localhost:3001'
      };

      // Generar contenido
      const receiptData = usePlainText 
        ? this.generatePlainTextReceipt(sale)
        : this.generateReceipt(sale);

      // Intentar impresión automática vía servidor local
      if (config.autoprint && config.printServerUrl) {
        try {
          await this.printViaLocalServer(receiptData, config.printServerUrl, config.printerName);
          console.log('✅ Impresión exitosa vía servidor local');
          return; // Éxito con impresión directa
        } catch (error) {
          console.warn('⚠️ Servidor local no disponible, usando método alternativo:', error);
          // Continuar con fallback
        }
      }

      // Fallback: usar ventana de impresión del navegador
      await this.printToLocalPrinter(receiptData, config.autoprint);
      
    } catch (error) {
      console.error('Error en impresión térmica:', error);
      throw error;
    }
  }

  /**
   * Imprime vía servidor local de impresión (funciona desde Vercel)
   */
  private async printViaLocalServer(
    content: string, 
    serverUrl: string,
    printerName?: string
  ): Promise<void> {
    // Verificar que el servidor esté disponible
    const healthCheck = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
    });

    if (!healthCheck.ok) {
      throw new Error('Servidor de impresión no disponible');
    }

    // Enviar trabajo de impresión
    const response = await fetch(`${serverUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        printerName: printerName || null
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en impresión');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Error desconocido');
    }
  }

  /**
   * Imprime usando la API del navegador (para impresoras locales)
   */
  private async printToLocalPrinter(content: string, autoprint: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Recibo</title>
              <style>
                @media print {
                  @page {
                    size: 58mm auto;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 2mm;
                  }
                }
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 9pt;
                  width: 58mm;
                  white-space: pre-wrap;
                  word-break: break-word;
                  line-height: 1.2;
                }
              </style>
              <script>
                window.onload = function() {
                  window.print();
                  ${autoprint ? 'setTimeout(() => window.close(), 1000);' : ''}
                };
              </script>
            </head>
            <body>${content.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</body>
          </html>
        `;

        // Usar blob URL para abrir en nueva ventana
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Abrir ventana de impresión
        const printWindow = window.open(url, '_blank', 'width=300,height=400');
        
        if (!printWindow) {
          throw new Error('No se pudo abrir ventana de impresión. Verifica que los pop-ups estén habilitados.');
        }

        // Limpiar después de que se cierre la ventana
        const checkClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkClosed);
            URL.revokeObjectURL(url);
            resolve();
          }
        }, 500);

        // Timeout de seguridad
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!printWindow.closed) {
            printWindow.close();
          }
          URL.revokeObjectURL(url);
          resolve();
        }, autoprint ? 5000 : 30000);

      } catch (error) {
        reject(error);
      }
    });
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
