import jsPDF from 'jspdf';

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

export const generateInvoicePDF = async (sale: Sale): Promise<void> => {
  try {
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

    // Header
    yPosition = centerText('Inventarios-app', yPosition, 20, 'bold');
    yPosition = centerText('Sistema de Gestión de Inventario', yPosition + 2, 12, 'normal');
    yPosition = centerText('Factura Electrónica', yPosition + 2, 10, 'normal');

    // Línea separadora
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5);
    yPosition += 15;

    // Información de la venta y cliente
    const leftColumnX = margin;
    const rightColumnX = pageWidth / 2 + 10;

    // Información de la venta (izquierda)
    yPosition = addText('INFORMACIÓN DE LA VENTA', leftColumnX, yPosition, pageWidth / 2 - margin, 12, 'bold');
    yPosition += 5;
    yPosition = addText(`Factura: ${sale.numeroFactura}`, leftColumnX, yPosition, pageWidth / 2 - margin);
    yPosition = addText(`Fecha: ${new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(sale.fechaVenta))}`, leftColumnX, yPosition, pageWidth / 2 - margin);
    yPosition = addText(`Estado: ${sale.estado}`, leftColumnX, yPosition, pageWidth / 2 - margin);
    if (sale.vendedor) {
      yPosition = addText(`Vendedor: ${sale.vendedor.name}`, leftColumnX, yPosition, pageWidth / 2 - margin);
    }

    // Reset yPosition para la columna derecha
    let rightYPosition = margin + 20;

    // Información del cliente (derecha)
    rightYPosition = addText('INFORMACIÓN DEL CLIENTE', rightColumnX, rightYPosition, pageWidth / 2 - margin, 12, 'bold');
    rightYPosition += 5;
    rightYPosition = addText(`Nombre: ${sale.cliente?.nombre || 'Cliente General'}`, rightColumnX, rightYPosition, pageWidth / 2 - margin);
    if (sale.cliente?.cedula) {
      rightYPosition = addText(`Cédula: ${sale.cliente.cedula}`, rightColumnX, rightYPosition, pageWidth / 2 - margin);
    }
    if (sale.cliente?.telefono) {
      rightYPosition = addText(`Teléfono: ${sale.cliente.telefono}`, rightColumnX, rightYPosition, pageWidth / 2 - margin);
    }

    // Usar la posición más baja entre las dos columnas
    yPosition = Math.max(yPosition, rightYPosition) + 15;

    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    // Tabla de productos
    yPosition = addText('DETALLES DE PRODUCTOS', margin, yPosition, pageWidth - 2 * margin, 12, 'bold');
    yPosition += 10;

    // Headers de tabla
    const tableStartY = yPosition;
    const colWidths = [80, 20, 35, 35]; // Ancho de cada columna
    const colPositions = [margin];
    for (let i = 1; i < colWidths.length; i++) {
      colPositions.push(colPositions[i-1] + colWidths[i-1]);
    }

    // Dibujar headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Producto', colPositions[0] + 2, yPosition);
    pdf.text('Cant.', colPositions[1] + 2, yPosition);
    pdf.text('Precio Unit.', colPositions[2] + 2, yPosition);
    pdf.text('Total', colPositions[3] + 2, yPosition);

    yPosition += 8;

    // Líneas de productos
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    sale.items.forEach((item, index) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;

        // Repetir headers en nueva página
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text('Producto', colPositions[0] + 2, yPosition);
        pdf.text('Cant.', colPositions[1] + 2, yPosition);
        pdf.text('Precio Unit.', colPositions[2] + 2, yPosition);
        pdf.text('Total', colPositions[3] + 2, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
      }

      // Dibujar fila
      const rowHeight = 6;
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, rowHeight, 'F');
      }

      // Texto de las celdas
      const productName = item.nombreProducto.length > 25 ? item.nombreProducto.substring(0, 22) + '...' : item.nombreProducto;
      pdf.text(productName, colPositions[0] + 2, yPosition);
      pdf.text(item.cantidad.toString(), colPositions[1] + 2, yPosition);
      pdf.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precioUnitario), colPositions[2] + 2, yPosition);
      pdf.text(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precioTotal), colPositions[3] + 2, yPosition);

      yPosition += rowHeight;
    });

    // Bordes de tabla
    pdf.setLineWidth(0.2);
    pdf.rect(margin, tableStartY - 5, pageWidth - 2 * margin, yPosition - tableStartY + 3);

    yPosition += 10;

    // Verificar si necesitamos una nueva página para totales
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    // Totales (columna derecha)
    const totalsX = pageWidth - margin - 80;
    yPosition = addText('RESUMEN', totalsX, yPosition, 80, 12, 'bold');
    yPosition += 5;

    yPosition = addText(`Subtotal: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.subtotal)}`, totalsX, yPosition, 80);
    if (sale.descuento > 0) {
      yPosition = addText(`Descuento (${sale.descuento}%): -${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format((sale.subtotal * sale.descuento) / 100)}`, totalsX, yPosition, 80);
    }
    if (sale.impuesto > 0) {
      yPosition = addText(`Impuesto: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.impuesto)}`, totalsX, yPosition, 80);
    }

    // Línea separadora para total
    pdf.setLineWidth(0.5);
    pdf.line(totalsX, yPosition + 2, totalsX + 80, yPosition + 2);
    yPosition += 8;

    // Total
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`TOTAL: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(sale.total)}`, totalsX, yPosition);
    yPosition += 8;

    // Método de pago
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Método de pago: ${sale.metodoPago}`, totalsX, yPosition);

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
    const footerText = 'Gracias por su compra en inventarios-app - Factura generada automáticamente';
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

export const printInvoice = (sale: Sale): void => {
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
          <h1>inventarios-app</h1>
          <p>Sistema de Gestión de Inventario</p>
          <p>Factura Electrónica</p>
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
          <p>Gracias por su compra en inventarios-app</p>
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
