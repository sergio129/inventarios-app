import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Solo permitir acceso a admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    console.log('=== Iniciando limpieza y reconstrucción de índices ===');

    // Paso 1: Limpiar valores vacíos a null ANTES de dropear índices
    console.log('Paso 1: Limpiando cadenas vacías en codigoBarras...');
    const resultCodigoBarras = await Product.updateMany(
      { codigoBarras: { $in: ['', undefined] } },
      { $set: { codigoBarras: null } }
    );
    console.log(`✓ ${resultCodigoBarras.modifiedCount} documentos con codigoBarras vacío actualizados a null`);

    console.log('Paso 2: Limpiando cadenas vacías en codigo...');
    const resultCodigo = await Product.updateMany(
      { codigo: { $in: ['', undefined] } },
      { $set: { codigo: null } }
    );
    console.log(`✓ ${resultCodigo.modifiedCount} documentos con codigo vacío actualizados a null`);

    // Paso 2: Dropear los índices existentes
    console.log('Paso 3: Removiendo índices existentes...');
    try {
      await Product.collection.dropIndexes();
      console.log('✓ Índices existentes removidos');
    } catch (error: any) {
      if (error.code === 27) {
        // Index not found - es normal si no hay índices
        console.log('✓ No había índices para remover');
      } else {
        throw error;
      }
    }

    // Paso 3: Reconstruir índices (Mongoose lo hace automáticamente al acceder a la colección)
    console.log('Paso 4: Reconstruyendo índices con Mongoose...');
    await Product.syncIndexes();
    console.log('✓ Nuevos índices construidos correctamente');

    // Paso 4: Verificar índices creados
    const indexes = await Product.collection.getIndexes();
    console.log('Índices actuales:', Object.keys(indexes));

    return NextResponse.json({
      success: true,
      message: 'Índices reconstruidos y datos limpios exitosamente',
      details: {
        codigoBarrasLimpios: resultCodigoBarras.modifiedCount,
        codigoLimpios: resultCodigo.modifiedCount,
        indexesRecreated: true,
        indexList: Object.keys(indexes)
      }
    });

  } catch (error: any) {
    console.error('Error reconstruyendo índices:', error);
    return NextResponse.json(
      { error: 'Error reconstruyendo índices: ' + error.message },
      { status: 500 }
    );
  }
}
