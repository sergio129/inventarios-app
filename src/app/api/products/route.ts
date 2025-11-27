import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoria = searchParams.get('categoria');
    const activo = searchParams.get('activo');

    const query: any = {};

    // Filtro por búsqueda (nombre, código, código de barras)
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { codigoBarras: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtro por categoría
    if (categoria && categoria !== 'todas') {
      query.categoria = categoria;
    }

    // Filtro por estado activo
    if (activo !== null) {
      query.activo = activo === 'true';
    } else {
      query.activo = true; // Por defecto solo productos activos
    }

    const products = await Product.find(query).sort({ fechaCreacion: -1 });

    return NextResponse.json(products);

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const {
      nombre,
      descripcion,
      precio,
      precioCaja,
      precioCompra,
      precioCompraCaja,
      stockCajas,
      unidadesPorCaja,
      stockUnidadesSueltas,
      stockMinimo,
      categoria,
      marca,
      codigo,
      codigoBarras,
      margenGananciaUnidad,
      margenGananciaCaja
    } = await request.json();

    // Validación de campos requeridos
    if (!nombre || precio === undefined || precio === null ||
        precioCompra === undefined || precioCompra === null ||
        stockCajas === undefined || stockCajas === null ||
        unidadesPorCaja === undefined || unidadesPorCaja === null ||
        stockUnidadesSueltas === undefined || stockUnidadesSueltas === null ||
        stockMinimo === undefined || stockMinimo === null ||
        !categoria) {
      return NextResponse.json({ error: 'Todos los campos requeridos deben ser proporcionados' }, { status: 400 });
    }

    // Calcular stock total
    const stockTotal = (stockCajas * unidadesPorCaja) + stockUnidadesSueltas;

    await dbConnect();

    // Construir objeto del producto dinámicamente para no incluir campos vacíos/null
    const productData: any = {
      nombre,
      descripcion: descripcion || '',
      precio,
      precioCaja: precioCaja || null,
      precioCompra,
      precioCompraCaja: precioCompraCaja || null,
      stockCajas,
      unidadesPorCaja,
      unidadesPorEmpaque: unidadesPorCaja, // Sincronizar ambos campos
      stockUnidadesSueltas,
      stock: stockTotal,
      stockMinimo,
      categoria,
      activo: true,
      tipoVenta: 'ambos', // Por defecto permite venta por unidad y caja
      precioPorUnidad: precio, // Precio unitario
      precioPorEmpaque: precioCaja || (precio * unidadesPorCaja) // Precio por caja completa
    };

    // Solo agregar campos opcionales si tienen valor
    if (marca && marca.trim() !== '') {
      productData.marca = marca.trim();
    }
    if (codigo && codigo.trim() !== '') {
      productData.codigo = codigo.trim();
    }
    if (codigoBarras && codigoBarras.trim() !== '') {
      productData.codigoBarras = codigoBarras.trim();
    }
    if (margenGananciaUnidad) {
      productData.margenGananciaUnidad = margenGananciaUnidad;
    }
    if (margenGananciaCaja) {
      productData.margenGananciaCaja = margenGananciaCaja;
    }

    const product = new Product(productData);

    await product.save();

    return NextResponse.json(product, { status: 201 });

  } catch (error: any) {
    console.error('Error creando producto:', error);
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
