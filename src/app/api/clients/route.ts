import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Sale from '@/lib/models/Sale';
import Client from '@/lib/models/Client';

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
    const getAll = searchParams.get('all') === 'true';

    // Si se solicita todos los clientes
    if (getAll) {
      // Obtener de la tabla de Clientes
      const clientsFromDB = await Client.find(
        {},
        { cedula: 1, nombre: 1, telefono: 1, email: 1, ultimaCompra: 1, totalCompras: 1 }
      )
        .sort({ ultimaCompra: -1 })
        .lean();

      // Obtener de historial de ventas (clientes que realizaron compras pero no están en tabla)
      const clientsFromSales = await Sale.aggregate([
        {
          $match: {
            'cliente.cedula': { $exists: true, $ne: null }
          }
        },
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
        }
      ]);

      // Combinar y deduplicar por cédula
      const clientMap = new Map();
      
      // Primero agregar clientes de BD (tienen prioridad)
      clientsFromDB.forEach((client: any) => {
        clientMap.set(client.cedula?.toLowerCase(), {
          cedula: client.cedula,
          nombre: client.nombre,
          telefono: client.telefono || '',
          email: client.email || '',
          ultimaCompra: client.ultimaCompra,
          totalCompras: client.totalCompras || 0
        });
      });

      // Luego agregar clientes de Sales (si no existen en BD)
      clientsFromSales.forEach((client: any) => {
        const key = client.cedula?.toLowerCase();
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            cedula: client.cedula,
            nombre: client.nombre,
            telefono: client.telefono || '',
            email: '',
            ultimaCompra: client.ultimaCompra,
            totalCompras: client.totalCompras || 0
          });
        }
      });

      // Convertir a array y ordenar por última compra
      const allClients = Array.from(clientMap.values()).sort((a: any, b: any) => {
        const dateA = a.ultimaCompra ? new Date(a.ultimaCompra).getTime() : 0;
        const dateB = b.ultimaCompra ? new Date(b.ultimaCompra).getTime() : 0;
        return dateB - dateA;
      });

      return NextResponse.json(allClients);
    }

    // Si no hay búsqueda o es inválida, retornar array vacío
    if (!search || search.length < 2 || search === '%') {
      return NextResponse.json([]);
    }

    // Buscar en la tabla de Clientes primero (más rápido)
    const clientsFromDB = await Client.find(
      {
        $or: [
          { cedula: { $regex: search, $options: 'i' } },
          { nombre: { $regex: search, $options: 'i' } }
        ]
      },
      { cedula: 1, nombre: 1, telefono: 1, ultimaCompra: 1, totalCompras: 1 }
    )
      .sort({ ultimaCompra: -1 })
      .limit(limit)
      .lean();

    // Si no hay resultados en BD, buscar en historial de ventas
    if (clientsFromDB.length === 0) {
      const clientsFromSales = await Sale.aggregate([
        {
          $match: {
            $or: [
              { 'cliente.cedula': { $regex: search, $options: 'i' } },
              { 'cliente.nombre': { $regex: search, $options: 'i' } }
            ],
            'cliente.cedula': { $exists: true, $ne: null }
          }
        },
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

      return NextResponse.json(clientsFromSales);
    }

    // Convertir a formato consistente
    const formattedClients = clientsFromDB.map((client: any) => ({
      cedula: client.cedula,
      nombre: client.nombre,
      telefono: client.telefono || '',
      ultimaCompra: client.ultimaCompra,
      totalCompras: client.totalCompras || 0
    }));

    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST: Guardar cliente en BD
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

    // Verificar si el cliente ya existe
    let client = await Client.findOne({ cedula: cedula.toLowerCase().trim() });

    if (client) {
      // Si existe, actualizar teléfono si es proporcionado
      if (telefono) {
        client.telefono = telefono;
        await client.save();
      }
    } else {
      // Si no existe, crear nuevo cliente
      client = new Client({
        cedula: cedula.toLowerCase().trim(),
        nombre,
        telefono: telefono || '',
      });
      await client.save();
    }

    return NextResponse.json({
      cedula: client.cedula,
      nombre: client.nombre,
      telefono: client.telefono || ''
    });
  } catch (error) {
    console.error('Error saving client:', error);
    return NextResponse.json(
      { error: 'Error al guardar cliente' },
      { status: 500 }
    );
  }
}
