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

    const query: any = {};

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
      venta,
      ventaId,
      numeroFactura,
      cliente,
      productosDevueltos,
      montoDevuelto,
      razonDevolucion,
      notas,
    } = await request.json();

    // Aceptar tanto "venta" como "ventaId" para compatibilidad
    const ventaIdFinal = venta || ventaId;

    // Validación mejorada
    if (!ventaIdFinal || !numeroFactura || !productosDevueltos || productosDevueltos.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos para la devolución. Se requiere: venta, numeroFactura, productosDevueltos' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verificar que la venta existe
    const sale = await Sale.findById(ventaIdFinal);
    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    // Generar número de devolución
    const numeroDevolucion = generateReturnNumber();

    // Crear registro de devolución
    const returnRecord = new Return({
      numeroDevolucion,
      numeroFactura,
      ventaId: ventaIdFinal,
      cliente,
      productosDevueltos,
      montoDevuelto: montoDevuelto || 0,
      razonDevolucion: razonDevolucion || 'no_especificada',
      notas: notas || '',
      estado: 'pendiente',
      fechaCreacion: new Date(),
    });

    await returnRecord.save();

    // ⭐ RESTAURAR STOCK DE LOS PRODUCTOS DEVUELTOS
    for (const productoDevuelto of productosDevueltos) {
      try {
        // Encontrar el producto por nombre
        const product = await Product.findOne({
          nombre: productoDevuelto.nombreProducto,
        });

        if (product) {
          // Restaurar el stock sumando la cantidad devuelta
          product.stock += productoDevuelto.cantidad;
          await product.save();

          console.log(
            `✓ Stock restaurado para "${productoDevuelto.nombreProducto}": +${productoDevuelto.cantidad} (nuevo stock: ${product.stock})`
          );
        } else {
          console.warn(
            `⚠ Producto "${productoDevuelto.nombreProducto}" no encontrado en inventario`
          );
        }
      } catch (stockError) {
        console.error(
          `✗ Error restaurando stock para "${productoDevuelto.nombreProducto}":`,
          stockError
        );
        // No bloquear la devolución si hay error con el stock
      }
    }

    // Actualizar estadísticas del cliente
    if (cliente && cliente.cedula) {
      try {
        const cedulaNormalizada = cliente.cedula.toLowerCase().trim();
        await Client.findOneAndUpdate(
          { cedula: cedulaNormalizada },
          {
            $inc: { totalDevoluciones: 1 },
            ultimaDevolucion: new Date(),
          },
          { new: true }
        );
        console.log(`✓ Cliente ${cedulaNormalizada} actualizado con devolución registrada`);
      } catch (clientError) {
        console.warn('⚠ Error actualizando cliente:', clientError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Devolución registrada exitosamente y stock restaurado automáticamente',
        numeroDevolucion,
        return: returnRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('✗ Error creando devolución:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
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
