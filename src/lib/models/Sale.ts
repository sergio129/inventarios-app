import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleItem {
  producto: mongoose.Types.ObjectId;
  nombreProducto: string;
  cantidad: number;
  tipoVenta: 'unidad' | 'empaque'; // Tipo de venta: unidad individual o empaque completo
  precioUnitario: number;
  precioTotal: number;
}

export interface ISale extends Document {
  _id: string;
  numeroFactura: string;
  cliente?: {
    nombre: string;
    cedula?: string;
    telefono?: string;
  };
  items: ISaleItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
  estado: 'pendiente' | 'completada' | 'cancelada' | 'devuelta';
  vendedor: mongoose.Types.ObjectId;
  notas?: string;
  fechaVenta: Date;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const SaleItemSchema: Schema = new Schema({
  producto: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  nombreProducto: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1']
  },
  tipoVenta: {
    type: String,
    enum: ['unidad', 'empaque'],
    required: true,
    default: 'unidad'
  },
  precioUnitario: {
    type: Number,
    required: true,
    min: [0, 'El precio unitario debe ser mayor o igual a 0']
  },
  precioTotal: {
    type: Number,
    required: true,
    min: [0, 'El precio total debe ser mayor o igual a 0']
  }
});

const SaleSchema: Schema = new Schema({
  numeroFactura: {
    type: String,
    required: true,
    unique: true
  },
  cliente: {
    nombre: {
      type: String,
      trim: true
    },
    cedula: {
      type: String,
      trim: true
    },
    telefono: {
      type: String,
      trim: true
    }
  },
  items: [SaleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'El subtotal debe ser mayor o igual a 0']
  },
  descuento: {
    type: Number,
    default: 0,
    min: [0, 'El descuento debe ser mayor o igual a 0']
  },
  impuesto: {
    type: Number,
    default: 0,
    min: [0, 'El impuesto debe ser mayor o igual a 0']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'El total debe ser mayor o igual a 0']
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'credito'],
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'completada', 'cancelada', 'devuelta'],
    default: 'pendiente'
  },
  vendedor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notas: {
    type: String,
    trim: true
  },
  fechaVenta: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índices para mejorar rendimiento
SaleSchema.index({ numeroFactura: 1 });
SaleSchema.index({ estado: 1 });
SaleSchema.index({ fechaVenta: -1 });
SaleSchema.index({ vendedor: 1 });
SaleSchema.index({ 'cliente.nombre': 1 });

// Método para calcular totales
SaleSchema.methods.calcularTotales = function(this: ISale) {
  this.subtotal = this.items.reduce((sum: number, item: ISaleItem) => sum + item.precioTotal, 0);
  this.total = this.subtotal - (this.subtotal * this.descuento / 100) + this.impuesto;
};

// Método para verificar si puede ser cancelada
SaleSchema.methods.puedeSerCancelada = function(this: ISale) {
  return this.estado === 'pendiente' || this.estado === 'completada';
};

// Interfaces auxiliares para el middleware
interface ItemVenta {
  precioTotal: number;
}

interface VentaParcial {
  items: ItemVenta[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
}

// Función auxiliar para calcular totales
function calcularTotales(venta: VentaParcial) {
  venta.subtotal = venta.items.reduce((sum: number, item: ItemVenta) => sum + item.precioTotal, 0);
  venta.total = venta.subtotal - (venta.subtotal * venta.descuento / 100) + venta.impuesto;
}

// Pre-save middleware para calcular totales
SaleSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('descuento') || this.isModified('impuesto')) {
    calcularTotales(this as unknown as VentaParcial);
  }
  next();
});

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);
