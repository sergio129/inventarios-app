import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import CompanyConfig from '@/lib/models/CompanyConfig';
import { authOptions } from '@/lib/auth';

// GET - Obtener configuración específica por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden ver la configuración' }, { status: 403 });
    }

    const { id } = await params;
    
    await dbConnect();

    const config = await CompanyConfig.findById(id);

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración específica
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden actualizar configuración' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    await dbConnect();

    const config = await CompanyConfig.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);

  } catch (error: any) {
    console.error('Error actualizando configuración:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: Object.values(error.errors).map((e: any) => e.message).join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar configuración (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar configuración' }, { status: 403 });
    }

    const { id } = await params;

    await dbConnect();

    // Soft delete - solo desactiva
    const config = await CompanyConfig.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Configuración desactivada', config });

  } catch (error) {
    console.error('Error eliminando configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
