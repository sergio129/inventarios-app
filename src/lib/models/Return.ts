import mongoose, { Document, Schema } from 'mongoose';

export interface IReturnItem {
  productoId: string;
  nombreProducto: string;
  cantidadOriginal: number;
  cantidadDevuelta: number;
  precioUnitario: number;
  precioTotal: number;
  motivo: string;
}

export interface IReturn extends Document {
  numeroDevolucion: string;
  ventaId: string;
  numeroFactura: string;
  cliente: {
    cedula: string;
    nombre: string;
  };
  items: IReturnItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  montoReembolso: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'procesada';
  tipoDevolucion: 'completa' | 'parcial';
  metodoPago: string;
  notas: string;
  vendedor: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaAprobacion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnSchema = new Schema<IReturn>(
  {
    numeroDevolucion: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ventaId: {
      type: String,
      required: true,
      index: true,
    },
    numeroFactura: {
      type: String,
      required: true,
    },
    cliente: {
      cedula: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      nombre: String,
    },
    items: [
      {
        productoId: String,
        nombreProducto: String,
        cantidadOriginal: Number,
        cantidadDevuelta: Number,
        precioUnitario: Number,
        precioTotal: Number,
        motivo: String,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    descuento: {
      type: Number,
      default: 0,
    },
    impuesto: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    montoReembolso: {
      type: Number,
      required: true,
      default: 0,
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobada', 'rechazada', 'procesada'],
      default: 'pendiente',
      index: true,
    },
    tipoDevolucion: {
      type: String,
      enum: ['completa', 'parcial'],
      default: 'parcial',
    },
    metodoPago: {
      type: String,
      default: 'No especificado',
    },
    notas: String,
    vendedor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaAprobacion: Date,
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas rápidas
ReturnSchema.index({ 'cliente.cedula': 1, estado: 1 });
ReturnSchema.index({ numeroFactura: 1 });
ReturnSchema.index({ fechaCreacion: -1 });

export default mongoose.models.Return ||
  mongoose.model<IReturn>('Return', ReturnSchema);
