import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanyConfig extends Document {
  _id: string;
  // Identidad de la empresa
  nombreEmpresa: string;
  logo?: string;
  
  // Labels personalizables
  labels: {
    // Generales
    nombreApp: string;
    subtitulo: string;
    
    // Módulos
    modulo_inventario: string;
    modulo_ventas: string;
    modulo_usuarios: string;
    modulo_reportes: string;
    modulo_categorias: string;
    
    // Facturas
    factura_titulo: string;
    factura_numero: string;
    factura_fecha: string;
    factura_estado: string;
    factura_vendedor: string;
    factura_cliente: string;
    factura_productos: string;
    factura_cantidad: string;
    factura_precio_unitario: string;
    factura_total: string;
    factura_subtotal: string;
    factura_descuento: string;
    factura_impuesto: string;
    factura_metodo_pago: string;
    
    // Productos
    producto_nombre: string;
    producto_descripcion: string;
    producto_precio: string;
    producto_stock: string;
    producto_categoria: string;
    producto_codigo: string;
    
    // Botones comunes
    boton_guardar: string;
    boton_cancelar: string;
    boton_eliminar: string;
    boton_editar: string;
    boton_agregar: string;
    boton_crear: string;
  };
  
  // Configuración visual
  colores: {
    primario: string;
    secundario: string;
    exito: string;
    peligro: string;
    advertencia: string;
    informacion: string;
  };
  
  // Información de la empresa
  informacion: {
    razonSocial?: string;
    nit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    ciudad?: string;
    pais?: string;
    sitioWeb?: string;
  };
  
  // Control
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const CompanyConfigSchema: Schema = new Schema({
  nombreEmpresa: {
    type: String,
    required: [true, 'El nombre de la empresa es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  
  logo: {
    type: String,
    trim: true
  },
  
  labels: {
    // Generales
    nombreApp: {
      type: String,
      default: 'inventarios-app'
    },
    subtitulo: {
      type: String,
      default: 'Sistema de Gestión de Inventario'
    },
    
    // Módulos
    modulo_inventario: {
      type: String,
      default: 'Inventario'
    },
    modulo_ventas: {
      type: String,
      default: 'Ventas'
    },
    modulo_usuarios: {
      type: String,
      default: 'Usuarios'
    },
    modulo_reportes: {
      type: String,
      default: 'Reportes'
    },
    modulo_categorias: {
      type: String,
      default: 'Categorías'
    },
    
    // Facturas
    factura_titulo: {
      type: String,
      default: 'Factura'
    },
    factura_numero: {
      type: String,
      default: 'Factura'
    },
    factura_fecha: {
      type: String,
      default: 'Fecha'
    },
    factura_estado: {
      type: String,
      default: 'Estado'
    },
    factura_vendedor: {
      type: String,
      default: 'Vendedor'
    },
    factura_cliente: {
      type: String,
      default: 'Cliente'
    },
    factura_productos: {
      type: String,
      default: 'Productos'
    },
    factura_cantidad: {
      type: String,
      default: 'Cantidad'
    },
    factura_precio_unitario: {
      type: String,
      default: 'Precio Unitario'
    },
    factura_total: {
      type: String,
      default: 'Total'
    },
    factura_subtotal: {
      type: String,
      default: 'Subtotal'
    },
    factura_descuento: {
      type: String,
      default: 'Descuento'
    },
    factura_impuesto: {
      type: String,
      default: 'Impuesto'
    },
    factura_metodo_pago: {
      type: String,
      default: 'Método de Pago'
    },
    
    // Productos
    producto_nombre: {
      type: String,
      default: 'Nombre'
    },
    producto_descripcion: {
      type: String,
      default: 'Descripción'
    },
    producto_precio: {
      type: String,
      default: 'Precio'
    },
    producto_stock: {
      type: String,
      default: 'Stock'
    },
    producto_categoria: {
      type: String,
      default: 'Categoría'
    },
    producto_codigo: {
      type: String,
      default: 'Código'
    },
    
    // Botones
    boton_guardar: {
      type: String,
      default: 'Guardar'
    },
    boton_cancelar: {
      type: String,
      default: 'Cancelar'
    },
    boton_eliminar: {
      type: String,
      default: 'Eliminar'
    },
    boton_editar: {
      type: String,
      default: 'Editar'
    },
    boton_agregar: {
      type: String,
      default: 'Agregar'
    },
    boton_crear: {
      type: String,
      default: 'Crear'
    }
  },
  
  colores: {
    primario: {
      type: String,
      default: '#3b82f6'
    },
    secundario: {
      type: String,
      default: '#6366f1'
    },
    exito: {
      type: String,
      default: '#10b981'
    },
    peligro: {
      type: String,
      default: '#ef4444'
    },
    advertencia: {
      type: String,
      default: '#f59e0b'
    },
    informacion: {
      type: String,
      default: '#3b82f6'
    }
  },
  
  informacion: {
    razonSocial: String,
    nit: String,
    direccion: String,
    telefono: String,
    email: String,
    ciudad: String,
    pais: String,
    sitioWeb: String
  },
  
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índice para el nombre de la empresa
CompanyConfigSchema.index({ nombreEmpresa: 1 });
CompanyConfigSchema.index({ activo: 1 });

export default mongoose.models.CompanyConfig || mongoose.model<ICompanyConfig>('CompanyConfig', CompanyConfigSchema);
