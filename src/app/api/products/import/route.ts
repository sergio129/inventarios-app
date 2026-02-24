import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Product from '@/lib/models/Product';
import dbConnect from '@/lib/mongodb';
import * as XLSX from 'xlsx';

interface ProductRow {
  'Nombre': string;
  'Descripción'?: string;
  'Categoría': string;
  'Marca'?: string;
  'Código'?: string;
  'Código de Barras'?: string;
  'Precio Venta (Unidad)': number;
  'Precio Venta (Caja)'?: number;
  'Precio Compra (Unidad)': number;
  'Precio Compra (Caja)'?: number;
  'Stock Cajas': number;
  'Unidades por Caja'?: number;
  'Stock Unidades Sueltas': number;
  'Stock Mínimo': number;
  'Tipo de Venta'?: string;
  'Margen Ganancia Unidad (%)'?: number;
  'Margen Ganancia Caja (%)'?: number;
  'Fecha Vencimiento'?: string;
  'Activo'?: string;
}

export async function POST(request: NextRequest) {
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
        { error: 'Solo administradores pueden importar inventario' },
        { status: 403 }
      );
    }

    // Conectar a la base de datos
    await dbConnect();

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProductRow[];

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json(
        { error: 'El archivo Excel no contiene datos' },
        { status: 400 }
      );
    }

    // Validar y procesar datos
    const errors: string[] = [];
    const successCount = { created: 0, updated: 0 };
    const results: any[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y hay encabezados

      try {
        // Validaciones básicas
        if (!row.Nombre || !row.Nombre.toString().trim()) {
          errors.push(`Fila ${rowNumber}: Nombre es requerido`);
          continue;
        }

        if (typeof row['Precio Venta (Unidad)'] !== 'number' || row['Precio Venta (Unidad)'] < 0) {
          errors.push(`Fila ${rowNumber}: Precio Venta (Unidad) debe ser un número positivo`);
          continue;
        }

        if (typeof row['Precio Compra (Unidad)'] !== 'number' || row['Precio Compra (Unidad)'] < 0) {
          errors.push(`Fila ${rowNumber}: Precio Compra (Unidad) debe ser un número positivo`);
          continue;
        }

        if (!row.Categoría || !row.Categoría.toString().trim()) {
          errors.push(`Fila ${rowNumber}: Categoría es requerida`);
          continue;
        }

        // Preparar datos del producto
        const productData: any = {
          nombre: row.Nombre.toString().trim(),
          descripcion: row.Descripción ? row.Descripción.toString().trim() : '',
          categoria: row.Categoría.toString().trim(),
          marca: row.Marca ? row.Marca.toString().trim() : undefined,
          codigo: row.Código ? row.Código.toString().trim() : undefined,
          codigoBarras: row['Código de Barras'] ? row['Código de Barras'].toString().trim() : undefined,
          precio: Number(row['Precio Venta (Unidad)']),
          precioCaja: row['Precio Venta (Caja)'] ? Number(row['Precio Venta (Caja)']) : undefined,
          precioCompra: Number(row['Precio Compra (Unidad)']),
          precioCompraCaja: row['Precio Compra (Caja)'] ? Number(row['Precio Compra (Caja)']) : undefined,
          stockCajas: Number(row['Stock Cajas'] ?? 0),
          unidadesPorCaja: Number(row['Unidades por Caja'] ?? 1),
          stockUnidadesSueltas: Number(row['Stock Unidades Sueltas'] ?? 0),
          stockMinimo: row['Stock Mínimo'] != null ? Number(row['Stock Mínimo']) : 5,
          tipoVenta: (row['Tipo de Venta'] || 'unidad').toString().toLowerCase(),
          margenGananciaUnidad: row['Margen Ganancia Unidad (%)'] ? Number(row['Margen Ganancia Unidad (%)']) : undefined,
          margenGananciaCaja: row['Margen Ganancia Caja (%)'] ? Number(row['Margen Ganancia Caja (%)']) : undefined,
          fechaVencimiento: row['Fecha Vencimiento'] ? new Date(row['Fecha Vencimiento']) : undefined,
          activo: row.Activo ? row.Activo.toString().toLowerCase() === 'sí' : true
        };

        // Calcular el stock total (cajas * unidades por caja + unidades sueltas)
        const stockTotal = (productData.stockCajas * productData.unidadesPorCaja) + productData.stockUnidadesSueltas;
        productData['stock'] = stockTotal;

        // Calcular margen desde precios si no viene en el archivo o es 0
        if ((productData.margenGananciaUnidad === undefined || productData.margenGananciaUnidad === 0) && productData.precioCompra > 0 && productData.precio > 0) {
          productData.margenGananciaUnidad = ((productData.precio - productData.precioCompra) / productData.precioCompra) * 100;
        }
        if ((productData.margenGananciaCaja === undefined || productData.margenGananciaCaja === 0) && productData.precioCompraCaja && productData.precioCaja && productData.precioCompraCaja > 0) {
          productData.margenGananciaCaja = ((productData.precioCaja - productData.precioCompraCaja) / productData.precioCompraCaja) * 100;
        }

        // Calcular precio de venta desde margen si no viene en el archivo
        if ((!productData.precio || productData.precio === 0) && (productData.margenGananciaUnidad && productData.margenGananciaUnidad > 0) && productData.precioCompra > 0) {
          productData.precio = productData.precioCompra * (1 + productData.margenGananciaUnidad / 100);
        }
        if ((!productData.precioCaja || productData.precioCaja === 0) && (productData.margenGananciaCaja && productData.margenGananciaCaja > 0) && productData.precioCompraCaja && productData.precioCompraCaja > 0) {
          productData.precioCaja = productData.precioCompraCaja * (1 + productData.margenGananciaCaja / 100);
        }

        // Buscar por código o nombre
        const existingProduct = productData.codigo
          ? await Product.findOne({ codigo: productData.codigo })
          : await Product.findOne({ nombre: productData.nombre, categoria: productData.categoria });

        let product;
        if (existingProduct) {
          // Actualizar producto existente
          product = await Product.findByIdAndUpdate(
            existingProduct._id,
            productData,
            { new: true, runValidators: true }
          );
          successCount.updated++;
          results.push({
            nombre: productData.nombre,
            accion: 'actualizado',
            id: product._id
          });
        } else {
          // Crear nuevo producto
          product = new Product(productData);
          await product.save();
          successCount.created++;
          results.push({
            nombre: productData.nombre,
            accion: 'creado',
            id: product._id
          });
        }
      } catch (error: any) {
        errors.push(`Fila ${rowNumber}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${successCount.created} productos creados, ${successCount.updated} productos actualizados`,
      successCount,
      errors: errors.length > 0 ? errors : null,
      results: results.slice(0, 10) // Mostrar solo los primeros 10 resultados
    });
  } catch (error) {
    console.error('Error al importar inventario:', error);
    return NextResponse.json(
      { error: 'Error al importar inventario: ' + (error as any).message },
      { status: 500 }
    );
  }
}
