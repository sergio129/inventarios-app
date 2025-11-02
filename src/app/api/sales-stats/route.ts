import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import { authOptions } from '@/lib/auth';
import { 
  getNowLocal, 
  getStartOfDay, 
  getStartOfWeek, 
  getStartOfMonth, 
  getStartOfYear 
} from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';

    await dbConnect();

    console.log('📊 Sales Stats - Period:', period);

    // Obtener dates de inicio y fin según período
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = getStartOfDay(now);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'week':
        startDate = getStartOfWeek(now);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        break;
      case 'month':
        startDate = getStartOfMonth(now);
        endDate = new Date(startDate.getTime() + 31 * 24 * 60 * 60 * 1000 - 1); // Aproximado
        break;
      case 'year':
        startDate = getStartOfYear(now);
        endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000 - 1); // Aproximado
        break;
      default:
        return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    }

    console.log('📅 Start Date:', startDate);
    console.log('📅 End Date:', endDate);

    // Obtener todas las ventas en el rango de fechas usando fechaCreacion
    const salesInRange = await Sale.find({
      fechaCreacion: { $gte: startDate, $lte: endDate }
    }).lean();
    
    console.log('📈 Total sales in range:', salesInRange.length);

    let groupByFormat: string;
    let groupByFields: any;

    // Definir formato de agrupación según período
    if (period === 'day') {
      // Agrupar por hora
      groupByFormat = '%Y-%m-%d %H:00';
      groupByFields = {
        $dateToString: {
          format: '%Y-%m-%d %H:00',
          date: '$fechaCreacion'
        }
      };
    } else if (period === 'week' || period === 'month') {
      // Agrupar por día
      groupByFormat = '%Y-%m-%d';
      groupByFields = {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$fechaCreacion'
        }
      };
    } else if (period === 'year') {
      // Agrupar por mes
      groupByFormat = '%Y-%m';
      groupByFields = {
        $dateToString: {
          format: '%Y-%m',
          date: '$fechaCreacion'
        }
      };
    }

    // Obtener ventas agrupadas - CON FILTRO DE FECHA LOCAL
    const salesStats = await Sale.aggregate([
      {
        $match: {
          fechaCreacion: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupByFields,
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
        $sort: { '_id': 1 }
      }
    ]);

    console.log('📊 Grouped sales count:', salesStats.length);
    if (salesStats.length > 0) {
      console.log('🔍 First group sample:', salesStats[0]);
    }

    // Calcular totales generales - CON FILTRO DE FECHA LOCAL
    const totalsAgg = await Sale.aggregate([
      {
        $match: {
          fechaCreacion: { $gte: startDate, $lte: endDate }
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
      endDate,
      data: salesStats,
      totals,
      debug: {
        totalSalesInRange: salesInRange.length,
        groupedCount: salesStats.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de ventas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}
