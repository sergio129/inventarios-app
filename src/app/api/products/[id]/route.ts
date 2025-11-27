import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { authOptions } from '@/lib/auth';
import { registrarAuditLog, detectarCambios } from '@/lib/audit-service';
import { validarPreciosCoherentes } from '@/lib/validation-service';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const updateData = await request.json();

    await dbConnect();

    // Obtener el producto actual para permitir actualizaciones parciales
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Si vienen campos de inventario pero no "stock", calcularlo
    const stockCajas = updateData.stockCajas ?? existingProduct.stockCajas ?? 0;
    const unidadesPorCaja = updateData.unidadesPorCaja ?? existingProduct.unidadesPorCaja ?? existingProduct.unidadesPorEmpaque ?? 1;
    const stockUnidadesSueltas = updateData.stockUnidadesSueltas ?? existingProduct.stockUnidadesSueltas ?? 0;
    if (updateData.stock === undefined && (updateData.stockCajas !== undefined || updateData.unidadesPorCaja !== undefined || updateData.stockUnidadesSueltas !== undefined)) {
      updateData.stock = (Number(stockCajas) || 0) * (Number(unidadesPorCaja) || 1) + (Number(stockUnidadesSueltas) || 0);
    }

    // Fusionar para validar requeridos con valores existentes cuando no se envían
    const mergedForValidation = {
      ...existingProduct.toObject(),
      ...updateData,
    } as any;

    // Validar campos requeridos contra el objeto fusionado (permite updates parciales)
    const requiredFields = ['nombre', 'precio', 'precioCompra', 'stock', 'stockMinimo', 'categoria'];
    for (const field of requiredFields) {
      if (
        mergedForValidation[field] === undefined ||
        mergedForValidation[field] === null ||
        mergedForValidation[field] === ''
      ) {
        return NextResponse.json({ error: `El campo ${field} es requerido` }, { status: 400 });
      }
    }

    // Validar precios coherentes
    if (updateData.precio || updateData.precioCompra) {
      const precioVenta = updateData.precio ?? existingProduct.precio;
      const precioCompra = updateData.precioCompra ?? existingProduct.precioCompra;
      
      const validacionPrecio = validarPreciosCoherentes(precioCompra, precioVenta);
      if (!validacionPrecio.valido) {
        return NextResponse.json({ error: validacionPrecio.mensaje }, { status: 400 });
      }
    }

    // Normalizar campos opcionales: strings vacíos -> remover del documento
    const updateObj: any = { ...updateData, fechaActualizacion: new Date() };
    const unsetObj: any = {};

    // Sincronizar precios: si se actualiza precio o precioCaja, actualizar también precioPorUnidad/precioPorEmpaque
    if (updateData.precio !== undefined) {
      updateObj.precioPorUnidad = updateData.precio;
    }
    if (updateData.precioCaja !== undefined) {
      const unidadesPorEmpaque = updateData.unidadesPorCaja || existingProduct.unidadesPorCaja || existingProduct.unidadesPorEmpaque || 1;
      updateObj.precioPorEmpaque = updateData.precioCaja || (updateData.precio * unidadesPorEmpaque);
    }
    // Sincronizar unidadesPorEmpaque con unidadesPorCaja
    if (updateData.unidadesPorCaja !== undefined) {
      updateObj.unidadesPorEmpaque = updateData.unidadesPorCaja;
    }

    // Si el campo viene vacío, marcarlo para remover del documento
    if (updateData.codigo === '') {
      unsetObj.codigo = '';
      delete updateObj.codigo;
    }
    if (updateData.codigoBarras === '') {
      unsetObj.codigoBarras = '';
      delete updateObj.codigoBarras;
    }
    if (updateData.marca === '') {
      unsetObj.marca = '';
      delete updateObj.marca;
    }

    // Construir update con $set y $unset si es necesario
    const update: any = { $set: updateObj };
    if (Object.keys(unsetObj).length > 0) {
      update.$unset = unsetObj;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Registrar en auditoría
    const cambios = detectarCambios(existingProduct.toObject(), updatedProduct.toObject());
    if (cambios.length > 0) {
      await registrarAuditLog(
        session.user.id || session.user.email || 'desconocido',
        session.user.email || 'desconocido',
        session.user.name || 'Usuario Desconocido',
        id,
        updatedProduct.nombre,
        'actualizar',
        cambios,
        `Actualización de ${cambios.length} campo(s)`,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      );
    }

    return NextResponse.json(updatedProduct);

  } catch (error: any) {
    console.error('Error actualizando producto:', error);
    // Manejo de clave duplicada (código o código de barras)
    if (error && (error.code === 11000 || error.name === 'MongoServerError')) {
      const dupKey = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'valor';
      const fieldName = dupKey === 'codigoBarras' ? 'código de barras' : dupKey === 'codigo' ? 'código interno' : dupKey;
      return NextResponse.json(
        { error: `Ya existe un producto con este ${fieldName}` },
        { status: 400 }
      );
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return NextResponse.json({ error: messages.join('. ') }, { status: 400 });
    }
    if (error?.name === 'CastError') {
      return NextResponse.json({ error: 'Datos inválidos en la solicitud' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // En lugar de eliminar físicamente, marcamos como inactivo (soft delete)
    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      {
        activo: false,
        fechaActualizacion: new Date()
      },
      { new: true }
    );

    if (!deletedProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Registrar eliminación en auditoría
    await registrarAuditLog(
      session.user.id || session.user.email || 'desconocido',
      session.user.email || 'desconocido',
      session.user.name || 'Usuario Desconocido',
      id,
      deletedProduct.nombre,
      'eliminar',
      [{ campo: 'activo', valorAnterior: true, valorNuevo: false }],
      'Producto desactivado',
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    );

    return NextResponse.json({ message: 'Producto eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
