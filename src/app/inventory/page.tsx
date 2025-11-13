'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Search, ArrowLeft, AlertTriangle, CheckCircle, Tag, Pill, Edit, Trash2, Check, ChevronsUpDown, ShoppingCart, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart-context';
import { FloatingCart } from '@/components/floating-cart-new';
import ImportExportManager from '@/components/import-export-manager';

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
  stock: number; // Total calculated stock
  stockMinimo: number;
  categoria: string;
  marca?: string;
  codigo?: string;
  codigoBarras?: string;
  activo: boolean;
  tipoVenta: 'unidad' | 'empaque' | 'ambos';
  margenGananciaUnidad?: number;
  margenGananciaCaja?: number;
  fechaCreacion: string;
}

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availableCategories, setAvailableCategories] = useState<{ _id: string; nombre: string; activo: boolean }[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isCategoryComboboxOpen, setIsCategoryComboboxOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precioCaja: '',
    precioCompra: '',
    precioCompraCaja: '',
    margenGananciaUnidad: '',
    margenGananciaCaja: '',
    stockCajas: '',
    unidadesPorCaja: '',
    stockUnidadesSueltas: '',
    stockMinimo: '',
    categoria: '',
    marca: '',
    codigo: '',
    codigoBarras: ''
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    fetchProducts();
    fetchCategories();
  }, [session, status]);

  // Cerrar combobox de categoría al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[role="combobox"]') && !target.closest('.absolute')) {
        setIsCategoryComboboxOpen(false);
        setCategorySearchTerm('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryComboboxOpen(false);
        setCategorySearchTerm('');
      }
    };

    if (isCategoryComboboxOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCategoryComboboxOpen]);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.filter((cat: any) => cat.activo));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const normalizeText = useCallback((text: string): string => {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize spaces
  }, []);

  const categoryOptions = useMemo(() => availableCategories.map(cat => cat.nombre), [availableCategories]);

  const calculatePriceFromMargin = (costPrice: number, margin: number) => {
    return costPrice * (1 + margin / 100);
  };

  const calculateMarginFromPrice = (costPrice: number, sellingPrice: number) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  };

  const updatePriceFromMargin = (type: 'unidad' | 'caja') => {
    const margin = parseFloat(type === 'unidad' ? createForm.margenGananciaUnidad : createForm.margenGananciaCaja) || 0;
    const costPrice = parseFloat(type === 'unidad' ? createForm.precioCompra : createForm.precioCompraCaja) || 0;

    if (costPrice > 0) {
      const newPrice = calculatePriceFromMargin(costPrice, margin);
      if (type === 'unidad') {
        setCreateForm({ ...createForm, precio: newPrice.toFixed(2) });
      } else {
        setCreateForm({ ...createForm, precioCaja: newPrice.toFixed(2) });
      }
    }
  };

  const updateMarginFromPrice = (type: 'unidad' | 'caja') => {
    const sellingPrice = parseFloat(type === 'unidad' ? createForm.precio : createForm.precioCaja) || 0;
    const costPrice = parseFloat(type === 'unidad' ? createForm.precioCompra : createForm.precioCompraCaja) || 0;

    if (costPrice > 0) {
      const newMargin = calculateMarginFromPrice(costPrice, sellingPrice);
      if (type === 'unidad') {
        setCreateForm({ ...createForm, margenGananciaUnidad: newMargin.toFixed(2) });
      } else {
        setCreateForm({ ...createForm, margenGananciaCaja: newMargin.toFixed(2) });
      }
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Primero filtrar por categoría (si no es "all")
    if (categoryFilter !== 'all') {
      const normalizedFilter = normalizeText(categoryFilter);
      filtered = filtered.filter(product => {
        const productCategory = product.categoria || '';
        const normalizedProductCategory = normalizeText(productCategory);
        return normalizedProductCategory === normalizedFilter;
      });
    }

    // Luego filtrar por búsqueda dentro de la categoría seleccionada
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.marca && product.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.codigo && product.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.codigoBarras && product.codigoBarras.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, normalizeText]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, filterProducts]);

  const createProduct = async () => {
    // Validación del lado del cliente
    if (!createForm.nombre.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }
    if (!createForm.precioCompra.trim()) {
      toast.error('El precio de compra por unidad es requerido');
      return;
    }
    if (!createForm.precio.trim()) {
      toast.error('El precio de venta por unidad es requerido');
      return;
    }
    if (!createForm.stockCajas.trim()) {
      toast.error('La cantidad de cajas es requerida');
      return;
    }
    if (!createForm.unidadesPorCaja.trim()) {
      toast.error('Las unidades por caja son requeridas');
      return;
    }
    if (!createForm.stockMinimo.trim()) {
      toast.error('El stock mínimo es requerido');
      return;
    }
    if (!createForm.categoria.trim()) {
      toast.error('La categoría es requerida');
      return;
    }
    if (!createForm.codigo.trim()) {
      toast.error('El código interno es requerido');
      return;
    }

    try {
      const stockCajas = parseInt(createForm.stockCajas) || 0;
      const unidadesPorCaja = parseInt(createForm.unidadesPorCaja) || 1;
      const stockUnidadesSueltas = parseInt(createForm.stockUnidadesSueltas) || 0;
      const stockTotal = (stockCajas * unidadesPorCaja) + stockUnidadesSueltas;

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: createForm.nombre,
          descripcion: createForm.descripcion,
          precio: parseFloat(createForm.precio),
          precioCaja: parseFloat(createForm.precioCaja) || 0,
          precioCompra: parseFloat(createForm.precioCompra),
          precioCompraCaja: parseFloat(createForm.precioCompraCaja) || 0,
          stock: stockTotal,
          stockCajas: stockCajas,
          unidadesPorCaja: unidadesPorCaja,
          stockUnidadesSueltas: stockUnidadesSueltas,
          stockMinimo: parseInt(createForm.stockMinimo),
          categoria: createForm.categoria,
          marca: createForm.marca ? createForm.marca.trim() : null,
          codigo: createForm.codigo,
          codigoBarras: createForm.codigoBarras,
          margenGananciaUnidad: createForm.margenGananciaUnidad ? parseFloat(createForm.margenGananciaUnidad) : null,
          margenGananciaCaja: createForm.margenGananciaCaja ? parseFloat(createForm.margenGananciaCaja) : null
        }),
      });

      if (response.ok) {
        toast.success('Producto creado exitosamente');
        setIsProductDialogOpen(false);
        setCreateForm({
          nombre: '',
          descripcion: '',
          precio: '',
          precioCaja: '',
          precioCompra: '',
          precioCompraCaja: '',
          margenGananciaUnidad: '',
          margenGananciaCaja: '',
          stockCajas: '',
          unidadesPorCaja: '',
          stockUnidadesSueltas: '',
          stockMinimo: '',
          categoria: '',
          marca: '',
          codigo: '',
          codigoBarras: ''
        });
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear producto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error de conexión');
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setCreateForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio?.toString() || '0',
      precioCaja: product.precioCaja?.toString() || '',
      precioCompra: product.precioCompra?.toString() || '0',
      precioCompraCaja: product.precioCompraCaja?.toString() || '',
      margenGananciaUnidad: product.precio && product.precioCompra ? (((product.precio - product.precioCompra) / product.precioCompra) * 100).toFixed(2) : '0',
      margenGananciaCaja: product.precioCaja && product.precioCompraCaja ? (((product.precioCaja - product.precioCompraCaja) / product.precioCompraCaja) * 100).toFixed(2) : '0',
      stockCajas: (product.stockCajas ?? 0).toString(),
      unidadesPorCaja: (product.unidadesPorCaja ?? 1).toString(),
      stockUnidadesSueltas: (product.stockUnidadesSueltas ?? 0).toString(),
      stockMinimo: product.stockMinimo?.toString() || '0',
      categoria: product.categoria,
      marca: product.marca || '',
      codigo: product.codigo || '',
      codigoBarras: product.codigoBarras || ''
    });
    setIsProductDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    resetCreateForm();
    setIsProductDialogOpen(true);
  };

  const resetCreateForm = () => {
    setCreateForm({
      nombre: '',
      descripcion: '',
      precio: '',
      precioCaja: '',
      precioCompra: '',
      precioCompraCaja: '',
      margenGananciaUnidad: '',
      margenGananciaCaja: '',
      stockCajas: '',
      unidadesPorCaja: '',
      stockUnidadesSueltas: '',
      stockMinimo: '',
      categoria: '',
      marca: '',
      codigo: '',
      codigoBarras: ''
    });
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Producto sin stock disponible');
      return;
    }

    // Por defecto agregar como unidad
    addToCart(product, 'unidad');
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    try {
      const stockCajas = parseInt(createForm.stockCajas) || 0;
      const unidadesPorCaja = parseInt(createForm.unidadesPorCaja) || 1;
      const stockUnidadesSueltas = parseInt(createForm.stockUnidadesSueltas) || 0;
      const stockTotal = (stockCajas * unidadesPorCaja) + stockUnidadesSueltas;

      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          precio: parseFloat(createForm.precio),
          precioCaja: parseFloat(createForm.precioCaja) || 0,
          precioCompra: parseFloat(createForm.precioCompra),
          precioCompraCaja: parseFloat(createForm.precioCompraCaja) || 0,
          stock: stockTotal,
          stockCajas: stockCajas,
          unidadesPorCaja: unidadesPorCaja,
          stockUnidadesSueltas: stockUnidadesSueltas,
          stockMinimo: parseInt(createForm.stockMinimo)
        }),
      });

      if (response.ok) {
        toast.success('Producto actualizado exitosamente');
        setIsProductDialogOpen(false);
        setEditingProduct(null);
        resetCreateForm();
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error de conexión');
    }
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Producto eliminado exitosamente');
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error de conexión');
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock <= product.stockMinimo) {
      return { status: 'low', color: 'destructive' as const, icon: AlertTriangle };
    }
    if (product.stock <= product.stockMinimo * 1.5) {
      return { status: 'warning', color: 'secondary' as const, icon: AlertTriangle };
    }
    return { status: 'good', color: 'default' as const, icon: CheckCircle };
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
      <FloatingCart />
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
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Inventario
                  </h1>
                  <p className="text-gray-600 text-lg">Gestión inteligente de productos</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="h-3 md:h-4 w-3 md:w-4" />
                <span className="hidden md:inline">Dashboard</span>
                <span className="md:hidden">Dashboard</span>
              </Button>
              {(session?.user as { role?: string })?.role === 'admin' && (
                <Button
                  onClick={() => router.push('/inventory/categories')}
                  variant="outline"
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 border-purple-300 text-purple-700 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 shadow-sm"
                >
                  <Tag className="h-3 md:h-4 w-3 md:w-4" />
                  <span>Categorías</span>
                </Button>
              )}
              {(session?.user as { role?: string })?.role === 'admin' && (
                <Button
                  onClick={() => router.push('/inventory/management')}
                  variant="outline"
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 border-green-300 text-green-700 hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm whitespace-nowrap"
                >
                  <TrendingUp className="h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Gestión</span>
                </Button>
              )}
              <ImportExportManager 
                onImportSuccess={fetchProducts}
                isAdmin={(session?.user as any)?.role === 'admin'}
              />
              {(session?.user as { role?: string })?.role === 'admin' && (
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={openCreateDialog}
                      className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <Plus className="h-3 md:h-4 w-3 md:w-4" />
                      <span>Nuevo Producto</span>
                    </Button>
                  </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
                <DialogHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 mb-6 p-6 rounded-t-lg">
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      {editingProduct ? <Edit className="h-6 w-6 text-white" /> : <Package className="h-6 w-6 text-white" />}
                    </div>
                    {editingProduct ? `Editar Producto - ${editingProduct.nombre}` : 'Crear Nuevo Producto'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 text-base">
                    {editingProduct ? 'Modifique la información del producto según sea necesario' : 'Complete la información del producto para agregarlo al inventario'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 py-2">
                  {/* Sección de Identificación */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Tag className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Identificación del Producto</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="codigo" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Código Interno <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="codigo"
                          value={createForm.codigo}
                          onChange={(e) => setCreateForm({ ...createForm, codigo: e.target.value })}
                          placeholder="Ej: PROD-001"
                          className="font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codigoBarras" className="text-sm font-medium text-gray-700">
                          Código de Barras
                        </Label>
                        <Input
                          id="codigoBarras"
                          value={createForm.codigoBarras}
                          onChange={(e) => setCreateForm({ ...createForm, codigoBarras: e.target.value })}
                          placeholder="Escanee o ingrese el código"
                          className="font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Información Básica */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Pill className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Nombre del Producto <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nombre"
                          value={createForm.nombre}
                          onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                          placeholder="Ingrese el nombre completo del producto"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
                          Descripción
                        </Label>
                        <Input
                          id="descripcion"
                          value={createForm.descripcion}
                          onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                          placeholder="Descripción detallada del producto"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Control de Inventario */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Package className="h-5 w-5 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Control de Inventario</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stockCajas" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Cajas Completas <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="stockCajas"
                          type="number"
                          value={createForm.stockCajas}
                          onChange={(e) => setCreateForm({ ...createForm, stockCajas: e.target.value })}
                          placeholder="0"
                          className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unidadesPorCaja" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Unidades por Caja <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="unidadesPorCaja"
                          type="number"
                          value={createForm.unidadesPorCaja}
                          onChange={(e) => setCreateForm({ ...createForm, unidadesPorCaja: e.target.value })}
                          placeholder="1"
                          className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stockUnidadesSueltas" className="text-sm font-medium text-gray-700">
                          Unidades Sueltas
                        </Label>
                        <Input
                          id="stockUnidadesSueltas"
                          type="number"
                          value={createForm.stockUnidadesSueltas}
                          onChange={(e) => setCreateForm({ ...createForm, stockUnidadesSueltas: e.target.value })}
                          placeholder="0"
                          className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800 font-medium">
                        <strong>Total estimado:</strong> {((parseInt(createForm.stockCajas) || 0) * (parseInt(createForm.unidadesPorCaja) || 1)) + (parseInt(createForm.stockUnidadesSueltas) || 0)} unidades
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="stockMinimo" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        Stock Mínimo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="stockMinimo"
                        type="text"
                        value={createForm.stockMinimo}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) { // Solo números
                            setCreateForm({ ...createForm, stockMinimo: value });
                          }
                        }}
                        placeholder="0"
                        className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Sección de Precios y Ganancias */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Precios y Márgenes de Ganancia</h3>
                    </div>

                    {/* Precios de Compra */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Precios de Compra
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="precioCompraCaja" className="text-sm font-medium text-gray-700">
                            Por Caja Completa
                          </Label>
                          <Input
                            id="precioCompraCaja"
                            type="text"
                            value={createForm.precioCompraCaja}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) { // Solo números y punto decimal
                                setCreateForm({ ...createForm, precioCompraCaja: value });
                              }
                            }}
                            placeholder="0.00"
                            className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="precioCompra" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Por Unidad <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="precioCompra"
                            type="text"
                            value={createForm.precioCompra}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) { // Solo números y punto decimal
                                setCreateForm({ ...createForm, precioCompra: value });
                              }
                            }}
                            placeholder="0.00"
                            className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Márgenes de Ganancia */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Porcentaje de Ganancia (%)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="margenGananciaCaja" className="text-sm font-medium text-gray-700">
                            Para Cajas Completas
                          </Label>
                          <Input
                            id="margenGananciaCaja"
                            type="text"
                            value={createForm.margenGananciaCaja}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) {
                                setCreateForm({ ...createForm, margenGananciaCaja: value });
                              }
                            }}
                            onBlur={() => updatePriceFromMargin('caja')}
                            placeholder="0.00"
                            className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="margenGananciaUnidad" className="text-sm font-medium text-gray-700">
                            Para Unidades
                          </Label>
                          <Input
                            id="margenGananciaUnidad"
                            type="text"
                            value={createForm.margenGananciaUnidad}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) {
                                setCreateForm({ ...createForm, margenGananciaUnidad: value });
                              }
                            }}
                            onBlur={() => updatePriceFromMargin('unidad')}
                            placeholder="0.00"
                            className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Precios de Venta */}
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Precios de Venta
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="precioCaja" className="text-sm font-medium text-gray-700">
                            Por Caja Completa
                          </Label>
                          <Input
                            id="precioCaja"
                            type="text"
                            value={createForm.precioCaja}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) { // Solo números y punto decimal
                                setCreateForm({ ...createForm, precioCaja: value });
                                updateMarginFromPrice('caja');
                              }
                            }}
                            placeholder="0.00"
                            className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="precio" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Por Unidad <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="precio"
                            type="text"
                            value={createForm.precio}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) { // Solo números y punto decimal
                                setCreateForm({ ...createForm, precio: value });
                                updateMarginFromPrice('unidad');
                              }
                            }}
                            placeholder="0.00"
                            className="text-right border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Clasificación */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Tag className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Clasificación</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="categoria" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Categoría <span className="text-red-500">*</span>
                          </Label>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => router.push('/inventory/categories')}
                            className="text-blue-600 hover:text-blue-800 p-0 h-auto text-xs"
                          >
                            Gestionar
                          </Button>
                        </div>
                        <div className="relative">
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={isCategoryComboboxOpen}
                            className="w-full justify-between border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            onClick={() => setIsCategoryComboboxOpen(!isCategoryComboboxOpen)}
                          >
                            {createForm.categoria
                              ? availableCategories.find(cat => cat.nombre === createForm.categoria)?.nombre
                              : "Selecciona una categoría"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                          {isCategoryComboboxOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                              <div className="p-2">
                                <Input
                                  placeholder="Buscar categoría..."
                                  value={categorySearchTerm}
                                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {availableCategories
                                  .filter(category =>
                                    category.nombre.toLowerCase().includes(categorySearchTerm.toLowerCase())
                                  )
                                  .map((category) => (
                                    <div
                                      key={category._id}
                                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => {
                                        setCreateForm({ ...createForm, categoria: category.nombre });
                                        setCategorySearchTerm('');
                                        setIsCategoryComboboxOpen(false);
                                      }}
                                    >
                                      {createForm.categoria === category.nombre && (
                                        <Check className="mr-2 h-4 w-4" />
                                      )}
                                      <span className="flex-1">{category.nombre}</span>
                                    </div>
                                  ))}
                                {availableCategories.filter(category =>
                                  category.nombre.toLowerCase().includes(categorySearchTerm.toLowerCase())
                                ).length === 0 && (
                                  <div className="px-3 py-2 text-gray-500 text-sm">
                                    No se encontraron categorías
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marca" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Marca del producto
                        </Label>
                        <Input
                          id="marca"
                          value={createForm.marca}
                          onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
                          placeholder="Nombre de la marca o fabricante"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Configuración */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Configuración Adicional</h3>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t border-gray-200 pt-6 bg-gray-50 -m-6 mt-6 p-6 rounded-b-lg">
                  <div className="flex justify-between w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetCreateForm();
                        setIsProductDialogOpen(false);
                      }}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      onClick={editingProduct ? updateProduct : createProduct}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {editingProduct ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
              )}
          </div>
        </div>

        {/* Modern Filters Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtros y Búsqueda</h3>
                <p className="text-sm text-gray-600">Encuentra rápidamente tus productos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Buscar por nombre, código, descripción o marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">Todas las categorías</SelectItem>
                    {categoryOptions.map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName} className="rounded-lg">
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Products Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl shadow-blue-500/10">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Productos ({filteredProducts.length})</CardTitle>
                <CardDescription className="text-gray-600">
                  Lista completa de productos en inventario con información detallada
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/30 hover:from-gray-50 hover:to-blue-50/50 transition-all duration-200">
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm">Producto</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm hidden lg:table-cell">Marca</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm hidden md:table-cell">Código</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm hidden lg:table-cell">Código de Barras</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm hidden sm:table-cell">Precio</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-3 md:px-6 text-xs md:text-sm hidden sm:table-cell">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-2 md:px-6 text-xs md:text-sm">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => {
                    const stockStatus = getStockStatus(product);
                    const StatusIcon = stockStatus.icon;

                    return (
                      <TableRow
                        key={product._id}
                        className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 group text-xs md:text-sm"
                      >
                        <TableCell className="py-3 md:py-4 px-3 md:px-6">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                              {product.nombre}
                            </div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {product.descripcion}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4 px-3 md:px-6 hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 font-medium shadow-sm text-xs"
                          >
                            {product.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 md:py-4 px-3 md:px-6 hidden lg:table-cell">
                          <span className="text-gray-700 font-medium text-xs md:text-sm">{product.marca || '-'}</span>
                        </TableCell>
                        <TableCell className="py-3 md:py-4 px-3 md:px-6 hidden md:table-cell">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                            {product.codigo || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 md:py-4 px-3 md:px-6 hidden lg:table-cell">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                            {product.codigoBarras || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 md:py-4 px-3 md:px-6">
                          <div className="flex items-center gap-2">
                            <div className="text-xs md:text-sm">
                              <div className={`font-bold text-lg ${
                                product.stock <= product.stockMinimo ? 'text-red-600' :
                                product.stock <= product.stockMinimo * 1.5 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {product.stock}
                              </div>
                              <div className="text-xs text-gray-500 hidden md:block">
                                {product.stockCajas}c × {product.unidadesPorCaja} + {product.stockUnidadesSueltas}s
                              </div>
                            </div>
                            {product.stock <= product.stockMinimo && (
                              <StatusIcon className="h-4 md:h-5 w-4 md:w-5 text-red-500 animate-pulse" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4 px-3 md:px-6 hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900 text-sm md:text-lg">
                              ${product.precio.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 hidden md:block">
                              C: ${product.precioCompra.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4 px-3 md:px-6 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={stockStatus.color as "default" | "secondary" | "destructive" | "outline"}
                              className={`font-medium shadow-sm text-xs ${
                                stockStatus.color === 'default' ? 'bg-green-100 text-green-800 border-green-200' :
                                stockStatus.color === 'destructive' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              {product.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-2 md:px-6">
                          <div className="flex flex-col gap-1 md:flex-row md:gap-2">
                            <Button
                              onClick={() => handleAddToCart(product)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap"
                              disabled={product.stock <= 0}
                            >
                              <ShoppingCart className="h-3 md:h-4 w-3 md:w-4" />
                              <span className="hidden md:inline">Agregar</span>
                              <span className="md:hidden">+</span>
                            </Button>
                            {(session?.user as { role?: string })?.role === 'admin' && (
                              <>
                                <Button
                                  onClick={() => openEditDialog(product)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1 border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap"
                                >
                                  <Edit className="h-3 md:h-4 w-3 md:w-4" />
                                  <span className="hidden md:inline">Editar</span>
                                  <span className="md:hidden">✎</span>
                                </Button>
                                <Button
                                  onClick={() => openDeleteDialog(product)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1 border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 transition-all duration-200 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap"
                                >
                                  <Trash2 className="h-3 md:h-4 w-3 md:w-4" />
                                  <span className="hidden md:inline">Eliminar</span>
                                  <span className="md:hidden">✕</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Eliminar Producto
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar el producto <strong>&quot;{productToDelete?.nombre}&quot;</strong>?
              <br />
              <span className="text-red-600 font-medium">
                Esta acción no se puede deshacer.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}