import jsPDF from 'jspdf';
import { CompanyConfig } from '@/hooks/useCompanyConfig';

interface Sale {
  _id: string;
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
  estado: string;
  vendedor?: {
    name: string;
    email: string;
  };
  notas?: string;
  fechaVenta: Date;
  fechaCreacion: Date;
}

// Valores por defecto
const DEFAULT_CONFIG: Partial<CompanyConfig> = {
  nombreEmpresa: 'inventarios-app',
  labels: {
    nombreApp: 'inventarios-app',
    subtitulo: 'Sistema de Gestión de Inventario',
    factura_titulo: 'Factura',
  } as any,
};

export const generateInvoicePDF = async (sale: Sale, config?: CompanyConfig): Promise<void> => {
  try {
    // Usar config proporcionada o valores por defecto
    const finalConfig = config || (DEFAULT_CONFIG as CompanyConfig);
    
    // Crear PDF directamente con jsPDF sin usar html2canvas
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Configurar fuente y colores
    pdf.setFont('helvetica', 'normal');

    // Función helper para agregar texto con wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, fontWeight: 'normal' | 'bold' = 'normal') => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontWeight);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Función helper para centrar texto
    const centerText = (text: string, y: number, fontSize: number = 12, fontWeight: 'normal' | 'bold' = 'normal') => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontWeight);
      const textWidth = pdf.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      pdf.text(text, x, y);
      return y + fontSize * 0.6;
    };

    // Header con valores dinámicos - Mejorado
    // Nombre de la empresa (grande y destacado)
    yPosition = centerText(finalConfig.nombreEmpresa || 'inventarios-app', yPosition, 24, 'bold');
    yPosition += 3;
    
    // Subtítulo
    yPosition = centerText(finalConfig.labels?.subtitulo || 'Sistema de Gestión de Inventario', yPosition, 11, 'normal');
    yPosition += 2;
    
    // Tipo de documento
    yPosition = centerText(finalConfig.labels?.factura_titulo || 'Factura', yPosition, 14, 'bold');
    yPosition += 1;
    
    // Línea separadora decorativa
    pdf.setLineWidth(1);
    pdf.setDrawColor(37, 99, 235); // Azul
    pdf.line(margin + 30, yPosition + 2, pageWidth - margin - 30, yPosition + 2);
    yPosition += 10;

    // Información de la venta y cliente - Mejorado
    const leftColumnX = margin;
    const rightColumnX = pageWidth / 2 + 5;
    const colWidth = (pageWidth - 2 * margin) / 2 - 5;

    // Información de la venta (izquierda)
    pdf.setFillColor(245, 245, 245); // Gris claro
    pdf.rect(leftColumnX, yPosition - 4, colWidth, 6, 'F');
    
    yPosition = addText('INFORMACIÓN DE LA VENTA', leftColumnX + 2, yPosition, colWidth - 4, 11, 'bold');
    yPosition += 5;
    yPosition = addText(`Factura: ${sale.numeroFactura}`, leftColumnX + 2, yPosition, colWidth - 4, 9);
    yPosition += 4;
    yPosition = addText(`Fecha: ${new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(sale.fechaVenta))}`, leftColumnX + 2, yPosition, colWidth - 4, 9);
    yPosition += 4;
    yPosition = addText(`Estado: ${sale.estado}`, leftColumnX + 2, yPosition, colWidth - 4, 9);
    yPosition += 4;
    if (sale.vendedor) {
      yPosition = addText(`Vendedor: ${sale.vendedor.name}`, leftColumnX + 2, yPosition, colWidth - 4, 9);
      yPosition += 2;
    }

    // Información del cliente (derecha) - Alineada con la izquierda
    let rightYPosition = margin;
    pdf.setFillColor(245, 245, 245); // Gris claro
    pdf.rect(rightColumnX, rightYPosition - 4, colWidth, 6, 'F');
    
    rightYPosition = addText('INFORMACIÓN DEL CLIENTE', rightColumnX + 2, rightYPosition, colWidth - 4, 11, 'bold');
    rightYPosition += 5;
    rightYPosition = addText(`Nombre: ${sale.cliente?.nombre || 'Cliente General'}`, rightColumnX + 2, rightYPosition, colWidth - 4, 9);
    rightYPosition += 4;
    if (sale.cliente?.cedula) {
      rightYPosition = addText(`Cédula: ${sale.cliente.cedula}`, rightColumnX + 2, rightYPosition, colWidth - 4, 9);
      rightYPosition += 4;
    }
    if (sale.cliente?.telefono) {
      rightYPosition = addText(`Teléfono: ${sale.cliente.telefono}`, rightColumnX + 2, rightYPosition, colWidth - 4, 9);
      rightYPosition += 2;
    }

    // Usar la posición más baja entre las dos columnas
    yPosition = Math.max(yPosition, rightYPosition) + 10;

    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    // Tabla de productos - Mejorada
    yPosition = addText(finalConfig.labels?.factura_productos || 'DETALLES DE PRODUCTOS', margin, yPosition, pageWidth - 2 * margin, 11, 'bold');
    yPosition += 8;

    // Headers de tabla con fondo azul
    const tableStartY = yPosition;
    const colWidths = [80, 20, 35, 35]; // Ancho de cada columna
    const colPositions = [margin];
    for (let i = 1; i < colWidths.length; i++) {
      colPositions.push(colPositions[i-1] + colWidths[i-1]);
    }

    // Dibujar headers con fondo azul
    pdf.setFillColor(37, 99, 235); // Azul
    pdf.rect(margin, yPosition - 6, pageWidth - 2 * margin, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255); // Texto blanco
    pdf.text(finalConfig.labels?.producto_nombre || 'Producto', colPositions[0] + 2, yPosition - 1);
    pdf.text(finalConfig.labels?.factura_cantidad || 'Cant.', colPositions[1] + 2, yPosition - 1);
    pdf.text(finalConfig.labels?.factura_precio_unitario || 'Precio Unit.', colPositions[2] + 2, yPosition - 1);
    pdf.text(finalConfig.labels?.factura_total || 'Total', colPositions[3] + 2, yPosition - 1);

    yPosition += 5;
    pdf.setTextColor(0, 0, 0); // Texto negro

    // Líneas de productos
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    sale.items.forEach((item, index) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;

        // Repetir headers en nueva página
        pdf.setFillColor(37, 99, 235);
        pdf.rect(margin, yPosition - 6, pageWidth - 2 * margin, 7, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text(finalConfig.labels?.producto_nombre || 'Producto', colPositions[0] + 2, yPosition - 1);
        pdf.text(finalConfig.labels?.factura_cantidad || 'Cant.', colPositions[1] + 2, yPosition - 1);
        pdf.text(finalConfig.labels?.factura_precio_unitario || 'Precio Unit.', colPositions[2] + 2, yPosition - 1);
        pdf.text(finalConfig.labels?.factura_total || 'Total', colPositions[3] + 2, yPosition - 1);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
      }

      // Dibujar fila con colores alternados
      const rowHeight = 6;
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250); // Gris muy claro
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, rowHeight, 'F');
      }

      // Texto de las celdas
      const productName = item.nombreProducto.length > 25 ? item.nombreProducto.substring(0, 22) + '...' : item.nombreProducto;
      pdf.text(productName, colPositions[0] + 2, yPosition);
      pdf.text(item.cantidad.toString(), colPositions[1] + 2, yPosition);
      pdf.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precioUnitario), colPositions[2] + 2, yPosition);
      pdf.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precioTotal), colPositions[3] + 2, yPosition);

      yPosition += rowHeight;
    });

    // Bordes de tabla mejorado
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, tableStartY - 6, pageWidth - 2 * margin, yPosition - tableStartY + 6);

    yPosition += 12;

    // Verificar si necesitamos una nueva página para totales
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
    }

    // Totales (columna derecha) - Mejorado
    const totalsX = pageWidth - margin - 90;
    const totalsWidth = 90;
    
    // Fondo para la sección de totales
    pdf.setFillColor(245, 245, 245);
    pdf.rect(totalsX - 5, yPosition - 4, totalsWidth + 5, 2, 'F'); // Solo para el título
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('RESUMEN', totalsX - 5, yPosition);
    yPosition += 8;

    // Líneas de totales
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    pdf.text(`${finalConfig.labels?.factura_subtotal || 'Subtotal'}:`, totalsX - 5, yPosition);
    pdf.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.subtotal), pageWidth - margin - 20, yPosition, { align: 'right' });
    yPosition += 5;
    
    if (sale.descuento > 0) {
      pdf.text(`${finalConfig.labels?.factura_descuento || 'Descuento'} (${sale.descuento}%):`, totalsX - 5, yPosition);
      pdf.setTextColor(34, 197, 94); // Verde
      pdf.text('-' + new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((sale.subtotal * sale.descuento) / 100), pageWidth - margin - 20, yPosition, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      yPosition += 5;
    }
    
    if (sale.impuesto > 0) {
      pdf.text(`${finalConfig.labels?.factura_impuesto || 'Impuesto'}:`, totalsX - 5, yPosition);
      pdf.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.impuesto), pageWidth - margin - 20, yPosition, { align: 'right' });
      yPosition += 5;
    }

    // Línea separadora para total
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(37, 99, 235); // Azul
    pdf.line(totalsX - 5, yPosition + 1, pageWidth - margin, yPosition + 1);
    yPosition += 6;

    // Total - Destacado
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(37, 99, 235);
    pdf.text(`${finalConfig.labels?.factura_total || 'TOTAL'}:`, totalsX - 5, yPosition);
    pdf.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.total), pageWidth - margin - 20, yPosition, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    yPosition += 7;

    // Método de pago
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`${finalConfig.labels?.factura_metodo_pago || 'Método de pago'}: ${sale.metodoPago}`, totalsX - 5, yPosition);

    yPosition += 15;

    // Notas si existen
    if (sale.notas) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }
      yPosition = addText('NOTAS:', margin, yPosition, pageWidth - 2 * margin, 10, 'bold');
      yPosition += 5;
      yPosition = addText(sale.notas, margin, yPosition, pageWidth - 2 * margin, 9);
      yPosition += 10;
    }

    // Footer
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    const footerText = `Gracias por su compra en ${finalConfig.nombreEmpresa || 'inventarios-app'} - Factura generada automáticamente`;
    const footerWidth = pdf.getTextWidth(footerText);
    const footerX = (pageWidth - footerWidth) / 2;
    pdf.text(footerText, footerX, pageHeight - 15);

    // Descargar PDF
    const fileName = `Factura-${sale.numeroFactura.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

export const printInvoice = (sale: Sale, config?: CompanyConfig): void => {
  // Usar config proporcionada o valores por defecto
  const finalConfig = config || (DEFAULT_CONFIG as CompanyConfig);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Factura ${sale.numeroFactura}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: white;
          color: black;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          font-size: 32px;
          margin: 0;
          font-weight: bold;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-section > div {
          flex: 1;
        }
        .info-section h3 {
          color: #111827;
          font-size: 18px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e5e7eb;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f9fafb;
          font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .totals {
          display: flex;
          justify-content: flex-end;
        }
        .totals > div {
          width: 250px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 18px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        .footer {
          text-align: center;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          color: #9ca3af;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>${finalConfig.nombreEmpresa || 'inventarios-app'}</h1>
          <p>${finalConfig.labels?.subtitulo || 'Sistema de Gestión de Inventario'}</p>
          <p>${finalConfig.labels?.factura_titulo || 'Factura'} Electrónica</p>
        </div>

        <div class="info-section">
          <div>
            <h3>Información de la Venta</h3>
            <p><strong>Factura:</strong> ${sale.numeroFactura}</p>
            <p><strong>Fecha:</strong> ${new Intl.DateTimeFormat('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(sale.fechaVenta))}</p>
            <p><strong>Estado:</strong> ${sale.estado}</p>
            ${sale.vendedor ? `<p><strong>Vendedor:</strong> ${sale.vendedor.name}</p>` : ''}
          </div>
          <div>
            <h3>Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${sale.cliente?.nombre || 'Cliente General'}</p>
            ${sale.cliente?.cedula ? `<p><strong>Cédula:</strong> ${sale.cliente.cedula}</p>` : ''}
            ${sale.cliente?.telefono ? `<p><strong>Teléfono:</strong> ${sale.cliente.telefono}</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-center">Cant.</th>
              <th class="text-right">Precio Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.nombreProducto}</td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-right">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precioUnitario)}</td>
                <td class="text-right">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precioTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.subtotal)}</span>
            </div>
            ${sale.descuento > 0 ? `
              <div class="total-row">
                <span>Descuento (${sale.descuento}%):</span>
                <span>-${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((sale.subtotal * sale.descuento) / 100)}</span>
              </div>
            ` : ''}
            ${sale.impuesto > 0 ? `
              <div class="total-row">
                <span>Impuesto:</span>
                <span>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.impuesto)}</span>
              </div>
            ` : ''}
            <div class="total-row" style="border-top: 2px solid #000;">
              <span>TOTAL:</span>
              <span>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.total)}</span>
            </div>
            <div style="margin-top: 10px; font-size: 12px;">
              <strong>Método de pago:</strong> ${sale.metodoPago}
            </div>
          </div>
        </div>

        ${sale.notas ? `
          <div style="margin-top: 30px;">
            <h3>Notas</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
              ${sale.notas}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Gracias por su compra en ${finalConfig.nombreEmpresa || 'inventarios-app'}</p>
          <p>Factura generada automáticamente por el sistema</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  printWindow.focus();

  // Esperar a que se cargue el contenido antes de imprimir
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};
