import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Return from '@/lib/models/Return';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Client from '@/lib/models/Client';
import { authOptions } from '@/lib/auth';

// Generar número de devolución
function generateReturnNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `DEV-${year}${month}${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get('cedula');
    const estado = searchParams.get('estado');
    const numeroFactura = searchParams.get('numeroFactura');

    let query: any = {};

    if (cedula) {
      query['cliente.cedula'] = cedula.toLowerCase().trim();
    }
    if (estado) {
      query.estado = estado;
    }
    if (numeroFactura) {
      query.numeroFactura = numeroFactura;
    }

    const returns = await Return.find(query)
      .sort({ fechaCreacion: -1 })
      .limit(100);

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error obteniendo devoluciones:', error);
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
      ventaId,
      numeroFactura,
      cliente,
      items,
      descuento,
      notas,
      tipoDevolucion,
    } = await request.json();

    if (!ventaId || !numeroFactura || !cliente || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos para la devolución' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verificar que la venta existe
    const sale = await Sale.findById(ventaId);
    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    // Calcular totales de la devolución
    let subtotal = 0;
    let impuesto = 0;

    for (const item of items) {
      subtotal += item.precioTotal || 0;
    }

    // Aplicar descuento si existe
    const descuentoAplicado = descuento || 0;
    const subtotalConDescuento = subtotal - descuentoAplicado;

    // Calcular impuesto (IVA 19%)
    impuesto = Math.round(subtotalConDescuento * 0.19);

    const total = subtotalConDescuento + impuesto;
    const montoReembolso = total;

    // Crear número único de devolución
    const numeroDevolucion = generateReturnNumber();

    // Crear documento de devolución
    const newReturn = new Return({
      numeroDevolucion,
      ventaId,
      numeroFactura,
      cliente: {
        cedula: cliente.cedula.toLowerCase().trim(),
        nombre: cliente.nombre,
      },
      items,
      subtotal,
      descuento: descuentoAplicado,
      impuesto,
      total,
      montoReembolso,
      estado: 'pendiente',
      tipoDevolucion: tipoDevolucion || 'parcial',
      metodoPago: sale.metodoPago || 'No especificado',
      notas,
      vendedor: session.user.id,
      fechaCreacion: new Date(),
    });

    await newReturn.save();

    // Aumentar stock de los productos devueltos
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productoId,
        { $inc: { stock: item.cantidadDevuelta } },
        { new: true }
      );
    }

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error('Error creando devolución:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT para actualizar estado de devolución
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const returnId = searchParams.get('id');
    const { estado } = await request.json();

    if (!returnId || !estado) {
      return NextResponse.json(
        { error: 'ID de devolución y estado requeridos' },
        { status: 400 }
      );
    }

    await dbConnect();

    const returnDoc = await Return.findByIdAndUpdate(
      returnId,
      {
        estado,
        fechaAprobacion: estado === 'aprobada' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!returnDoc) {
      return NextResponse.json(
        { error: 'Devolución no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(returnDoc);
  } catch (error) {
    console.error('Error actualizando devolución:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
