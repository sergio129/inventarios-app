import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import CompanyConfig from '@/lib/models/CompanyConfig';
import { authOptions } from '@/lib/auth';

// GET - Obtener configuración actual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden acceder
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden ver la configuración' }, { status: 403 });
    }

    await dbConnect();

    // Obtener la primera configuración activa (normalmente hay una)
    const config = await CompanyConfig.findOne({ activo: true });

    if (!config) {
      return NextResponse.json(
        { error: 'No hay configuración disponible' },
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

// POST - Crear nueva configuración
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden crear
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear configuración' }, { status: 403 });
    }

    let body = await request.json();

    // Validar que nombreEmpresa no esté vacío
    if (!body.nombreEmpresa || body.nombreEmpresa.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      );
    }

    // Eliminar _id si viene vacío o undefined
    if (!body._id || body._id.trim() === '') {
      delete body._id;
    }

    await dbConnect();

    // Verificar si ya existe una configuración con ese nombre
    const existente = await CompanyConfig.findOne({ nombreEmpresa: body.nombreEmpresa });
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una configuración con ese nombre' },
        { status: 400 }
      );
    }

    // Asegurar que activo sea true por defecto
    body.activo = body.activo !== false;

    const config = new CompanyConfig(body);
    await config.save();

    return NextResponse.json(config, { status: 201 });

  } catch (error: any) {
    console.error('Error creando configuración:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((e: any) => e.message)
        .join(', ');
      return NextResponse.json(
        { error: `Validación fallida: ${messages}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden actualizar
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden actualizar configuración' }, { status: 403 });
    }

    const body = await request.json();
    
    // Obtener el ID desde el cuerpo
    const configId = body._id || body.id;
    
    if (!configId) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Actualizar la configuración
    const config = await CompanyConfig.findByIdAndUpdate(
      configId,
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
      const messages = Object.values(error.errors)
        .map((e: any) => e.message)
        .join(', ');
      return NextResponse.json(
        { error: `Validación fallida: ${messages}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
