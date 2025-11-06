import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import ClientPurchaseHistory from '@/lib/models/ClientPurchaseHistory';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cedula: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { cedula } = await context.params;
    const cedulaNormalizada = cedula.toLowerCase().trim();

    // Obtener historial de compras del cliente
    const history = await ClientPurchaseHistory.find({
      'cliente.cedula': cedulaNormalizada
    })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      cedula: cedulaNormalizada,
      totalRegistros: history.length,
      historial: history
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
