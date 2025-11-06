'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard, User, ScanLine, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency-utils';
import { useCart } from '@/lib/cart-context';
import { QuickClientInput } from '@/components/quick-client-input';

import IProduct from '@/lib/types/product'

export function FloatingCart() {
  const {
    cart,
    cliente,
    descuento,
    metodoPago,
    notas,
    isCartOpen,
    isScanning,
    setCliente,
    setDescuento,
    setMetodoPago,
    setNotas,
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
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleBarcodeScan = async () => {
    if (barcodeInput.trim()) {
      await scanBarcode(barcodeInput.trim());
      setBarcodeInput('');
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
  setSearchResults(products.filter((p: IProduct) => p.activo && p.stock > 0));
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

  const handleAddProductFromSearch = (product: IProduct) => {
    addToCart(product, 'unidad', 1);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-4xl lg:max-w-7xl h-[95vh] md:h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <ShoppingCart className="w-5 h-5" />
            Carrito de Ventas
            {cart.length > 0 && (
              <Badge variant="secondary">{cart.length} productos</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCartOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 md:gap-6 p-4 sm:p-6 relative">
          {/* Panel izquierdo - Búsqueda y productos del carrito */}
          <div className="flex-1 flex flex-col min-w-0 lg:min-h-0 overflow-hidden">
            {/* Sección de búsqueda */}
            <div className="space-y-4 mb-4 md:mb-6 relative z-10">
              {/* Búsqueda por código de barras */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4" />
                  <Label htmlFor="barcode" className="text-sm md:text-base">Escanear Código de Barras</Label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="barcode"
                    placeholder="Ingrese código de barras..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isScanning}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleBarcodeScan}
                    disabled={isScanning || !barcodeInput.trim()}
                    variant="outline"
                    className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300"
                  >
                    {isScanning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Escaneando...
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-4 h-4 mr-2" />
                        Escanear
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Búsqueda por nombre/código */}
              <div className="space-y-2 relative" data-search-container>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <Label htmlFor="search" className="text-sm md:text-base">Buscar Productos</Label>
                </div>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, código o código de barras..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleSearchInputChange(e.target.value);
                    }}
                    className="w-full"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    <div className="p-2">
                      {searchResults.map((product) => (
                        <div
                          key={product._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-lg cursor-pointer border-b last:border-b-0 gap-2 sm:gap-3"
                          onClick={() => handleAddProductFromSearch(product)}
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="font-medium text-sm md:text-base truncate">{product.nombre}</div>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-1 sm:gap-2 text-xs text-gray-500">
                              {product.codigo && (
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  Código: {product.codigo}
                                </span>
                              )}
                              {product.codigoBarras && (
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  C.B: {product.codigoBarras}
                                </span>
                              )}
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                Stock: {product.stock}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 ml-0 sm:ml-2">
                            <div className="font-bold text-sm md:text-base text-green-600">
                              {formatCurrency(product.precio)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-3 bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProductFromSearch(product);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Agregar</span>
                              <span className="sm:hidden">+</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && searchTerm.trim() && !isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                    <div className="p-4 text-center text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron productos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de productos en el carrito */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <h3 className="font-medium text-base md:text-lg mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Productos en el Carrito
              </h3>

              <div className="flex-1 overflow-y-auto border rounded-lg p-3 md:p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 md:py-12">
                    <ShoppingCart className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base md:text-lg font-medium">El carrito está vacío</p>
                    <p className="text-sm mt-2">Use la búsqueda arriba para agregar productos</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.producto} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-medium text-gray-900 truncate text-sm md:text-base">{item.nombreProducto}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600">
                          <span className="font-medium bg-white px-2 py-1 rounded border">
                            {formatCurrency(item.precioUnitario)} c/u
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.tipoVenta === 'empaque' ? `Caja (${item.unidadesPorEmpaque || 1} und)` : 'Unidad'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-end">
                          <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.producto, Math.max(1, item.cantidad - 1))}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>

                            <span className="w-10 text-center font-bold text-sm bg-gray-50 rounded px-2 py-1">
                              {item.cantidad}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.producto, item.cantidad + 1)}
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFromCart(item.producto)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right min-w-[80px] bg-white px-3 py-2 rounded-lg border">
                          <p className="font-bold text-gray-900 text-sm md:text-base">
                            {formatCurrency(item.precioTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho - Información de venta */}
          <div className="w-full lg:w-96 space-y-4 overflow-y-auto lg:max-h-none">
            {/* Información del cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickClientInput
                  currentClient={cliente}
                  onClientSelect={(selectedClient) => {
                    setCliente(selectedClient);
                  }}
                />
              </CardContent>
            </Card>

            {/* Método de pago y descuento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="metodo-pago" className="text-sm">Método de Pago</Label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
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
                  />
                </div>

                <div>
                  <Label htmlFor="notas" className="text-sm">Notas</Label>
                  <textarea
                    id="notas"
                    placeholder="Notas adicionales..."
                    value={notas}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotas(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen de la venta */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Resumen de Venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm md:text-base">Subtotal:</span>
                  <span className="font-medium text-sm md:text-base">{formatCurrency(calculateSubtotal())}</span>
                </div>

                {descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm md:text-base">Descuento ({descuento}%):</span>
                    <span>-{formatCurrency((calculateSubtotal() * descuento) / 100)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 my-3"></div>

                <div className="flex justify-between text-lg md:text-xl font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="space-y-3">
              <Button
                onClick={handleProcessSale}
                disabled={cart.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base md:text-lg font-medium"
              >
                Procesar Venta
              </Button>

              <Button
                onClick={clearCart}
                variant="outline"
                disabled={cart.length === 0}
                className="w-full py-3"
              >
                Limpiar Carrito
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
