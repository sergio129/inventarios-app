import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Product from '@/lib/models/Product';
import dbConnect from '@/lib/mongodb';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que sea administrador
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden exportar inventario' },
        { status: 403 }
      );
    }

    // Conectar a la base de datos
    await dbConnect();

    // Obtener todos los productos
    const products = await Product.find({}).lean();

    // Preparar datos para Excel
    const excelData = products.map((product: any) => ({
      'Nombre': product.nombre,
      'Descripción': product.descripcion || '',
      'Categoría': product.categoria,
      'Marca': product.marca || '',
      'Código': product.codigo || '',
      'Código de Barras': product.codigoBarras || '',
      'Precio Venta (Unidad)': product.precio,
      'Precio Venta (Caja)': product.precioCaja || '',
      'Precio Compra (Unidad)': product.precioCompra,
      'Precio Compra (Caja)': product.precioCompraCaja || '',
      'Stock Cajas': product.stockCajas,
      'Unidades por Caja': product.unidadesPorCaja || 1,
      'Stock Unidades Sueltas': product.stockUnidadesSueltas,
      'Stock Mínimo': product.stockMinimo,
      'Tipo de Venta': product.tipoVenta || 'unidad',
      'Margen Ganancia Unidad (%)': product.margenGananciaUnidad || '',
      'Margen Ganancia Caja (%)': product.margenGananciaCaja || '',
      'Fecha Vencimiento': product.fechaVencimiento ? new Date(product.fechaVencimiento).toLocaleDateString('es-CO') : '',
      'Activo': product.activo ? 'Sí' : 'No',
      'Fecha Creación': new Date(product.fechaCreacion).toLocaleDateString('es-CO')
    }));

    // Crear workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 20 }, // Nombre
      { wch: 30 }, // Descripción
      { wch: 15 }, // Categoría
      { wch: 12 }, // Marca
      { wch: 15 }, // Código
      { wch: 15 }, // Código de Barras
      { wch: 15 }, // Precio Venta (Unidad)
      { wch: 15 }, // Precio Venta (Caja)
      { wch: 15 }, // Precio Compra (Unidad)
      { wch: 15 }, // Precio Compra (Caja)
      { wch: 12 }, // Stock Cajas
      { wch: 15 }, // Unidades por Caja
      { wch: 18 }, // Stock Unidades Sueltas
      { wch: 12 }, // Stock Mínimo
      { wch: 15 }, // Tipo de Venta
      { wch: 20 }, // Margen Ganancia Unidad
      { wch: 18 }, // Margen Ganancia Caja
      { wch: 18 }, // Fecha Vencimiento
      { wch: 10 }, // Activo
      { wch: 15 }  // Fecha Creación
    ];
    worksheet['!cols'] = columnWidths;

    // Convertir a buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Devolver archivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="inventario_' + new Date().getTime() + '.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error al exportar inventario:', error);
    return NextResponse.json(
      { error: 'Error al exportar inventario' },
      { status: 500 }
    );
  }
}
