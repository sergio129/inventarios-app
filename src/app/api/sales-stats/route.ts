import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day'; // day, week, month, year

    await dbConnect();

    const now = new Date();
    let startDate = new Date();
    let groupFields: any;

    // Determinar rango de fechas según período
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        groupFields = {
          year: { $year: '$fechaVenta' },
          month: { $month: '$fechaVenta' },
          day: { $dayOfMonth: '$fechaVenta' },
          hour: { $hour: '$fechaVenta' }
        };
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        groupFields = {
          year: { $year: '$fechaVenta' },
          month: { $month: '$fechaVenta' },
          day: { $dayOfMonth: '$fechaVenta' }
        };
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupFields = {
          year: { $year: '$fechaVenta' },
          month: { $month: '$fechaVenta' },
          day: { $dayOfMonth: '$fechaVenta' }
        };
        break;
      case 'year':
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupFields = {
          year: { $year: '$fechaVenta' },
          month: { $month: '$fechaVenta' }
        };
        break;
      default:
        return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    }

    console.log('📊 Sales Stats - Period:', period);
    console.log('📅 Start Date:', startDate);
    console.log('📅 End Date:', now);

    // Obtener total de ventas en el rango
    const totalCount = await Sale.countDocuments({
      fechaVenta: { $gte: startDate, $lte: now }
    });
    console.log('📈 Total sales in range:', totalCount);

    // Obtener ventas agrupadas
    const salesStats = await Sale.aggregate([
      {
        $match: {
          fechaVenta: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: groupFields,
          count: { $sum: 1 },
          totalIngresos: { $sum: { $toDouble: '$total' } },
          totalDescuentos: { $sum: { $toDouble: '$descuento' } },
          totalImpuestos: { $sum: { $toDouble: '$impuesto' } },
          completadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          canceladas: {
            $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      },
      {
        $addFields: {
          '_id': {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: { $ifNull: ['$_id.hour', 0] }
            }
          }
        }
      }
    ]);

    console.log('📊 Sales Stats aggregated:', salesStats);

    // Calcular totales generales
    const totalsAgg = await Sale.aggregate([
      {
        $match: {
          fechaVenta: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: 1 },
          totalIngresos: { $sum: { $toDouble: '$total' } },
          totalDescuentos: { $sum: { $toDouble: '$descuento' } },
          totalImpuestos: { $sum: { $toDouble: '$impuesto' } },
          ventasCompletadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completada'] }, 1, 0] }
          },
          ventasCanceladas: {
            $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] }
          }
        }
      }
    ]);

    const totals = totalsAgg[0] || {
      totalVentas: 0,
      totalIngresos: 0,
      totalDescuentos: 0,
      totalImpuestos: 0,
      ventasCompletadas: 0,
      ventasCanceladas: 0
    };

    console.log('💰 Totals:', totals);

    return NextResponse.json({
      period,
      startDate,
      endDate: now,
      data: salesStats,
      totals
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de ventas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}
