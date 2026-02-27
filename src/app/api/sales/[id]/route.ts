import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    const sale = await Sale.findById(id)
      .populate('vendedor', 'name email')
      .lean();

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(sale);

  } catch (error) {
    console.error('Error obteniendo venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { estado, notas, cliente } = await request.json();

    await dbConnect();

    const { id } = await params;

    const sale = await Sale.findById(id);

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Solo permitir cambios de estado específicos
    if (estado && ['completada', 'cancelada', 'devuelta'].includes(estado)) {
      sale.estado = estado;
    }

    if (notas !== undefined) {
      sale.notas = notas;
    }

    // Permitir edición de datos del cliente (nombre, cédula, teléfono)
    // Solo si es admin o el vendedor de la venta
    if (cliente && typeof cliente === 'object') {
      // Validar que solo se editen estos campos permitidos
      if (cliente.nombre !== undefined) {
        sale.cliente = sale.cliente || {};
        sale.cliente.nombre = cliente.nombre?.trim() || '';
      }
      if (cliente.cedula !== undefined) {
        sale.cliente = sale.cliente || {};
        sale.cliente.cedula = cliente.cedula?.trim() || '';
      }
      if (cliente.telefono !== undefined) {
        sale.cliente = sale.cliente || {};
        sale.cliente.telefono = cliente.telefono?.trim() || '';
      }
    }

    sale.fechaActualizacion = new Date();
    await sale.save();

    return NextResponse.json(sale);

  } catch (error) {
    console.error('Error actualizando venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
