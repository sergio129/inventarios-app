import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { authOptions } from '@/lib/auth';

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
    const requiredFields = ['nombre', 'precio', 'precioCompra', 'stock', 'stockMinimo', 'categoria', 'laboratorio'];
    for (const field of requiredFields) {
      if (
        mergedForValidation[field] === undefined ||
        mergedForValidation[field] === null ||
        mergedForValidation[field] === ''
      ) {
        return NextResponse.json({ error: `El campo ${field} es requerido` }, { status: 400 });
      }
    }

    // Normalizar campos opcionales: strings vacíos -> null para respetar índices sparse
    if (updateData.codigo === '') updateData.codigo = null;
    if (updateData.codigoBarras === '') updateData.codigoBarras = null;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...updateData,
        fechaActualizacion: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
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

    return NextResponse.json({ message: 'Producto eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
