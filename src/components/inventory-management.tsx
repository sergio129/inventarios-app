'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Package, Plus, Edit, TrendingUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import ProductHistory from '@/components/product-history';
import { validarPreciosCoherentes } from '@/lib/validation-service';
import { calcularPrecioMinimo } from '@/lib/discount-validator';
import Pagination from '@/components/pagination';

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

interface Filters {
  stockMin: string;
  stockMax: string;
  precioMin: string;
  precioMax: string;
  sortBy: 'nombre' | 'stock' | 'precio' | 'categoria';
  sortOrder: 'asc' | 'desc';
}

export default function InventoryManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [lowStockAlertOpen, setLowStockAlertOpen] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit') || '20'));
  
  const [filters, setFilters] = useState<Filters>({
    stockMin: '',
    stockMax: '',
    precioMin: '',
    precioMax: '',
    sortBy: 'nombre',
    sortOrder: 'asc',
  });
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
  const [lastEditedPriceField, setLastEditedPriceField] = useState<'precio' | 'margen' | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Detectar productos con stock bajo
  useEffect(() => {
    const productsWithLowStock = products.filter(product => {
      // Calcular el stock total correctamente
      const totalStock = (product.stockCajas * product.unidadesPorCaja) + product.stockUnidadesSueltas;
      return totalStock > 0 && totalStock <= 2;
    });
    if (productsWithLowStock.length > 0) {
      setLowStockProducts(productsWithLowStock);
      setLowStockAlertOpen(true);
    }
  }, [products]);

  useEffect(() => {
    const filtered = products.filter(product => {
      // Búsqueda por término
      const matchesSearch = 
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categoria.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro de stock
      const totalStock = (product.stockCajas * product.unidadesPorCaja) + product.stockUnidadesSueltas;
      if (filters.stockMin && totalStock < parseInt(filters.stockMin)) return false;
      if (filters.stockMax && totalStock > parseInt(filters.stockMax)) return false;

      // Filtro de precio
      if (filters.precioMin && product.precio < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax && product.precio > parseFloat(filters.precioMax)) return false;

      return true;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (filters.sortBy) {
        case 'stock':
          valueA = (a.stockCajas * a.unidadesPorCaja) + a.stockUnidadesSueltas;
          valueB = (b.stockCajas * b.unidadesPorCaja) + b.stockUnidadesSueltas;
          break;
        case 'precio':
          valueA = a.precio;
          valueB = b.precio;
          break;
        case 'categoria':
          valueA = a.categoria;
          valueB = b.categoria;
          break;
        default:
          valueA = a.nombre;
          valueB = b.nombre;
      }

      if (typeof valueA === 'string') {
        return filters.sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return filters.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFilteredProducts(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [products, searchTerm, filters]);

  // Actualizar URL con parámetros de paginación
  const updateUrl = (page: number, limit: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    // Aquí usamos window.history para evitar duplicación con router.push
    window.history.replaceState({}, '', `?${params.toString()}`);
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(page, itemsPerPage);
    // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    updateUrl(1, newLimit);
  };

  // Calcular productos paginados
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Actualizar formulario cuando cambia selectedProduct
  useEffect(() => {
    if (selectedProduct) {
      const precioCompra = selectedProduct.precioCompra ?? 0;
      const precioCompraCaja = selectedProduct.precioCompraCaja ?? 0;
      const precio = selectedProduct.precio ?? 0;
      const precioCaja = selectedProduct.precioCaja ?? 0;

      setUpdateForm({
        stockCajas: (selectedProduct.stockCajas ?? 0).toString(),
        unidadesPorCaja: (selectedProduct.unidadesPorCaja ?? 1).toString(),
        stockUnidadesSueltas: (selectedProduct.stockUnidadesSueltas ?? 0).toString(),
        precioCompra: precioCompra.toString(),
        precioCompraCaja: precioCompraCaja.toString(),
        precio: precio.toString(),
        precioCaja: precioCaja.toString(),
        margenGananciaUnidad: precioCompra > 0 ? (((precio - precioCompra) / precioCompra) * 100).toFixed(2) : '0',
        margenGananciaCaja: precioCompraCaja > 0 ? (((precioCaja - precioCompraCaja) / precioCompraCaja) * 100).toFixed(2) : '0'
      });
    }
  }, [selectedProduct]);

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
    setLastEditedPriceField(null);
    setIsUpdateDialogOpen(true);
  };

  const validarAntesDeGuardar = (): { valido: boolean; mensajes: string[] } => {
    const mensajes: string[] = [];

    const precioCompra = parseFloat(updateForm.precioCompra || '0') || 0;
    const precio = parseFloat(updateForm.precio || '0') || 0;

    // Validar precios
    if (precioCompra > 0 && precio > 0) {
      const validacionPrecio = validarPreciosCoherentes(precioCompra, precio);
      if (!validacionPrecio.valido) {
        mensajes.push(validacionPrecio.mensaje);
      }
    }

    // Validar unidades por caja
    const unidadesPorCaja = parseInt(updateForm.unidadesPorCaja || '1');
    if (unidadesPorCaja < 1) {
      mensajes.push('Las unidades por caja deben ser mínimo 1');
    }

    return {
      valido: mensajes.length === 0,
      mensajes,
    };
  };

  const updateInventory = async () => {
    if (!selectedProduct) return;

    // Validar antes de enviar
    const validacion = validarAntesDeGuardar();
    if (!validacion.valido) {
      validacion.mensajes.forEach(msg => toast.error(msg));
      return;
    }

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
    // Solo calcular si el último campo editado fue el margen
    if (lastEditedPriceField !== 'margen') return;
    
    const margin = parseFloat(type === 'unidad' ? updateForm.margenGananciaUnidad : updateForm.margenGananciaCaja) || 0;
    const costPrice = parseFloat(type === 'unidad' ? updateForm.precioCompra : updateForm.precioCompraCaja) || 0;

    if (costPrice > 0) {
      const newPrice = calculatePriceFromMargin(costPrice, margin);
      if (type === 'unidad') {
        setUpdateForm({ ...updateForm, precio: newPrice.toFixed(2) });
      } else {
        setUpdateForm({ ...updateForm, precioCaja: newPrice.toFixed(2) });
      }
      setLastEditedPriceField(null);
    }
  };

  const updateMarginFromPrice = (type: 'unidad' | 'caja') => {
    // Solo calcular si el último campo editado fue el precio
    if (lastEditedPriceField !== 'precio') return;
    
    const sellingPrice = parseFloat(type === 'unidad' ? updateForm.precio : updateForm.precioCaja) || 0;
    const costPrice = parseFloat(type === 'unidad' ? updateForm.precioCompra : updateForm.precioCompraCaja) || 0;

    if (costPrice > 0) {
      const newMargin = calculateMarginFromPrice(costPrice, sellingPrice);
      if (type === 'unidad') {
        setUpdateForm({ ...updateForm, margenGananciaUnidad: newMargin.toFixed(2) });
      } else {
        setUpdateForm({ ...updateForm, margenGananciaCaja: newMargin.toFixed(2) });
      }
      setLastEditedPriceField(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header con navegación - Moderno */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/inventory')}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 mb-4 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Inventario
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Gestión de Inventario
              </h1>
              <p className="text-gray-600 font-medium">Actualiza stock y precios de productos sin modificar su información básica</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg px-4 py-2"
          >
            <Package className="h-4 w-4" />
            Dashboard
          </Button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <Card className="mb-6 border-0 shadow-lg bg-white rounded-xl overflow-hidden">
          <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div>
              <Label htmlFor="search" className="text-sm font-bold text-gray-700 mb-3 block">
                🔍 Buscar productos
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-indigo-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, código o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 transition-all bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Filtros Avanzados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-6 border-t-2 border-gray-200">
              {/* Filtro Stock Mínimo */}
              <div className="space-y-2">
                <Label htmlFor="stockMin" className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  📦 Stock Mín
                </Label>
                <Input
                  id="stockMin"
                  type="number"
                  placeholder="Desde"
                  value={filters.stockMin}
                  onChange={(e) =>
                    setFilters({ ...filters, stockMin: e.target.value })
                  }
                  className="text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
                  min="0"
                />
              </div>

              {/* Filtro Stock Máximo */}
              <div className="space-y-2">
                <Label htmlFor="stockMax" className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  📦 Stock Máx
                </Label>
                <Input
                  id="stockMax"
                  type="number"
                  placeholder="Hasta"
                  value={filters.stockMax}
                  onChange={(e) =>
                    setFilters({ ...filters, stockMax: e.target.value })
                  }
                  className="text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-all"
                  min="0"
                />
              </div>

              {/* Filtro Precio Mínimo */}
              <div className="space-y-2">
                <Label htmlFor="precioMin" className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  💰 Precio Mín
                </Label>
                <Input
                  id="precioMin"
                  type="number"
                  placeholder="Desde"
                  value={filters.precioMin}
                  onChange={(e) =>
                    setFilters({ ...filters, precioMin: e.target.value })
                  }
                  className="text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-all"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Filtro Precio Máximo */}
              <div className="space-y-2">
                <Label htmlFor="precioMax" className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  💰 Precio Máx
                </Label>
                <Input
                  id="precioMax"
                  type="number"
                  placeholder="Hasta"
                  value={filters.precioMax}
                  onChange={(e) =>
                    setFilters({ ...filters, precioMax: e.target.value })
                  }
                  className="text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 bg-gray-50 hover:bg-white transition-all"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Ordenar Por */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  📊 Ordenar Por
                </Label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({ ...filters, sortBy: e.target.value as any })
                    }
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-purple-500 focus:ring-purple-500 bg-gray-50 hover:bg-white transition-all cursor-pointer"
                  >
                    <option value="nombre">Nombre</option>
                    <option value="stock">Stock</option>
                    <option value="precio">Precio</option>
                    <option value="categoria">Categoría</option>
                  </select>
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                      })
                    }
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold bg-gray-50 hover:bg-white hover:border-purple-500 hover:text-purple-600 transition-all"
                    title={`Ordenar ${filters.sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Botón Limpiar Filtros */}
            {(filters.stockMin || filters.stockMax || filters.precioMin || filters.precioMax) && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      stockMin: '',
                      stockMax: '',
                      precioMin: '',
                      precioMax: '',
                      sortBy: 'nombre',
                      sortOrder: 'asc',
                    })
                  }
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                >
                  ✕ Limpiar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-gray-200 py-5">
          <CardTitle className="flex items-center gap-2 text-indigo-900 text-xl">
            <Package className="h-6 w-6 text-indigo-600" />
            Productos ({filteredProducts.length})
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">
            Mostrando {paginatedProducts.length} de {filteredProducts.length} productos • Página {currentPage}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-150 border-b-2 border-gray-300">
                  <TableHead className="font-bold text-gray-700 py-4 px-4">Producto</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">Código</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">Categoría</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">📦 Stock Actual</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">💰 Precio Venta</TableHead>
                  <TableHead className="font-bold text-gray-700 py-4 px-4">💳 Precio Compra</TableHead>
                  <TableHead className="text-right font-bold text-gray-700 py-4 px-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <TableCell className="font-bold text-gray-900 py-4 px-4">{product.nombre}</TableCell>
                    <TableCell className="font-mono text-sm text-indigo-600 py-4 px-4 bg-gray-50">{product.codigo}</TableCell>
                    <TableCell className="text-gray-700 py-4 px-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {product.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-bold text-lg text-green-600">{product.stock} total</div>
                        <div className="text-gray-500 text-xs">
                          {product.stockCajas} cajas × {product.unidadesPorCaja} + {product.stockUnidadesSueltas} sueltas
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-bold text-green-600">${product.precio.toLocaleString()}</div>
                        {product.precioCaja > 0 && (
                          <div className="text-gray-500 text-xs">${product.precioCaja.toLocaleString()} (caja)</div>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="text-xs text-red-600 font-semibold">
                            Mín: ${calcularPrecioMinimo(product.precio, product.precioCompra).toLocaleString()}
                          </div>
                          {product.precioCaja > 0 && (
                            <div className="text-xs text-red-500">
                              Mín (caja): ${calcularPrecioMinimo(product.precioCaja, product.precioCompraCaja).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-bold text-orange-600">${product.precioCompra.toLocaleString()}</div>
                        {product.precioCompraCaja > 0 && (
                          <div className="text-gray-500 text-xs">${product.precioCompraCaja.toLocaleString()} (caja)</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 px-4">
                      <Button
                        onClick={() => openUpdateDialog(product)}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-lg flex items-center gap-2 px-4 py-2 transition-all"
                      >
                        <Edit className="h-4 w-4" />
                        Actualizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Componente de Paginación */}
      <Pagination
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredProducts.length}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Modal de actualización de inventario */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-xl -m-6 mb-6 p-6 pb-4">
            <DialogTitle className="flex items-center gap-3 text-white text-2xl font-bold">
              <TrendingUp className="h-6 w-6" />
              Actualizar Inventario - {selectedProduct?.nombre}
            </DialogTitle>
            <DialogDescription className="text-indigo-100 mt-2">
              Modifica el stock y precios del producto. Los cambios se aplicarán inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sección de Control de Inventario */}
            <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                📦 Control de Inventario
              </h3>

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

              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg">
                <div className="text-sm font-bold text-green-800">
                  ✓ Total estimado: <span className="text-lg">{((parseInt(updateForm.stockCajas) || 0) * (parseInt(updateForm.unidadesPorCaja) || 1)) + (parseInt(updateForm.stockUnidadesSueltas) || 0)} unidades</span>
                </div>
              </div>
            </div>

            {/* Sección de Precios y Ganancias */}
            <div className="space-y-6 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                💰 Precios y Márgenes de Ganancia
              </h3>

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
                      type="number"
                      step="0.01"
                      min="0"
                      value={updateForm.precioCompraCaja}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, precioCompraCaja: e.target.value });
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
                      type="number"
                      step="0.01"
                      min="0"
                      value={updateForm.precioCompra}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, precioCompra: e.target.value });
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
                      type="number"
                      step="0.01"
                      value={updateForm.margenGananciaCaja}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, margenGananciaCaja: e.target.value });
                        setLastEditedPriceField('margen');
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
                      type="number"
                      step="0.01"
                      value={updateForm.margenGananciaUnidad}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, margenGananciaUnidad: e.target.value });
                        setLastEditedPriceField('margen');
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
                      type="number"
                      step="0.01"
                      min="0"
                      value={updateForm.precioCaja}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, precioCaja: e.target.value });
                        setLastEditedPriceField('precio');
                      }}
                      onBlur={() => updateMarginFromPrice('caja')}
                      placeholder="0.00"
                      className="text-right"
                    />
                    {updateForm.precioCaja && parseFloat(updateForm.precioCaja) > 0 && (
                      <div className="text-xs text-red-600 font-semibold mt-1 p-2 bg-red-50 rounded border border-red-200">
                        💡 Precio Mínimo: ${calcularPrecioMinimo(parseFloat(updateForm.precioCaja), parseFloat(updateForm.precioCompraCaja) || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-precio" className="text-sm font-medium text-gray-700">
                      Por Unidad
                    </Label>
                    <Input
                      id="update-precio"
                      type="number"
                      step="0.01"
                      min="0"
                      value={updateForm.precio}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, precio: e.target.value });
                        setLastEditedPriceField('precio');
                      }}
                      onBlur={() => updateMarginFromPrice('unidad')}
                      placeholder="0.00"
                      className="text-right"
                    />
                    {updateForm.precio && parseFloat(updateForm.precio) > 0 && (
                      <div className="text-xs text-red-600 font-semibold mt-1 p-2 bg-red-50 rounded border border-red-200">
                        💡 Precio Mínimo: ${calcularPrecioMinimo(parseFloat(updateForm.precio), parseFloat(updateForm.precioCompra) || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historial de Cambios */}
          {selectedProduct && (
            <div className="mt-6 border-t pt-6">
              <ProductHistory productoId={selectedProduct._id} />
            </div>
          )}

          <DialogFooter className="gap-3 pt-6 border-t-2 border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsUpdateDialogOpen(false)}
              className="border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 rounded-lg"
            >
              ✕ Cancelar
            </Button>
            <Button 
              onClick={updateInventory} 
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-lg flex items-center gap-2 px-6"
            >
              <TrendingUp className="h-4 w-4" />
              Actualizar Inventario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alerta de Stock Bajo */}
      <Dialog open={lowStockAlertOpen} onOpenChange={setLowStockAlertOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
              </div>
              ⚠️ Alerta de Stock Bajo
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Los siguientes productos están llegando al nivel mínimo de inventario (≤ 2 unidades)
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {lowStockProducts.map((product) => {
                const totalStock = (product.stockCajas * product.unidadesPorCaja) + product.stockUnidadesSueltas;
                return (
                <div
                  key={product._id}
                  className="p-4 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{product.nombre}</h4>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Stock: {totalStock}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p>Código: <span className="font-mono">{product.codigo || 'N/A'}</span></p>
                        <p>Categoría: <span className="font-medium">{product.categoria}</span></p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="bg-blue-50 px-2 py-1 rounded">
                          <span className="text-gray-600">Cajas: </span>
                          <span className="font-semibold">{product.stockCajas}</span>
                        </div>
                        <div className="bg-green-50 px-2 py-1 rounded">
                          <span className="text-gray-600">Sueltas: </span>
                          <span className="font-semibold">{product.stockUnidadesSueltas}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        openUpdateDialog(product);
                        setLowStockAlertOpen(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs whitespace-nowrap"
                    >
                      Reabastecer
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLowStockAlertOpen(false)}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Descartar Alerta
            </Button>
            <Button
              onClick={() => setLowStockAlertOpen(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}