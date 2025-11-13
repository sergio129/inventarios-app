'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard, User, ScanLine, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/currency-utils';

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioCompra: number;
  stock: number; // Total de unidades (calculado automáticamente)
  stockCajas: number; // Número de cajas completas
  stockUnidadesSueltas: number; // Unidades sueltas
  categoria: string;
  marca?: string;
  codigo?: string;
  codigoBarras?: string;
  activo: boolean;
  // Nuevos campos para unidades y empaques
  unidadesPorEmpaque?: number;
  tipoVenta: 'unidad' | 'empaque' | 'ambos';
  precioPorUnidad?: number;
  precioPorEmpaque?: number;
  fechaCreacion: string;
}

export function FloatingCart() {
  const {
    cart,
    cliente,
    descuento,
    metodoPago,
    isCartOpen,
    isScanning,
    setCliente,
    setDescuento,
    setMetodoPago,
    setIsCartOpen,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    calculateSubtotal,
    calculateTotal,
    scanBarcode,
    processSale
  } = useCart();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleBarcodeScan = async () => {
    if (barcodeInput.trim()) {
      const barcode = barcodeInput.trim();
      
      // Buscar en productos locales primero
      try {
        const response = await fetch(`/api/products?limit=100`);
        if (response.ok) {
          const products = await response.json();
          
          // Búsqueda exacta por código de barras
          let product = products.find((p: Product) => 
            p.codigoBarras && p.codigoBarras.trim() === barcode
          );
          
          // Si no encuentra exacta, búsqueda parcial
          if (!product) {
            product = products.find((p: Product) => 
              p.codigoBarras && p.codigoBarras.includes(barcode)
            );
          }
          
          // Si no encuentra por barras, busca por código
          if (!product) {
            product = products.find((p: Product) => 
              p.codigo && p.codigo.trim() === barcode
            );
          }
          
          if (product && product.activo && product.stock > 0) {
            addToCart(product, 'unidad');
            setBarcodeInput('');
          } else {
            alert(`Producto con código ${barcode} no encontrado o sin stock`);
          }
        }
      } catch (error) {
        console.error('Error al procesar código de barras:', error);
        alert('Error al procesar código de barras');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeScan();
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(term)}&limit=10`);
      if (response.ok) {
        const products = await response.json();
        setSearchResults(products.filter((p: Product) => p.activo && p.stock > 0));
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.trim()) {
      // Debounce search
      const timeoutId = setTimeout(() => handleSearch(value), 300);
      setSearchTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleAddProductFromSearch = (product: Product, tipoVenta: 'unidad' | 'empaque' = 'unidad') => {
    addToCart(product, tipoVenta);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleProcessSale = async () => {
    await processSale();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Global barcode scanning listener
  useEffect(() => {
    if (!isCartOpen) return;

    let accumulatedBarcode = '';
    let barcodeTimeout: NodeJS.Timeout;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field (except barcode inputs)
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' && 
          !target.id?.includes('barcode') && 
          !target.className?.includes('hidden')) {
        return;
      }

      // Ignore special keys
      if (event.key.length > 1) return;

      // Accumulate characters
      accumulatedBarcode += event.key;

      // Clear previous timeout
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }

      // Set new timeout - if no input for 300ms, process barcode
      barcodeTimeout = setTimeout(async () => {
        if (accumulatedBarcode.trim()) {
          const barcode = accumulatedBarcode.trim();
          
          // Search in products
          try {
            const response = await fetch(`/api/products?limit=100`);
            if (response.ok) {
              const products = await response.json();
              
              // Three-tier search
              let product = products.find((p: Product) => 
                p.codigoBarras && p.codigoBarras.trim() === barcode
              );
              
              if (!product) {
                product = products.find((p: Product) => 
                  p.codigoBarras && p.codigoBarras.includes(barcode)
                );
              }
              
              if (!product) {
                product = products.find((p: Product) => 
                  p.codigo && p.codigo.trim() === barcode
                );
              }
              
              if (product && product.activo && product.stock > 0) {
                addToCart(product, 'unidad');
              }
            }
          } catch (error) {
            console.error('Error al procesar código de barras:', error);
          }
          
          accumulatedBarcode = '';
        }
      }, 300);
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (barcodeTimeout) clearTimeout(barcodeTimeout);
    };
  }, [isCartOpen, addToCart]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-search-container]')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchResults]);

  if (!isCartOpen) {
    return (
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <Button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 md:w-16 md:h-16 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        >
          <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
          {cart.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-bold">
              {cart.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-gradient-to-br from-black/40 via-black/20 to-black/10 z-50 flex items-center justify-center p-1 sm:p-2 md:p-4">
      <Card className="w-full h-full sm:h-[98vh] md:h-[95vh] lg:h-[85vh] max-w-full sm:max-w-lg md:max-w-3xl lg:max-w-5xl overflow-hidden flex flex-col shadow-2xl border-white/10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 border-b px-3 sm:px-4 md:px-5 py-2 sm:py-3">
          <CardTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base md:text-lg">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Carrito de Ventas</span>
            <span className="sm:hidden">Carrito</span>
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-xs sm:text-sm">{cart.length}</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCartOpen(false)}
            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col p-2 sm:p-3 md:p-4 relative">
          {/* Layout móvil: Todo en una columna */}
          <div className="block lg:hidden h-full overflow-y-auto space-y-2 sm:space-y-3">
            {/* Sección de búsqueda compacta para móvil */}
            <div className="space-y-2 bg-gray-50 p-2 sm:p-3 rounded-lg">
              <div className="space-y-2">
                {/* Búsqueda por código de barras */}
                <div className="flex gap-1 sm:gap-2">
                  <Input
                    placeholder="Código de barras..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isScanning}
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                  />
                  <Button
                    onClick={handleBarcodeScan}
                    disabled={isScanning || !barcodeInput.trim()}
                    variant="outline"
                    size="sm"
                    className="px-1 sm:px-2 h-8 sm:h-9"
                  >
                    <ScanLine className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>

                {/* Búsqueda general */}
                <div className="relative" data-search-container>
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleSearchInputChange(e.target.value);
                    }}
                    className="w-full text-xs sm:text-sm h-8 sm:h-9 pr-7 sm:pr-8"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  
                  {/* Resultados de búsqueda móvil */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-40 sm:max-h-48 overflow-y-auto">
                      <div className="p-1">
                        {searchResults.map((product) => (
                          <div
                            key={product._id}
                            className="p-1.5 sm:p-2 hover:bg-gray-50 rounded border-b last:border-b-0"
                          >
                            <div className="flex-1 min-w-0 mb-2">
                              <div className="font-medium text-xs truncate">{product.nombre}</div>
                              <div className="text-xs text-gray-500">
                                {product.tipoVenta === 'ambos' ? (
                                  <>
                                    Unidad: {formatCurrency(product.precioPorUnidad || product.precio)} | 
                                    Empaque ({product.unidadesPorEmpaque || 1}): {formatCurrency(product.precioPorEmpaque || product.precio)}
                                  </>
                                ) : (
                                  formatCurrency(product.precio)
                                )}
                                <br />
                                <span className="text-blue-600">
                                  Stock: {product.stock} unidades ({product.stockCajas} cajas + {product.stockUnidadesSueltas} sueltas)
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {product.tipoVenta === 'unidad' || product.tipoVenta === 'ambos' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs h-6 px-1 flex-1"
                                  onClick={() => handleAddProductFromSearch(product, 'unidad')}
                                >
                                  Unidad
                                </Button>
                              ) : null}
                              {product.tipoVenta === 'empaque' || product.tipoVenta === 'ambos' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs h-6 px-1 flex-1"
                                  onClick={() => handleAddProductFromSearch(product, 'empaque')}
                                >
                                  Empaque
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de productos en carrito - móvil compacta */}
            <div className="border rounded-lg p-2 sm:p-3 flex-1 min-h-0">
              <h3 className="font-medium text-xs sm:text-sm mb-2 flex items-center gap-1 sm:gap-2">
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                Productos ({cart.length})
              </h3>
              
              <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-4 sm:py-6">
                    <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Carrito vacío</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.producto} className="bg-gray-50 rounded p-1.5 sm:p-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs truncate">{item.nombreProducto}</h4>
                          <div className="text-xs text-gray-600">
                            {formatCurrency(item.precioUnitario)} c/u 
                            <span className="text-blue-600 font-medium">({item.tipoVenta})</span>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(item.producto)}
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 ml-1"
                        >
                          <Trash2 className="w-2 h-2 sm:w-3 sm:h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.producto, Math.max(1, item.cantidad - 1))}
                            className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                          >
                            <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center text-xs font-bold">{item.cantidad}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.producto, item.cantidad + 1)}
                            className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                          >
                            <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                          </Button>
                        </div>
                        <div className="font-bold text-xs">{formatCurrency(item.precioTotal)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Información del cliente - móvil más compacta */}
            <div className="border rounded-lg p-2 sm:p-3 space-y-2">
              <h3 className="font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                Cliente
              </h3>
              <div className="space-y-1 sm:space-y-2">
                <Input
                  placeholder="Nombre del cliente"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                  className="text-xs sm:text-sm h-7 sm:h-8"
                />
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <Input
                    placeholder="Cédula"
                    value={cliente.cedula}
                    onChange={(e) => setCliente({ ...cliente, cedula: e.target.value })}
                    className="text-xs sm:text-sm h-7 sm:h-8"
                  />
                  <Input
                    placeholder="Teléfono"
                    value={cliente.telefono}
                    onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                    className="text-xs sm:text-sm h-7 sm:h-8"
                  />
                </div>
              </div>
            </div>

            {/* Método de pago y totales - móvil más compacto */}
            <div className="border rounded-lg p-2 sm:p-3 space-y-2">
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <div>
                  <Label className="text-xs">Método de Pago</Label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger className="text-xs h-7 sm:h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Descuento (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={descuento}
                    onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                    className="text-xs h-7 sm:h-8"
                  />
                </div>
              </div>
              
              {/* Resumen de totales más compacto */}
              <div className="border-t pt-2 space-y-0.5 sm:space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Descuento ({descuento}%):</span>
                    <span>-{formatCurrency((calculateSubtotal() * descuento) / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Botones de acción más compactos */}
              <div className="grid grid-cols-2 gap-1 sm:gap-2 pt-1">
                <Button
                  onClick={clearCart}
                  variant="outline"
                  disabled={cart.length === 0}
                  className="text-xs h-7 sm:h-8"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={handleProcessSale}
                  disabled={cart.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 sm:h-8"
                >
                  Procesar
                </Button>
              </div>
            </div>
          </div>

          {/* Layout desktop: Dos columnas optimizadas (solo visible en lg+) */}
          <div className="hidden lg:flex lg:flex-row gap-4 h-full">
            {/* Panel izquierdo - Búsqueda y productos (más compacto) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden max-w-lg">
              {/* Sección de búsqueda más compacta */}
              <div className="space-y-3 mb-4 relative z-10">
                {/* Búsqueda por código de barras */}
                <div className="space-y-1">
                  <Label htmlFor="barcode-desktop" className="text-sm font-medium flex items-center gap-1">
                    <ScanLine className="w-3 h-3" />
                    Código de Barras
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode-desktop"
                      placeholder="Escanear código..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isScanning}
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={handleBarcodeScan}
                      disabled={isScanning || !barcodeInput.trim()}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      {isScanning ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      ) : (
                        <ScanLine className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Búsqueda por nombre/código */}
                <div className="space-y-1 relative" data-search-container>
                  <Label htmlFor="search-desktop" className="text-sm font-medium flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Buscar Productos
                  </Label>
                  <div className="relative">
                    <Input
                      id="search-desktop"
                      placeholder="Nombre, código o código de barras..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleSearchInputChange(e.target.value);
                      }}
                      className="w-full text-sm"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Resultados de búsqueda más compactos */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <div className="p-1">
                        {searchResults.map((product) => (
                          <div
                            key={product._id}
                            className="p-2 hover:bg-gray-50 rounded border-b last:border-b-0"
                          >
                            <div className="flex-1 min-w-0 space-y-0.5 mb-2">
                              <div className="font-medium text-sm truncate">{product.nombre}</div>
                              <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                                {product.codigo && (
                                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                    {product.codigo}
                                  </span>
                                )}
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                                  Stock: {product.stock} unidades ({product.stockCajas} cajas + {product.stockUnidadesSueltas} sueltas)
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {product.tipoVenta === 'ambos' ? (
                                  <>
                                    Unidad: {formatCurrency(product.precioPorUnidad || product.precio)} | 
                                    Empaque ({product.unidadesPorEmpaque || 1}): {formatCurrency(product.precioPorEmpaque || product.precio)}
                                  </>
                                ) : (
                                  `Precio: ${formatCurrency(product.precio)}`
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {product.tipoVenta === 'unidad' || product.tipoVenta === 'ambos' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddProductFromSearch(product, 'unidad');
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Unidad
                                </Button>
                              ) : null}
                              {product.tipoVenta === 'empaque' || product.tipoVenta === 'ambos' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddProductFromSearch(product, 'empaque');
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Empaque
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showSearchResults && searchResults.length === 0 && searchTerm.trim() && !isSearching && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                      <div className="p-3 text-center text-gray-500">
                        <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <p className="text-sm">No se encontraron productos</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de productos en el carrito más compacta */}
              <div className="flex-1 border rounded-lg p-3 overflow-y-auto">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Carrito ({cart.length})
                </h3>
                
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">El carrito está vacío</p>
                    <p className="text-xs text-gray-400">Busque productos para agregar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.producto} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.nombreProducto}</h4>
                            <div className="text-xs text-gray-600">
                              {formatCurrency(item.precioUnitario)} c/u 
                              <span className="text-blue-600 font-medium">({item.tipoVenta})</span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFromCart(item.producto)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.producto, Math.max(1, item.cantidad - 1))}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-bold text-sm min-w-[2ch] text-center">{item.cantidad}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.producto, item.cantidad + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{formatCurrency(item.precioTotal)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel derecho - Información del cliente y facturación (más compacto) */}
            <div className="w-72 flex flex-col gap-3">
              {/* Información del cliente */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="cliente-nombre" className="text-sm">Nombre</Label>
                    <Input
                      id="cliente-nombre"
                      placeholder="Nombre del cliente"
                      value={cliente.nombre}
                      onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cliente-cedula" className="text-sm">Cédula</Label>
                      <Input
                        id="cliente-cedula"
                        placeholder="Cédula"
                        value={cliente.cedula}
                        onChange={(e) => setCliente({ ...cliente, cedula: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cliente-telefono" className="text-sm">Teléfono</Label>
                      <Input
                        id="cliente-telefono"
                        placeholder="Teléfono"
                        value={cliente.telefono}
                        onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Método de pago y descuentos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="metodo-pago" className="text-sm">Método</Label>
                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                      <SelectTrigger id="metodo-pago" className="text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="descuento" className="text-sm">Descuento (%)</Label>
                    <Input
                      id="descuento"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={descuento}
                      onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Resumen de la venta */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento ({descuento}%):</span>
                      <span className="font-medium">-{formatCurrency((calculateSubtotal() * descuento) / 100)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-base font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="space-y-2 pt-3">
                    <Button
                      onClick={handleProcessSale}
                      disabled={cart.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Procesar Venta
                    </Button>
                    <Button
                      onClick={clearCart}
                      variant="outline"
                      disabled={cart.length === 0}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
