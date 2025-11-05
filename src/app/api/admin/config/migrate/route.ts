import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import CompanyConfig from '@/lib/models/CompanyConfig';
import { authOptions } from '@/lib/auth';

// POST - Migrar/Actualizar configuraciones existentes con campos faltantes
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden acceder
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden hacer migraciones' }, { status: 403 });
    }

    await dbConnect();

    // Obtener todas las configuraciones
    const configs = await CompanyConfig.find();

    console.log(`[MIGRATE] - Encontradas ${configs.length} configuraciones para migrar`);

    const defaultLabels = {
      nombreApp: 'inventarios-app',
      subtitulo: 'Sistema de Gestión',
      bienvenida_titulo: '¡Bienvenido a Inventarios-app!',
      bienvenida_subtitulo: 'Sistema de gestión de inventario para comidas rápidas',
      dashboard_total_productos: 'Total Productos',
      dashboard_ventas_hoy: 'Ventas Hoy',
      dashboard_usuarios_activos: 'Usuarios Activos',
      dashboard_pedidos_pendientes: 'Pedidos Pendientes',
      modulo_inventario: 'Inventario',
      modulo_ventas: 'Ventas',
      modulo_usuarios: 'Usuarios',
      modulo_reportes: 'Reportes',
      modulo_categorias: 'Categorías',
      factura_titulo: 'Factura',
      factura_numero: 'Factura',
      factura_fecha: 'Fecha',
      factura_estado: 'Estado',
      factura_vendedor: 'Vendedor',
      factura_cliente: 'Cliente',
      factura_productos: 'Productos',
      factura_cantidad: 'Cantidad',
      factura_precio_unitario: 'Precio Unitario',
      factura_total: 'Total',
      factura_subtotal: 'Subtotal',
      factura_descuento: 'Descuento',
      factura_impuesto: 'Impuesto',
      factura_metodo_pago: 'Método de Pago',
      producto_nombre: 'Nombre',
      producto_descripcion: 'Descripción',
      producto_precio: 'Precio',
      producto_stock: 'Stock',
      producto_categoria: 'Categoría',
      producto_codigo: 'Código',
      boton_guardar: 'Guardar',
      boton_cancelar: 'Cancelar',
      boton_eliminar: 'Eliminar',
      boton_editar: 'Editar',
      boton_agregar: 'Agregar',
      boton_crear: 'Crear',
    };

    const migratedConfigs = [];

    for (const config of configs) {
      // Fusionar labels: mantener los existentes, agregar los faltantes con defaults
      const mergedLabels = {
        ...defaultLabels,
        ...(config.labels || {}),
      };

      // Actualizar la configuración
      const updated = await CompanyConfig.findByIdAndUpdate(
        config._id,
        {
          $set: {
            labels: mergedLabels,
            fechaActualizacion: new Date(),
          },
        },
        { new: true }
      );

      migratedConfigs.push({
        id: config._id,
        nombreEmpresa: config.nombreEmpresa,
        labelsCount: Object.keys(updated.labels).length,
      });

      console.log(`[MIGRATE] - Actualizada configuración: ${config.nombreEmpresa} con ${Object.keys(updated.labels).length} labels`);
    }

    return NextResponse.json({
      message: `Migración completada. ${migratedConfigs.length} configuraciones actualizadas.`,
      configs: migratedConfigs,
    });

  } catch (error) {
    console.error('[MIGRATE] - Error durante la migración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor durante la migración' },
      { status: 500 }
    );
  }
}
