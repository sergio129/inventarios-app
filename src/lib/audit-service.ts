import AuditLog from '@/lib/models/AuditLog';
import dbConnect from '@/lib/mongodb';

interface ChangeRecord {
  campo: string;
  valorAnterior: any;
  valorNuevo: any;
}

export async function registrarAuditLog(
  usuarioId: string,
  usuarioEmail: string,
  usuarioNombre: string,
  productoId: string,
  productoNombre: string,
  tipoAccion: 'crear' | 'actualizar' | 'eliminar' | 'importar',
  cambios: ChangeRecord[],
  detalles?: string,
  ip?: string
) {
  try {
    await dbConnect();

    await AuditLog.create({
      usuarioId,
      usuarioEmail,
      usuarioNombre,
      productoId,
      productoNombre,
      tipoAccion,
      cambios,
      detalles,
      ip,
      fechaCreacion: new Date(),
    });
  } catch (error) {
    console.error('Error registrando auditoría:', error);
    // No lanzar error para no afectar la operación principal
  }
}

export async function obtenerHistorialProducto(productoId: string, limite: number = 50) {
  try {
    await dbConnect();

    const historial = await AuditLog.find({ productoId })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .lean();

    return historial;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}

export async function obtenerHistorialUsuario(email: string, limite: number = 100) {
  try {
    await dbConnect();

    const historial = await AuditLog.find({ usuarioEmail: email })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .lean();

    return historial;
  } catch (error) {
    console.error('Error obteniendo historial de usuario:', error);
    return [];
  }
}

export function detectarCambios(productoAnterior: any, productoNuevo: any): ChangeRecord[] {
  const cambios: ChangeRecord[] = [];
  const camposMonitoreados = [
    'stockCajas',
    'unidadesPorCaja',
    'stockUnidadesSueltas',
    'stock',
    'precio',
    'precioCaja',
    'precioCompra',
    'precioCompraCaja',
    'margenGananciaUnidad',
    'margenGananciaCaja',
    'nombre',
    'categoria',
    'codigo',
    'codigoBarras',
    'marca',
    'descripcion',
  ];

  camposMonitoreados.forEach((campo) => {
    const valorAnterior = productoAnterior[campo];
    const valorNuevo = productoNuevo[campo];

    // Considerar undefined y null como equivalentes
    const anteriorDefinido = valorAnterior !== undefined && valorAnterior !== null;
    const nuevoDefinido = valorNuevo !== undefined && valorNuevo !== null;

    if (anteriorDefinido !== nuevoDefinido || valorAnterior !== valorNuevo) {
      cambios.push({
        campo,
        valorAnterior: anteriorDefinido ? valorAnterior : null,
        valorNuevo: nuevoDefinido ? valorNuevo : null,
      });
    }
  });

  return cambios;
}
