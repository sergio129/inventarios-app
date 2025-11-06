import mongoose from 'mongoose';

export interface IClientPurchaseHistory {
  cliente: {
    cedula: string;
    nombre: string;
  };
  numeroFactura?: string;
  items: Array<{
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
  }>;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  notas?: string;
  createdAt?: Date;
}

const ClientPurchaseHistorySchema = new mongoose.Schema(
  {
    cliente: {
      cedula: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      nombre: {
        type: String,
        required: true,
      },
    },
    numeroFactura: {
      type: String,
    },
    items: [
      {
        nombreProducto: String,
        cantidad: Number,
        precioUnitario: Number,
        precioTotal: Number,
      },
    ],
    subtotal: Number,
    descuento: Number,
    impuesto: Number,
    total: {
      type: Number,
      required: true,
    },
    metodoPago: String,
    notas: String,
  },
  {
    timestamps: true,
  }
);

// Índice para búsquedas rápidas por cédula
ClientPurchaseHistorySchema.index({ 'cliente.cedula': 1, createdAt: -1 });

export default mongoose.models.ClientPurchaseHistory || mongoose.model('ClientPurchaseHistory', ClientPurchaseHistorySchema);
