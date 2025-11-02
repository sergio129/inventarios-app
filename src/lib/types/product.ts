export interface IProduct {
  _id: string
  nombre: string
  descripcion?: string
  precio: number
  precioCompra?: number
  stock: number
  stockCajas?: number
  stockUnidadesSueltas?: number
  stockMinimo?: number
  categoria?: string
  marca?: string
  codigo?: string | null
  codigoBarras?: string | null
  activo?: boolean
  unidadesPorEmpaque?: number
  tipoVenta?: 'unidad' | 'empaque' | 'ambos'
  precioPorUnidad?: number
  precioPorEmpaque?: number
  fechaCreacion?: string
  // Optional helper methods (runtime may not provide these)
  puedeVenderComo?: (tipo: 'unidad' | 'empaque') => boolean
  getPrecio?: (tipo: 'unidad' | 'empaque') => number
  convertirAUnidades?: (cantidad: number, tipo: 'unidad' | 'empaque') => number
  getInfoStock?: () => any
}

export default IProduct
