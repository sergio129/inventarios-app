import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Sale from '@/lib/models/Sale';

// GET: Buscar clientes por cédula o nombre / obtener recientes
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'all'; // 'all', 'recent', 'search'

    let query: any = {};
    
    if (type === 'search' && search) {
      query = {
        $or: [
          { 'cliente.cedula': { $regex: search, $options: 'i' } },
          { 'cliente.nombre': { $regex: search, $options: 'i' } }
        ],
        'cliente.cedula': { $exists: true, $ne: null }
      };
    } else if (type === 'recent') {
      query = { 'cliente.cedula': { $exists: true, $ne: null } };
    }

    // Obtener clientes únicos de las ventas
    const clients = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$cliente.cedula',
          nombre: { $first: '$cliente.nombre' },
          cedula: { $first: '$cliente.cedula' },
          telefono: { $first: '$cliente.telefono' },
          ultimaCompra: { $max: '$fechaCreacion' },
          totalCompras: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          cedula: 1,
          nombre: 1,
          telefono: { $ifNull: ['$telefono', ''] },
          ultimaCompra: 1,
          totalCompras: 1
        }
      },
      { $sort: { ultimaCompra: -1 } },
      { $limit: limit }
    ]);

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST: Guardar cliente automáticamente (solo validar)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { cedula, nombre, telefono } = body;

    if (!cedula || !nombre) {
      return NextResponse.json(
        { error: 'Cédula y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Solo retornar el cliente validado
    return NextResponse.json({
      cedula,
      nombre,
      telefono: telefono || ''
    });
  } catch (error) {
    console.error('Error saving client:', error);
    return NextResponse.json(
      { error: 'Error al guardar cliente' },
      { status: 500 }
    );
  }
}
