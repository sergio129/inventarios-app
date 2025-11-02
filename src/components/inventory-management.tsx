'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Package, Plus, Edit, TrendingUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioCaja: number;
  precioCompra: number;
  precioCompraCaja: number;
  stockCajas: number;
  unidadesPorCaja: number;
  stockUnidadesSueltas: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  marca?: string;
  codigo?: string;
  codigoBarras?: string;
  activo: boolean;
  margenGananciaUnidad?: number;
  margenGananciaCaja?: number;
  fechaCreacion: string;
}

interface InventoryUpdateForm {
  stockCajas: string;
  unidadesPorCaja: string;
  stockUnidadesSueltas: string;
  precioCompra: string;
  precioCompraCaja: string;
  precio: string;
  precioCaja: string;
  margenGananciaUnidad: string;
  margenGananciaCaja: string;
}

export default function InventoryManagement() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState<InventoryUpdateForm>({
    stockCajas: '',
    unidadesPorCaja: '',
    stockUnidadesSueltas: '',
    precioCompra: '',
    precioCompraCaja: '',
    precio: '',
    precioCaja: '',
    margenGananciaUnidad: '',
    margenGananciaCaja: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        let data = await response.json();

        // Migrar productos que no tienen los campos nuevos (solución temporal)
        data = data.map((product: Product) => ({
          ...product,
          stockCajas: product.stockCajas ?? 0,
          unidadesPorCaja: product.unidadesPorCaja ?? 1,
          stockUnidadesSueltas: product.stockUnidadesSueltas ?? 0,
          precioCompraCaja: product.precioCompraCaja ?? 0,
          precioCaja: product.precioCaja ?? 0,
          margenGananciaUnidad: product.margenGananciaUnidad ?? 0,
          margenGananciaCaja: product.margenGananciaCaja ?? 0
        }));

        setProducts(data);
      } else {
        toast.error('Error al cargar productos');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateDialog = (product: Product) => {
    setSelectedProduct(product);
    const precioCompra = product.precioCompra ?? 0;
    const precioCompraCaja = product.precioCompraCaja ?? 0;
    const precio = product.precio ?? 0;
    const precioCaja = product.precioCaja ?? 0;

    setUpdateForm({
      stockCajas: (product.stockCajas ?? 0).toString(),
      unidadesPorCaja: (product.unidadesPorCaja ?? 1).toString(),
      stockUnidadesSueltas: (product.stockUnidadesSueltas ?? 0).toString(),
      precioCompra: precioCompra.toString(),
      precioCompraCaja: precioCompraCaja.toString(),
      precio: precio.toString(),
      precioCaja: precioCaja.toString(),
      margenGananciaUnidad: precioCompra > 0 ? (((precio - precioCompra) / precioCompra) * 100).toFixed(2) : '0',
      margenGananciaCaja: precioCompraCaja > 0 ? (((precioCaja - precioCompraCaja) / precioCompraCaja) * 100).toFixed(2) : '0'
    });
    setIsUpdateDialogOpen(true);
  };

  const updateInventory = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockCajas: (() => { const v = parseInt(updateForm.stockCajas || '0', 10); return Number.isNaN(v) ? 0 : Math.max(0, v) })(),
          unidadesPorCaja: (() => { const v = parseInt(updateForm.unidadesPorCaja || '1', 10); return Number.isNaN(v) ? 1 : Math.max(1, v) })(),
          stockUnidadesSueltas: (() => { const v = parseInt(updateForm.stockUnidadesSueltas || '0', 10); return Number.isNaN(v) ? 0 : Math.max(0, v) })(),
          precioCompra: (() => { const v = parseFloat(updateForm.precioCompra || '0'); return Number.isNaN(v) ? 0 : v })(),
          precioCompraCaja: (() => { const v = parseFloat(updateForm.precioCompraCaja || '0'); return Number.isNaN(v) ? 0 : v })(),
          precio: (() => { const v = parseFloat(updateForm.precio || '0'); return Number.isNaN(v) ? 0 : v })(),
          precioCaja: (() => { const v = parseFloat(updateForm.precioCaja || '0'); return Number.isNaN(v) ? 0 : v })()
        })
      });

      if (response.ok) {
        toast.success('Inventario actualizado exitosamente');
        setIsUpdateDialogOpen(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar inventario');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Error de conexión');
    }
  };

  const addStock = (type: 'cajas' | 'unidades', amount: number) => {
    if (!selectedProduct) return;

    const currentCajas = parseInt(updateForm.stockCajas) || 0;
    const currentUnidades = parseInt(updateForm.stockUnidadesSueltas) || 0;
    const unidadesPorCaja = parseInt(updateForm.unidadesPorCaja) || 1;

    if (type === 'cajas') {
      setUpdateForm({
        ...updateForm,
        stockCajas: (currentCajas + amount).toString()
      });
    } else {
      setUpdateForm({
        ...updateForm,
        stockUnidadesSueltas: (currentUnidades + amount).toString()
      });
    }
  };

  const calculatePriceFromMargin = (costPrice: number, margin: number) => {
    return costPrice * (1 + margin / 100);
  };

  const calculateMarginFromPrice = (costPrice: number, sellingPrice: number) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  };

  const updatePriceFromMargin = (type: 'unidad' | 'caja') => {
    const margin = parseFloat(type === 'unidad' ? updateForm.margenGananciaUnidad : updateForm.margenGananciaCaja) || 0;
    const costPrice = parseFloat(type === 'unidad' ? updateForm.precioCompra : updateForm.precioCompraCaja) || 0;

    if (costPrice > 0) {
      const newPrice = calculatePriceFromMargin(costPrice, margin);
      if (type === 'unidad') {
        setUpdateForm({ ...updateForm, precio: newPrice.toFixed(2) });
      } else {
        setUpdateForm({ ...updateForm, precioCaja: newPrice.toFixed(2) });
      }
    }
  };

  const updateMarginFromPrice = (type: 'unidad' | 'caja') => {
    const sellingPrice = parseFloat(type === 'unidad' ? updateForm.precio : updateForm.precioCaja) || 0;
    const costPrice = parseFloat(type === 'unidad' ? updateForm.precioCompra : updateForm.precioCompraCaja) || 0;

    if (costPrice > 0) {
      const newMargin = calculateMarginFromPrice(costPrice, sellingPrice);
      if (type === 'unidad') {
        setUpdateForm({ ...updateForm, margenGananciaUnidad: newMargin.toFixed(2) });
      } else {
        setUpdateForm({ ...updateForm, margenGananciaCaja: newMargin.toFixed(2) });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/inventory')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inventario
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600">Actualiza stock y precios de productos sin modificar su información básica</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                Buscar productos
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, código o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos ({filteredProducts.length})
          </CardTitle>
          <CardDescription>
            Selecciona un producto para actualizar su inventario y precios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Precio Compra</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.nombre}</TableCell>
                  <TableCell className="font-mono text-sm">{product.codigo}</TableCell>
                  <TableCell>{product.categoria}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-bold">{product.stock} total</div>
                      <div className="text-gray-500">
                        {product.stockCajas} cajas × {product.unidadesPorCaja} + {product.stockUnidadesSueltas} sueltas
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>${product.precio.toLocaleString()} (unidad)</div>
                      {product.precioCaja > 0 && (
                        <div className="text-gray-500">${product.precioCaja.toLocaleString()} (caja)</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>${product.precioCompra.toLocaleString()} (unidad)</div>
                      {product.precioCompraCaja > 0 && (
                        <div className="text-gray-500">${product.precioCompraCaja.toLocaleString()} (caja)</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog(product)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Actualizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de actualización de inventario */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Actualizar Inventario - {selectedProduct?.nombre}
            </DialogTitle>
            <DialogDescription>
              Modifica el stock y precios del producto. Los cambios se aplicarán inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sección de Control de Inventario */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Control de Inventario</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="update-stockCajas" className="text-sm font-medium text-gray-700">
                    Cajas Completas
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="update-stockCajas"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={updateForm.stockCajas}
                      onChange={(e) => {
                        // Allow only digits, strip non-digits
                        const digitsOnly = e.target.value.replace(/\D+/g, '')
                        // Normalize leading zeros
                        const normalized = digitsOnly.replace(/^0+(\d)/, '$1')
                        setUpdateForm({ ...updateForm, stockCajas: normalized })
                      }}
                      placeholder="0"
                      className="text-right"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStock('cajas', 1)}
                      className="px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update-unidadesPorCaja" className="text-sm font-medium text-gray-700">
                    Unidades por Caja
                  </Label>
                  <Input
                    id="update-unidadesPorCaja"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={updateForm.unidadesPorCaja}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D+/g, '')
                      const normalized = digitsOnly.replace(/^0+(\d)/, '$1')
                      setUpdateForm({ ...updateForm, unidadesPorCaja: normalized })
                    }}
                    placeholder="1"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update-stockUnidadesSueltas" className="text-sm font-medium text-gray-700">
                    Unidades Sueltas
                  </Label>
                    <div className="flex gap-2">
                    <Input
                      id="update-stockUnidadesSueltas"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={updateForm.stockUnidadesSueltas}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D+/g, '')
                        const normalized = digitsOnly.replace(/^0+(\d)/, '$1')
                        setUpdateForm({ ...updateForm, stockUnidadesSueltas: normalized })
                      }}
                      placeholder="0"
                      className="text-right"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStock('unidades', 1)}
                      className="px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>Total estimado:</strong> {((parseInt(updateForm.stockCajas) || 0) * (parseInt(updateForm.unidadesPorCaja) || 1)) + (parseInt(updateForm.stockUnidadesSueltas) || 0)} unidades
                </div>
              </div>
            </div>

            {/* Sección de Precios y Ganancias */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Precios y Márgenes de Ganancia</h3>

              {/* Precios de Compra */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Precios de Compra</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-precioCompraCaja" className="text-sm font-medium text-gray-700">
                      Por Caja Completa
                    </Label>
                    <Input
                      id="update-precioCompraCaja"
                      type="text"
                      value={updateForm.precioCompraCaja}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setUpdateForm({ ...updateForm, precioCompraCaja: value });
                        }
                      }}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-precioCompra" className="text-sm font-medium text-gray-700">
                      Por Unidad
                    </Label>
                    <Input
                      id="update-precioCompra"
                      type="text"
                      value={updateForm.precioCompra}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setUpdateForm({ ...updateForm, precioCompra: value });
                        }
                      }}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Márgenes de Ganancia */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Porcentaje de Ganancia (%)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-margenGananciaCaja" className="text-sm font-medium text-gray-700">
                      Para Cajas Completas
                    </Label>
                    <Input
                      id="update-margenGananciaCaja"
                      type="text"
                      value={updateForm.margenGananciaCaja}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setUpdateForm({ ...updateForm, margenGananciaCaja: value });
                        }
                      }}
                      onBlur={() => updatePriceFromMargin('caja')}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-margenGananciaUnidad" className="text-sm font-medium text-gray-700">
                      Para Unidades
                    </Label>
                    <Input
                      id="update-margenGananciaUnidad"
                      type="text"
                      value={updateForm.margenGananciaUnidad}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setUpdateForm({ ...updateForm, margenGananciaUnidad: value });
                        }
                      }}
                      onBlur={() => updatePriceFromMargin('unidad')}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Precios de Venta */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Precios de Venta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-precioCaja" className="text-sm font-medium text-gray-700">
                      Por Caja Completa
                    </Label>
                    <Input
                      id="update-precioCaja"
                      type="text"
                      value={updateForm.precioCaja}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setUpdateForm({ ...updateForm, precioCaja: value });
                          updateMarginFromPrice('caja');
                        }
                      }}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-precio" className="text-sm font-medium text-gray-700">
                      Por Unidad
                    </Label>
                    <Input
                      id="update-precio"
                      type="text"
                      value={updateForm.precio}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setUpdateForm({ ...updateForm, precio: value });
                          updateMarginFromPrice('unidad');
                        }
                      }}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateInventory} className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Actualizar Inventario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}