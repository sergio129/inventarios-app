import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioCaja: number;
  precioCompra: number;
  precioCompraCaja: number;
  stock: number; // Total de unidades (calculado automáticamente)
  stockCajas: number; // Número de cajas completas
  stockUnidadesSueltas: number; // Unidades sueltas (que no completan una caja)
  stockMinimo: number;
  categoria: string;
  marca?: string;
  codigo?: string;
  codigoBarras?: string;
  fechaVencimiento?: Date;
  activo: boolean;
  // Nuevos campos para manejo de unidades y empaques
  unidadesPorEmpaque?: number; // Número de unidades por caja/empaque
  unidadesPorCaja?: number; // Alias para unidadesPorEmpaque
  tipoVenta: 'unidad' | 'empaque' | 'ambos'; // Tipo de venta permitida
  precioPorUnidad?: number; // Precio cuando se vende por unidad
  precioPorEmpaque?: number; // Precio cuando se vende por caja completa
  margenGananciaUnidad?: number; // Margen de ganancia por unidad (%)
  margenGananciaCaja?: number; // Margen de ganancia por caja (%)
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const ProductSchema: Schema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  precio: {
    type: Number,
    required: [true, 'El precio de venta es requerido'],
    min: [0, 'El precio debe ser mayor o igual a 0']
  },
  precioCompra: {
    type: Number,
    required: [true, 'El precio de compra es requerido'],
    min: [0, 'El precio de compra debe ser mayor o igual a 0']
  },
  precioCompraCaja: {
    type: Number,
    min: [0, 'El precio de compra por caja debe ser mayor o igual a 0']
  },
  precioCaja: {
    type: Number,
    min: [0, 'El precio por caja debe ser mayor o igual a 0']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: [0, 'El stock debe ser mayor o igual a 0'],
    default: 0
  },
  stockCajas: {
    type: Number,
    min: [0, 'El stock de cajas debe ser mayor o igual a 0'],
    default: 0
  },
  stockUnidadesSueltas: {
    type: Number,
    min: [0, 'El stock de unidades sueltas debe ser mayor o igual a 0'],
    default: 0
  },
  stockMinimo: {
    type: Number,
    required: [true, 'El stock mínimo es requerido'],
    min: [0, 'El stock mínimo debe ser mayor o igual a 0'],
    default: 5
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es requerida'],
    trim: true
  },
  marca: {
    type: String,
    trim: true
  },
  codigo: {
    type: String,
    trim: true,
    index: { unique: true, sparse: true }
  },
  codigoBarras: {
    type: String,
    trim: true,
    index: { unique: true, sparse: true }
  },
  fechaVencimiento: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  },
  unidadesPorEmpaque: {
    type: Number,
    min: [1, 'Las unidades por empaque deben ser al menos 1'],
    default: 1
  },
  unidadesPorCaja: {
    type: Number,
    min: [1, 'Las unidades por caja deben ser al menos 1'],
    default: 1
  },
  tipoVenta: {
    type: String,
    enum: ['unidad', 'empaque', 'ambos'],
    default: 'unidad'
  },
  precioPorUnidad: {
    type: Number,
    min: [0, 'El precio por unidad debe ser mayor o igual a 0']
  },
  precioPorEmpaque: {
    type: Number,
    min: [0, 'El precio por empaque debe ser mayor o igual a 0']
  },
  margenGananciaUnidad: {
    type: Number,
    min: [0, 'El margen de ganancia por unidad debe ser mayor o igual a 0'],
    max: [1000, 'El margen de ganancia no puede exceder 1000%']
  },
  margenGananciaCaja: {
    type: Number,
    min: [0, 'El margen de ganancia por caja debe ser mayor o igual a 0'],
    max: [1000, 'El margen de ganancia no puede exceder 1000%']
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índices para mejorar rendimiento
ProductSchema.index({ nombre: 1 });
ProductSchema.index({ categoria: 1 });
ProductSchema.index({ marca: 1 });
ProductSchema.index({ activo: 1 });
ProductSchema.index({ stock: 1 });

// Método para verificar si necesita reabastecimiento
ProductSchema.methods.necesitaReabastecimiento = function() {
  return this.stock <= this.stockMinimo;
};

// Método para calcular el stock total en unidades
ProductSchema.methods.calcularStockTotal = function(this: any) {
  const unidadesPorCaja = Number(this.unidadesPorCaja || this.unidadesPorEmpaque || 1);
  const stockCajas = Number(this.stockCajas || 0);
  const stockUnidadesSueltas = Number(this.stockUnidadesSueltas || 0);
  return (stockCajas * unidadesPorCaja) + stockUnidadesSueltas;
};

// Método para actualizar stock desde cajas y unidades sueltas
ProductSchema.methods.actualizarStockDesdeCajas = function(cajas: number, unidadesSueltas: number) {
  this.stockCajas = cajas;
  this.stockUnidadesSueltas = unidadesSueltas;
  this.stock = this.calcularStockTotal();
};

// Método para vender unidades y actualizar cajas/unidades automáticamente
ProductSchema.methods.venderUnidades = function(cantidad: number) {
  if (cantidad > this.stock) {
    throw new Error('Stock insuficiente');
  }

  const unidadesPorCaja = this.unidadesPorCaja || this.unidadesPorEmpaque || 1;
  let unidadesRestantes = cantidad;

  // Primero intentar vender de unidades sueltas
  if (this.stockUnidadesSueltas >= unidadesRestantes) {
    this.stockUnidadesSueltas -= unidadesRestantes;
    unidadesRestantes = 0;
  } else {
    unidadesRestantes -= this.stockUnidadesSueltas;
    this.stockUnidadesSueltas = 0;
  }

  // Si aún quedan unidades por vender, vender cajas completas
  if (unidadesRestantes > 0) {
    const cajasNecesarias = Math.ceil(unidadesRestantes / unidadesPorCaja);
    if (this.stockCajas < cajasNecesarias) {
      throw new Error('Stock insuficiente para completar la venta');
    }

    this.stockCajas -= cajasNecesarias;
    const unidadesDeCajas = cajasNecesarias * unidadesPorCaja;
    const unidadesSobrantes = unidadesDeCajas - unidadesRestantes;

    // Las unidades sobrantes van a unidades sueltas
    this.stockUnidadesSueltas += unidadesSobrantes;
  }

  // Recalcular stock total
  this.stock = this.calcularStockTotal();
};

// Método para agregar stock en cajas y unidades
ProductSchema.methods.agregarStock = function(cajas: number, unidadesSueltas: number) {
  this.stockCajas += cajas;
  this.stockUnidadesSueltas += unidadesSueltas;
  this.stock = this.calcularStockTotal();
};

// Método para obtener información de stock legible
ProductSchema.methods.getInfoStock = function() {
  const unidadesPorCaja = this.unidadesPorEmpaque || 1;
  return {
    totalUnidades: this.stock,
    cajasCompletas: this.stockCajas,
    unidadesSueltas: this.stockUnidadesSueltas,
    unidadesPorCaja: unidadesPorCaja,
    cajasParciales: Math.floor(this.stockUnidadesSueltas / unidadesPorCaja),
    unidadesEnCajaParcial: this.stockUnidadesSueltas % unidadesPorCaja
  };
};

// Método para calcular margen de ganancia
ProductSchema.methods.calcularMargen = function() {
  if (this.precioCompra === 0) return 0;
  return ((this.precio - this.precioCompra) / this.precioCompra) * 100;
};

// Método para obtener el precio según el tipo de venta
ProductSchema.methods.getPrecio = function(tipoVenta: 'unidad' | 'empaque' = 'unidad') {
  if (tipoVenta === 'unidad' && this.precioPorUnidad) {
    return this.precioPorUnidad;
  }
  if (tipoVenta === 'empaque' && this.precioPorEmpaque) {
    return this.precioPorEmpaque;
  }
  return this.precio; // Precio por defecto
};

// Método para convertir cantidad a unidades base
ProductSchema.methods.convertirAUnidades = function(cantidad: number, tipoVenta: 'unidad' | 'empaque') {
  if (tipoVenta === 'empaque') {
    return cantidad * (this.unidadesPorEmpaque || 1);
  }
  return cantidad;
};

// Método para verificar si puede venderse del tipo especificado
ProductSchema.methods.puedeVenderComo = function(tipoVenta: 'unidad' | 'empaque') {
  return this.tipoVenta === tipoVenta || this.tipoVenta === 'ambos';
};

// Middleware pre-save para calcular stock total automáticamente
ProductSchema.pre('save', function(this: any, next) {
  // Solo recalcular si es un producto nuevo o si se modificaron los campos de stock individual
  if (this.isNew || this.isModified('stockCajas') || this.isModified('stockUnidadesSueltas') || this.isModified('unidadesPorCaja')) {
    const unidadesPorCaja = Number(this.unidadesPorCaja || this.unidadesPorEmpaque || 1);
    const stockCajas = Number(this.stockCajas || 0);
    const stockUnidadesSueltas = Number(this.stockUnidadesSueltas || 0);
    this.stock = (stockCajas * unidadesPorCaja) + stockUnidadesSueltas;
  }
  next();
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
