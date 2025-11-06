import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import AuditLog from '@/lib/models/AuditLog';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo admins pueden ver el historial completo
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para ver el historial' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const productoId = searchParams.get('productoId');
    const usuarioEmail = searchParams.get('usuarioEmail');
    const tipoAccion = searchParams.get('tipoAccion');
    const limite = parseInt(searchParams.get('limite') || '100', 10);
    const pagina = parseInt(searchParams.get('pagina') || '1', 10);

    // Construir query
    const query: any = {};
    if (productoId) query.productoId = productoId;
    if (usuarioEmail) query.usuarioEmail = usuarioEmail;
    if (tipoAccion) query.tipoAccion = tipoAccion;

    const skip = (pagina - 1) * limite;

    const [historial, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      historial,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}
