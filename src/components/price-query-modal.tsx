'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Package, Barcode, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency-utils';
import { toast } from 'sonner';
import IProduct from '@/lib/types/product';

interface PriceQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PriceQueryModal({ isOpen, onClose }: PriceQueryModalProps) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Estados para el flujo de dos modales
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const [showSearchModal, setShowSearchModal] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  useEffect(() => {
    setIsModalOpen(isOpen);
    if (isOpen) {
      setShowSearchModal(true);
      setSelectedProduct(null);
      setSearchTerm('');
      setBarcodeInput('');
    }
  }, [isOpen]);

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (isModalOpen) {
      fetchProducts();
    }
  }, [isModalOpen]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const activeProducts = data.filter((p: IProduct) => p.activo);
        setProducts(activeProducts);
        setFilteredProducts(activeProducts);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
    }
  };

  const filterProducts = useCallback(() => {
    if (!searchTerm && !barcodeInput) {
      setFilteredProducts(products);
      return;
    }

    const searchLower = (searchTerm + barcodeInput).toLowerCase();
    const filtered = products.filter(product =>
      product.nombre.toLowerCase().includes(searchLower) ||
      (product.codigo && product.codigo.toLowerCase().includes(searchLower)) ||
      (product.codigoBarras && product.codigoBarras.includes(searchLower))
    );

    setFilteredProducts(filtered);
  }, [products, searchTerm, barcodeInput]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, barcodeInput, filterProducts]);

  // Manejo de escaneo de código de barras
  useEffect(() => {
    if (!isModalOpen || !showSearchModal) return;

    let accumulatedBarcode = '';
    let timeoutId: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen || !showSearchModal) {
        return;
      }

      const target = e.target as HTMLElement;

      // Si está escribiendo en el input de búsqueda normal, no procesar como barcode
      if (target.id === 'search-input') {
        return;
      }

      // Enter: procesar el código escanedo
      if (e.key === 'Enter') {
        e.preventDefault();
        if (accumulatedBarcode.trim()) {
          const barcode = accumulatedBarcode.trim();
          setBarcodeInput(barcode);

          // Buscar el producto con este código de barras
          const foundProduct = products.find(
            (p) => p.codigoBarras && p.codigoBarras.includes(barcode)
          );

          if (foundProduct) {
            setSelectedProduct(foundProduct);
            setShowSearchModal(false);
          } else {
            toast.error('Producto no encontrado');
            accumulatedBarcode = '';
          }
        }
        return;
      }

      // Acumular caracteres para el código de barras
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        accumulatedBarcode += e.key;

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
          accumulatedBarcode = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [isModalOpen, showSearchModal, products]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleProductSelect = (product: IProduct) => {
    setSelectedProduct(product);
    setShowSearchModal(false);
  };

  const handleSearchAnotherProduct = () => {
    setShowSearchModal(true);
    setSelectedProduct(null);
    setSearchTerm('');
    setBarcodeInput('');
  };

  const handleClose = () => {
    setShowSearchModal(true);
    setSelectedProduct(null);
    setSearchTerm('');
    setBarcodeInput('');
    onClose();
  };

  if (!isModalOpen) return null;

  // Modal de búsqueda
  if (showSearchModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <CardTitle>Buscar Producto</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
            {/* Barra de búsqueda */}
            <div className="flex flex-col gap-3">
              <div>
                <Label htmlFor="search-input" className="text-sm font-medium mb-2 block">
                  Buscar por nombre, código o escanea código de barras
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search-input"
                    type="text"
                    placeholder="Ingresa nombre, código o escanea código de barras..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Tabla de productos */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[40%]">Producto</TableHead>
                    <TableHead className="w-[15%]">Código</TableHead>
                    <TableHead className="w-[15%]">Código Barras</TableHead>
                    <TableHead className="w-[15%] text-right">Precio</TableHead>
                    <TableHead className="w-[15%] text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{product.nombre}</p>
                            {product.descripcion && (
                              <p className="text-xs text-gray-500">{product.descripcion}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.codigo ? (
                            <Badge variant="outline">{product.codigo}</Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.codigoBarras ? (
                            <Badge variant="secondary">{product.codigoBarras}</Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(product.precio)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProductSelect(product)}
                            className="text-xs"
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        {searchTerm || barcodeInput
                          ? 'No se encontraron productos'
                          : 'Ingresa un término de búsqueda o escanea un código de barras'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Resultado de búsqueda */}
            <div className="text-sm text-gray-600 border-t pt-4">
              Mostrando <span className="font-semibold">{filteredProducts.length}</span> de{' '}
              <span className="font-semibold">{products.length}</span> productos
            </div>
          </CardContent>

          <div className="border-t p-4 flex justify-end">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cerrar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Modal de detalles del producto
  if (selectedProduct) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <CardTitle>Detalles del Producto</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="py-6 space-y-6">
            {/* Nombre del producto */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.nombre}</h2>
              {selectedProduct.descripcion && (
                <p className="text-gray-600 mt-2">{selectedProduct.descripcion}</p>
              )}
            </div>

            {/* Grid de información */}
            <div className="grid grid-cols-2 gap-6">
              {/* Códigos */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase">Código</Label>
                  <div className="mt-1">
                    {selectedProduct.codigo ? (
                      <Badge className="text-sm">{selectedProduct.codigo}</Badge>
                    ) : (
                      <span className="text-gray-400">Sin código</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase">Código de Barras</Label>
                  <div className="mt-1">
                    {selectedProduct.codigoBarras ? (
                      <Badge variant="secondary" className="text-sm">{selectedProduct.codigoBarras}</Badge>
                    ) : (
                      <span className="text-gray-400">Sin código de barras</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Precios y Stock */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase">Precio de Venta</Label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatCurrency(selectedProduct.precio)}
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase">Stock Disponible</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-sm">
                      {selectedProduct.stock} {selectedProduct.stock === 1 ? 'unidad' : 'unidades'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-2 gap-6 border-t pt-6">
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase">Categoría</Label>
                <p className="mt-1">{selectedProduct.categoria || 'Sin categoría'}</p>
              </div>

              {selectedProduct.marca && (
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase">Marca</Label>
                  <p className="mt-1">{selectedProduct.marca}</p>
                </div>
              )}
            </div>
          </CardContent>

          <div className="border-t p-4 flex gap-3 justify-end">
            <Button
              onClick={handleSearchAnotherProduct}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
              Buscar otro producto
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-auto"
            >
              Cerrar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
