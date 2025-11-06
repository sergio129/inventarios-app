import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  usuarioId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  productoId: string;
  productoNombre: string;
  tipoAccion: 'crear' | 'actualizar' | 'eliminar' | 'importar';
  cambios: {
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
  }[];
  detalles: string;
  fechaCreacion: Date;
  ip?: string;
}

const AuditLogSchema = new Schema(
  {
    usuarioId: {
      type: String,
      required: true,
      index: true,
    },
    usuarioEmail: {
      type: String,
      required: true,
      index: true,
    },
    usuarioNombre: {
      type: String,
      required: true,
    },
    productoId: {
      type: String,
      required: true,
      index: true,
    },
    productoNombre: {
      type: String,
      required: true,
    },
    tipoAccion: {
      type: String,
      enum: ['crear', 'actualizar', 'eliminar', 'importar'],
      required: true,
      index: true,
    },
    cambios: [
      {
        campo: String,
        valorAnterior: mongoose.Schema.Types.Mixed,
        valorNuevo: mongoose.Schema.Types.Mixed,
      },
    ],
    detalles: String,
    fechaCreacion: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: String,
  },
  { timestamps: false }
);

// Índices para búsquedas frecuentes
AuditLogSchema.index({ productoId: 1, fechaCreacion: -1 });
AuditLogSchema.index({ usuarioEmail: 1, fechaCreacion: -1 });
AuditLogSchema.index({ fechaCreacion: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
