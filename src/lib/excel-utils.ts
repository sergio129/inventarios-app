import * as XLSX from 'xlsx';

interface ExcelRow {
  [key: string]: string | number | boolean;
}

export const exportToExcel = (data: ExcelRow[], filename: string) => {
  try {
    // Crear un nuevo workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

    // Ajustar el ancho de las columnas
    const maxWidth = 20;
    const colWidths = Object.keys(data[0] || {}).map(() => maxWidth);
    ws['!cols'] = colWidths.map(width => ({ wch: width }));

    // Descargar el archivo con formato Excel
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

export const formatSalesForExport = (salesStats: any[]) => {
  console.log('📊 Formatting data for export:', salesStats);
  
  if (!salesStats || salesStats.length === 0) {
    console.warn('⚠️ No sales data to export');
    return [];
  }

  return salesStats.map((stat, idx) => {
    const dateObj = new Date(stat._id);
    
    return {
      'Fecha': dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      'Total Ventas': stat.count || 0,
      'Ingresos Totales': stat.totalIngresos?.toFixed(2) || '0.00',
      'Total Descuentos': stat.totalDescuentos?.toFixed(2) || '0.00',
      'Impuestos': stat.totalImpuestos?.toFixed(2) || '0.00',
      'Ventas Completadas': stat.completadas || 0,
      'Ventas Canceladas': stat.canceladas || 0
    };
  });
};
