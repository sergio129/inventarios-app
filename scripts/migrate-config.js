// Script para migrar datos faltantes en CompanyConfig
// Ejecutar con: node scripts/migrate-config.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  nombreEmpresa: String,
  logo: String,
  labels: mongoose.Schema.Types.Mixed,
  colores: mongoose.Schema.Types.Mixed,
  informacion: mongoose.Schema.Types.Mixed,
  activo: Boolean,
  fechaCreacion: Date,
  fechaActualizacion: Date,
}, { strict: false });

const CompanyConfig = mongoose.model('CompanyConfig', configSchema);

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

async function migrate() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está configurado en .env.local');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const configs = await CompanyConfig.find({});
    console.log(`📊 Encontradas ${configs.length} configuraciones`);

    for (const config of configs) {
      console.log(`\n🔧 Procesando: ${config.nombreEmpresa}`);
      
      // Merge labels: mantener existentes, agregar faltantes
      const mergedLabels = {
        ...defaultLabels,
        ...(config.labels || {}),
      };

      // Verificar qué campos están faltando
      const missingFields = Object.keys(defaultLabels).filter(
        key => !config.labels || !(key in config.labels)
      );

      if (missingFields.length > 0) {
        console.log(`   ⚠️  Campos faltantes: ${missingFields.join(', ')}`);
        
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

        console.log(`   ✅ Actualizada con ${missingFields.length} campo(s) nuevo(s)`);
        console.log(`   📌 Total de labels: ${Object.keys(updated.labels).length}`);
      } else {
        console.log(`   ✅ Todos los campos presentes`);
      }
    }

    console.log('\n✅ ¡Migración completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
