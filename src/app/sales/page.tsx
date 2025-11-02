'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, ArrowLeft, Receipt, Minus, Package, User, Percent } from 'lucide-react';
import { Invoice } from '@/components/invoice';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/currency-utils';
import IProduct from '@/lib/types/product'

interface Sale {
  _id: string;
  numeroFactura: string;
  cliente?: {
    nombre: string;
    cedula?: string;
    telefono?: string;
  };
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
  estado: string;
  vendedor?: {
    name: string;
    email: string;
  };
  notas?: string;
  fechaVenta: Date;
  fechaCreacion: Date;
}

export default function SalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    cart,
    cliente,
    descuento,
    metodoPago,
    notas,
    setCliente,
    setDescuento,
    setMetodoPago,
    setNotas,
    addToCart,
    removeFromCart,
    calculateSubtotal,
    calculateTotal,
    processSale
  } = useCart();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Nuevos estados para la funcionalidad de ventas
  const [products, setProducts] = useState<IProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Estado para el modal de factura
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    fetchSales();
    fetchProducts();
  }, [session, status, router]);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      } else {
        toast.error('Error al cargar ventas');
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const filterSales = useCallback(() => {
    let filtered = sales;

    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.cliente?.cedula?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.estado === statusFilter);
    }

    setFilteredSales(filtered);
  }, [sales, searchTerm, statusFilter]);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter, filterSales]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        // Solo productos activos con stock disponible
  const availableProducts = data.filter((product: IProduct) => product.activo && product.stock > 0);
        setProducts(availableProducts);
      } else {
        toast.error('Error al cargar productos');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error de conexión');
    }
  };

  const filterProducts = useCallback(() => {
    if (!productSearchTerm) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.nombre.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      (product.codigo && product.codigo.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
      (product.codigoBarras && product.codigoBarras.includes(productSearchTerm))
    );

    setFilteredProducts(filtered);
  }, [products, productSearchTerm]);

  useEffect(() => {
    filterProducts();
  }, [products, productSearchTerm, filterProducts]);

  // Manejo de escaneo de código de barras
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario está escribiendo en un input, no procesar
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.id !== 'barcode-reader') {
        return;
      }

      // Enter: procesar el código escanedo
      if (e.key === 'Enter' && barcodeInput) {
        e.preventDefault();
        processBarcodeScanned(barcodeInput);
        setBarcodeInput('');
        return;
      }

      // Acumular caracteres para el código de barras
      if (barcodeInput || (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey)) {
        setBarcodeInput((prev) => prev + e.key);

        // Limpiar timeout anterior
        clearTimeout(timeoutId);

        // Si no se presiona Enter en 100ms, limpiar (no es un escaneo)
        timeoutId = setTimeout(() => {
          setBarcodeInput('');
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [barcodeInput, products]);

  const processBarcodeScanned = (barcode: string) => {
    // Buscar el producto por código de barras
    const product = products.find(
      (p) => p.codigoBarras && p.codigoBarras.includes(barcode.trim())
    );

    if (product) {
      // Agregar al carrito por unidad automáticamente
      addToCart(product, 'unidad');
      toast.success(`${product.nombre} agregado al carrito`);
    } else {
      toast.error(`Producto con código ${barcode} no encontrado`);
    }
  };

  const createSale = async () => {
    await processSale();
    fetchSales();
    fetchProducts(); // Recargar productos para actualizar stock
  };

  const viewInvoice = async (saleId: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}`);
      if (response.ok) {
        const sale = await response.json();
        // Agregar propiedades faltantes para el componente Invoice
        const invoiceSale = {
          ...sale,
          subtotal: sale.total, // Asumir que el subtotal es igual al total si no hay descuento
          descuento: 0,
          impuesto: 0,
          fechaVenta: new Date(sale.fechaCreacion),
          fechaCreacion: new Date(sale.fechaCreacion),
          vendedor: {
            name: 'Sistema',
            email: 'sistema@inventariosapp.com'
          }
        };
        setSelectedSale(invoiceSale);
        setShowInvoice(true);
      } else {
        toast.error('Error al cargar la factura');
      }
    } catch (error) {
      console.error('Error cargando factura:', error);
      toast.error('Error de conexión');
    }
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setSelectedSale(null);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'default' as const;
      case 'pendiente':
        return 'secondary' as const;
      case 'cancelada':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getPaymentMethodColor = (metodo: string) => {
    switch (metodo) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'transferencia':
        return 'bg-purple-100 text-purple-800';
      case 'credito':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Input invisible para lector de código de barras */}
      <input
        id="barcode-reader"
        type="text"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        className="fixed -top-96 -left-96 opacity-0 pointer-events-none"
        autoComplete="off"
        spellCheck="false"
        aria-hidden="true"
      />

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 -z-10" />

      <div className="container mx-auto px-6 py-8 relative">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Punto de Venta
                  </h1>
                  <p className="text-gray-600 text-lg">Sistema completo de ventas y facturación</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de Productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Búsqueda de Productos */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Productos Disponibles
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Busca productos por nombre, código o código de barras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <Card key={product._id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.nombre}</h3>
                          <p className="text-sm text-gray-600">{product.descripcion}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {product.categoria}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Stock: {product.stock}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(product.precio)}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(product, 'unidad')}
                              className="text-xs"
                            >
                              Unidad
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product, 'empaque')}
                              className="text-xs bg-blue-600 hover:bg-blue-700"
                            >
                              Caja
                            </Button>
                          </div>
                        </div>

                        {product.codigo && (
                          <p className="text-xs text-gray-500">Código: {product.codigo}</p>
                        )}
                        {product.codigoBarras && (
                          <p className="text-xs text-gray-500">CB: {product.codigoBarras}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredProducts.length === 0 && productSearchTerm && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron productos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel del Carrito y Checkout */}
          <div className="space-y-6">
            {/* Carrito de Compras */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Carrito de Compras
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {cart.length} producto{cart.length !== 1 ? 's' : ''} en el carrito
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.producto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.nombreProducto}</p>
                        <p className="text-xs text-gray-600">
                          {item.cantidad} {item.tipoVenta === 'empaque' ? `caja${item.cantidad !== 1 ? 's' : ''}` : `unidad${item.cantidad !== 1 ? 'es' : ''}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{formatCurrency(item.precioTotal)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.producto)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>El carrito está vacío</p>
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="descuento" className="text-sm">Descuento (%):</Label>
                      <Input
                        id="descuento"
                        type="number"
                        min="0"
                        max="100"
                        value={descuento}
                        onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                        className="w-20 h-8 text-sm"
                      />
                    </div>

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Cliente y Pago */}
            {cart.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Información de Venta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cliente-nombre" className="text-sm font-medium">Nombre del Cliente (Opcional)</Label>
                      <Input
                        id="cliente-nombre"
                        value={cliente.nombre}
                        onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cliente-cedula" className="text-sm font-medium">Cédula</Label>
                        <Input
                          id="cliente-cedula"
                          value={cliente.cedula}
                          onChange={(e) => setCliente({ ...cliente, cedula: e.target.value })}
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cliente-telefono" className="text-sm font-medium">Teléfono</Label>
                        <Input
                          id="cliente-telefono"
                          value={cliente.telefono}
                          onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                          placeholder="0987654321"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="metodo-pago" className="text-sm font-medium">Método de Pago</Label>
                      <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                          <SelectItem value="credito">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notas" className="text-sm font-medium">Notas (Opcional)</Label>
                      <Input
                        id="notas"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Observaciones adicionales"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={createSale}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    Procesar Venta - {formatCurrency(calculateTotal())}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Historial de Ventas */}
        <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              Historial de Ventas
            </CardTitle>
            <CardDescription className="text-gray-600">
              Registro completo de todas las ventas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por factura, cliente o cédula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completada">Completadas</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de Ventas */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-medium">{sale.numeroFactura}</TableCell>
                      <TableCell>
                        {sale.cliente?.nombre || 'Cliente General'}
                        {sale.cliente?.cedula && (
                          <div className="text-xs text-gray-500">CI: {sale.cliente.cedula}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sale.items.slice(0, 2).map((item, index) => (
                            <div key={index}>
                              {item.nombreProducto} ({item.cantidad})
                            </div>
                          ))}
                          {sale.items.length > 2 && (
                            <div className="text-gray-500">+{sale.items.length - 2} más...</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(sale.metodoPago)}>
                          {sale.metodoPago}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(sale.estado)}>
                          {sale.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(sale.fechaCreacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewInvoice(sale._id)}
                          className="flex items-center gap-2"
                        >
                          <Receipt className="h-4 w-4" />
                          Ver Factura
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredSales.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay ventas registradas</h3>
                <p>Las ventas aparecerán aquí una vez que se realicen</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Factura */}
      {showInvoice && selectedSale && (
        <Invoice
          sale={selectedSale}
          onClose={closeInvoice}
        />
      )}
    </div>
  );
}
