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

    await dbConnect();

    // Obtener todas las ventas
    const allSales = await Sale.find().limit(50).lean();
    console.log('📋 All sales:', allSales);

    // Obtener conteo total
    const totalCount = await Sale.countDocuments({});
    console.log('📊 Total sales count:', totalCount);

    // Obtener últimas ventas con más detalle
    const lastSales = await Sale.find()
      .sort({ fechaVenta: -1 })
      .limit(5)
      .select('numeroFactura fechaVenta total estado')
      .lean();
    
    console.log('🔍 Last 5 sales:', lastSales);

    return NextResponse.json({
      totalCount,
      allSalesCount: allSales.length,
      lastSales,
      sample: allSales[0]
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}
