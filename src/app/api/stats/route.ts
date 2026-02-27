import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Sale from '@/lib/models/Sale';
import User from '@/lib/models/User';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Obtener fecha de hoy y ayer
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. Total de productos activos
    const totalProductos = await Product.countDocuments({ activo: true });

    // 2. Ventas de hoy
    const ventasHoy = await Sale.aggregate([
      {
        $match: {
          fechaCreacion: { $gte: today },
          estado: { $in: ['completada', 'pendiente'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    // 3. Ventas de ayer
    const ventasAyer = await Sale.aggregate([
      {
        $match: {
          fechaCreacion: { $gte: yesterday, $lt: today },
          estado: { $in: ['completada', 'pendiente'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    // 4. Usuarios activos hoy
    const usuariosActivos = await User.countDocuments({
      activo: true,
      fecha_activacion: { $exists: true }
    });

    // 5. Pedidos pendientes hoy
    const pedidosPendientesHoy = await Sale.countDocuments({
      estado: 'pendiente',
      fechaCreacion: { $gte: today }
    });

    // Calcular porcentajes de cambio
    const ventasHoyTotal = ventasHoy.length > 0 ? ventasHoy[0].total : 0;
    const ventasAyerTotal = ventasAyer.length > 0 ? ventasAyer[0].total : 0;

    const ventasChange = ventasAyerTotal > 0
      ? ((ventasHoyTotal - ventasAyerTotal) / ventasAyerTotal) * 100
      : (ventasHoyTotal > 0 ? 100 : 0);

    // Calcular cambio en productos (comparar con ayer)
    const productosAyer = await Product.countDocuments({
      activo: true,
      fechaCreacion: { $lt: today }
    });
    
    const productosChange = productosAyer > 0
      ? ((totalProductos - productosAyer) / productosAyer) * 100
      : (totalProductos > 0 ? 100 : 0);

    // Calcular cambio en usuarios activos (comparar con ayer)
    const usuariosActivosAyer = await User.countDocuments({
      activo: true,
      fecha_activacion: { $exists: true, $lt: today }
    });

    const usuariosChange = usuariosActivosAyer > 0
      ? ((usuariosActivos - usuariosActivosAyer) / usuariosActivosAyer) * 100
      : (usuariosActivos > 0 ? 100 : 0);

    // Calcular cambio en pedidos pendientes (comparar con ayer)
    const pedidosPendientesAyer = await Sale.countDocuments({
      estado: 'pendiente',
      fechaCreacion: { $gte: yesterday, $lt: today }
    });

    const pedidosChange = pedidosPendientesAyer > 0
      ? ((pedidosPendientesHoy - pedidosPendientesAyer) / pedidosPendientesAyer) * 100
      : (pedidosPendientesHoy > 0 ? 100 : 0);

    const stats = {
      totalProductos: {
        value: totalProductos.toLocaleString(),
        change: parseFloat(productosChange.toFixed(2)),
        changeType: productosChange >= 0 ? 'positive' : 'negative'
      },
      ventasHoy: {
        value: `$${ventasHoyTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        change: parseFloat(ventasChange.toFixed(2)),
        changeType: ventasChange >= 0 ? 'positive' : 'negative'
      },
      usuariosActivos: {
        value: usuariosActivos.toString(),
        change: parseFloat(usuariosChange.toFixed(2)),
        changeType: usuariosChange >= 0 ? 'positive' : 'negative'
      },
      pedidosPendientes: {
        value: pedidosPendientesHoy.toString(),
        change: parseFloat(pedidosChange.toFixed(2)),
        changeType: pedidosChange >= 0 ? 'positive' : 'negative'
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
