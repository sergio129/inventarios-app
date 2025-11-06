import mongoose from 'mongoose';

export interface IClient {
  cedula: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  ultimaCompra?: Date;
  totalCompras?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClientSchema = new mongoose.Schema(
  {
    cedula: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    ciudad: {
      type: String,
      trim: true,
    },
    ultimaCompra: {
      type: Date,
    },
    totalCompras: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
