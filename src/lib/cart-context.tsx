'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

import IProduct from '@/lib/types/product'

interface SaleItem {
  producto: string
  nombreProducto: string
  cantidad: number
  tipoVenta: 'unidad' | 'empaque'
  precioUnitario: number
  precioTotal: number
  unidadesPorEmpaque?: number
}

interface Cliente {
  nombre: string
  cedula: string
  telefono: string
}

interface CartContextType {
  cart: SaleItem[]
  cliente: Cliente
  descuento: number
  metodoPago: string
  notas: string
  isCartOpen: boolean
  isScanning: boolean
  addToCart: (product: IProduct, tipoVenta?: 'unidad' | 'empaque', cantidad?: number) => void
  updateCartItem: (productId: string, newQuantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  setCliente: (cliente: Cliente) => void
  setDescuento: (descuento: number) => void
  setMetodoPago: (metodoPago: string) => void
  setNotas: (notas: string) => void
  setIsCartOpen: (isOpen: boolean) => void
  setIsScanning: (isScanning: boolean) => void
  calculateSubtotal: () => number
  calculateTotal: () => number
  scanBarcode: (barcode: string) => Promise<void>
  processSale: () => Promise<any>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<SaleItem[]>([])
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    cedula: '',
    telefono: ''
  })
  const [descuento, setDescuento] = useState(0)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [notas, setNotas] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  console.log('CartProvider render:', { cartLength: cart.length, isCartOpen });

  // Funciones auxiliares para manejo de productos
  const puedeVenderComo = (product: IProduct, tipo: 'unidad' | 'empaque'): boolean => {
      return product.tipoVenta === tipo || product.tipoVenta === 'ambos';
    };

  const getPrecioProducto = (product: IProduct, tipo: 'unidad' | 'empaque'): number => {
    if (tipo === 'unidad') {
      // Prioridad: precioPorUnidad > precio
      return product.precioPorUnidad || product.precio;
    }
    if (tipo === 'empaque') {
      // Prioridad: precioPorEmpaque > precioCaja > precio * unidadesPorEmpaque
      return product.precioPorEmpaque || (product as any).precioCaja || (product.precio * (product.unidadesPorEmpaque || 1));
    }
    return product.precio; // Precio por defecto
  };

  const convertirAUnidades = (product: IProduct, cantidad: number, tipo: 'unidad' | 'empaque'): number => {
    if (tipo === 'empaque') {
      return cantidad * (product.unidadesPorEmpaque || 1);
    }
    return cantidad;
  };

  const calcularStockDisponible = (product: IProduct, tipo: 'unidad' | 'empaque'): number => {
    if (tipo === 'empaque') {
      return Math.floor(product.stock / (product.unidadesPorEmpaque || 1));
    }
    return product.stock;
  };

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    try {
      console.log('Loading cart from localStorage...');
      const savedCart = localStorage.getItem('inventariosApp_cart')
      const savedCliente = localStorage.getItem('inventariosApp_cliente')
      const savedDescuento = localStorage.getItem('inventariosApp_descuento')
      const savedMetodoPago = localStorage.getItem('inventariosApp_metodoPago')
      const savedNotas = localStorage.getItem('inventariosApp_notas')
      const savedIsCartOpen = localStorage.getItem('inventariosApp_isCartOpen')

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        console.log('Loaded cart from localStorage:', parsedCart.length, 'items');
        setCart(parsedCart)
      }

      if (savedCliente) {
        const parsedCliente = JSON.parse(savedCliente)
        console.log('Loaded cliente from localStorage:', parsedCliente);
        setCliente(parsedCliente)
      }

      if (savedDescuento) {
        const parsedDescuento = Number(savedDescuento)
        console.log('Loaded descuento from localStorage:', parsedDescuento);
        setDescuento(parsedDescuento)
      }

      if (savedMetodoPago) {
        console.log('Loaded metodoPago from localStorage:', savedMetodoPago);
        setMetodoPago(savedMetodoPago)
      }

      if (savedNotas) {
        console.log('Loaded notas from localStorage:', savedNotas);
        setNotas(savedNotas)
      }

      if (savedIsCartOpen) {
        const parsedIsCartOpen = savedIsCartOpen === 'true'
        console.log('Loaded isCartOpen from localStorage:', parsedIsCartOpen);
        setIsCartOpen(parsedIsCartOpen)
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      // Limpiar localStorage corrupto
      localStorage.removeItem('inventariosApp_cart')
      localStorage.removeItem('inventariosApp_cliente')
      localStorage.removeItem('inventariosApp_descuento')
      localStorage.removeItem('inventariosApp_metodoPago')
      localStorage.removeItem('inventariosApp_notas')
      localStorage.removeItem('inventariosApp_isCartOpen')
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('inventariosApp_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('inventariosApp_cliente', JSON.stringify(cliente))
  }, [cliente])

  useEffect(() => {
    localStorage.setItem('inventariosApp_descuento', descuento.toString())
  }, [descuento])

  useEffect(() => {
    localStorage.setItem('inventariosApp_metodoPago', metodoPago)
  }, [metodoPago])

  useEffect(() => {
    localStorage.setItem('inventariosApp_notas', notas)
  }, [notas])

  useEffect(() => {
    localStorage.setItem('inventariosApp_isCartOpen', isCartOpen.toString())
  }, [isCartOpen])

  const addToCart = (product: IProduct, tipoVenta: 'unidad' | 'empaque' = 'unidad', cantidad: number = 1) => {
    // Verificar que el producto permita este tipo de venta
    if (!puedeVenderComo(product, tipoVenta)) {
      toast.error(`Este producto no se puede vender como ${tipoVenta}`)
      return
    }

  const existingItem = cart.find(item => item.producto === product._id && item.tipoVenta === tipoVenta)

    if (existingItem) {
      // Si ya existe con el mismo tipo de venta, incrementar cantidad
      const newQuantity = existingItem.cantidad + cantidad
      const maxStock = calcularStockDisponible(product, tipoVenta)

      if (newQuantity > maxStock) {
        const infoStock = product.getInfoStock ? product.getInfoStock() : { cajasCompletas: 0, unidadesSueltas: product.stock };
        toast.error(`Stock insuficiente. Disponible: ${maxStock} ${tipoVenta === 'empaque' ? 'empaques' : 'unidades'} (${infoStock.cajasCompletas} cajas + ${infoStock.unidadesSueltas} unidades)`)
        return
      }

      updateCartItem(existingItem.producto, newQuantity)
    } else {
      // Si no existe, agregar nuevo item
      const maxStock = calcularStockDisponible(product, tipoVenta)

      if (cantidad > maxStock) {
        const infoStock = product.getInfoStock ? product.getInfoStock() : { cajasCompletas: 0, unidadesSueltas: product.stock };
        toast.error(`Stock insuficiente. Disponible: ${maxStock} ${tipoVenta === 'empaque' ? 'empaques' : 'unidades'} (${infoStock.cajasCompletas} cajas + ${infoStock.unidadesSueltas} unidades)`)
        return
      }

      // Usar el precio correcto según el tipo de venta
      const precioUnitario = getPrecioProducto(product, tipoVenta)

      const newItem: SaleItem = {
        producto: product._id,
        nombreProducto: product.nombre,
        cantidad: cantidad,
        tipoVenta,
        precioUnitario,
        precioTotal: precioUnitario * cantidad,
        unidadesPorEmpaque: product.unidadesPorEmpaque
      }

      setCart([...cart, newItem])
      toast.success(`${product.nombre} agregado al carrito (${tipoVenta})`)
    }
  }

  const updateCartItem = (productId: string, newQuantity: number) => {
    setCart(cart.map(item => {
      if (item.producto === productId) {
        const newTotal = item.precioUnitario * newQuantity
        return { ...item, cantidad: newQuantity, precioTotal: newTotal }
      }
      return item
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.producto !== productId))
  }

  const clearCart = () => {
    setCart([])
    setCliente({ nombre: '', cedula: '', telefono: '' })
    setDescuento(0)
    setMetodoPago('efectivo')
    setNotas('')
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.precioTotal, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discountAmount = (subtotal * descuento) / 100
    return subtotal - discountAmount
  }

  const scanBarcode = async (barcode: string) => {
    try {
      setIsScanning(true)

      // Buscar producto por codigo de barras
      const response = await fetch(`/api/products?codigoBarras=${barcode}`)

      if (response.ok) {
        const products = await response.json()
  const product = products.find((p: IProduct) => p.activo && p.stock > 0)

        if (product) {
          addToCart(product, 'unidad')
          toast.success(`Producto escaneado: ${product.nombre}`)
        } else {
          toast.error('Producto no encontrado o sin stock')
        }
      } else {
        toast.error('Error al buscar producto')
      }
    } catch (error) {
      console.error('Error scanning barcode:', error)
      toast.error('Error al escanear codigo de barras')
    } finally {
      setIsScanning(false)
    }
  }

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Debe agregar al menos un producto al carrito')
      return
    }

    try {
      // Guardar cliente si existe (especialmente clientes nuevos)
      if (cliente.nombre && cliente.cedula) {
        try {
          await fetch('/api/clients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cedula: cliente.cedula,
              nombre: cliente.nombre,
              telefono: cliente.telefono || ''
            }),
          });
        } catch (clientError) {
          console.error('Error saving client:', clientError);
          // No interrumpir la venta si falla guardar cliente
        }
      }

      const saleData = {
        cliente: cliente.nombre ? cliente : undefined,
        items: cart.map(item => ({
          producto: item.producto,
          nombreProducto: item.nombreProducto,
          cantidad: item.cantidad,
          tipoVenta: item.tipoVenta,
          precioUnitario: item.precioUnitario,
          precioTotal: item.precioTotal
        })),
        descuento,
        metodoPago,
        notas
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })

      if (response.ok) {
        const newSale = await response.json()
        toast.success('Venta procesada exitosamente')
        clearCart()
        setIsCartOpen(false)
        return newSale
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al procesar la venta')
        return null
      }
    } catch (error) {
      console.error('Error processing sale:', error)
      toast.error('Error de conexion')
      return null
    }
  }

  const value: CartContextType = {
    cart,
    cliente,
    descuento,
    metodoPago,
    notas,
    isCartOpen,
    isScanning,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setCliente,
    setDescuento,
    setMetodoPago,
    setNotas,
    setIsCartOpen,
    setIsScanning,
    calculateSubtotal,
    calculateTotal,
    scanBarcode,
    processSale
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
