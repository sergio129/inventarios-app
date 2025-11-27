'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, Search, AlertCircle, CheckCircle, Clock, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency-utils';

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
    tipoVenta?: 'unidad' | 'empaque';
    precioUnitario: number;
    precioTotal: number;
  }>;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  estado: 'pendiente' | 'completada' | 'cancelada' | 'devuelta';
  vendedor?: {
    name: string;
    email: string;
  };
  notas?: string;
  fechaVenta: Date;
  fechaCreacion: Date;
  tieneDevoluciones?: boolean;
  cantidadDevoluciones?: number;
}

interface Return {
  _id: string;
  numeroFactura: string;
  venta: string;
  ventaId?: string;
  cliente?: {
    nombre: string;
    cedula?: string;
  };
  productosDevueltos: Array<{
    nombreProducto: string;
    cantidad?: number;
    cantidadDevuelta?: number;
    tipoVenta?: 'unidad' | 'empaque';
    precioUnitario?: number;
    precioTotal?: number;
    razon?: string;
    motivo?: string;
  }>;
  montoDevuelto?: number;
  montoReembolso?: number;
  subtotal?: number;
  total?: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'procesada';
  razonDevolucion: string;
  notas?: string;
  fechaCreacion: Date;
}

interface ReturnComponentProps {
  salesData?: Sale[];
}

export function ReturnsComponent({ salesData = [] }: ReturnComponentProps) {
  // Mantener todas las ventas, se desabilitarán visualmente las que tengan devoluciones
  const [sales, setSales] = useState<Sale[]>(salesData);
  const [returns, setReturns] = useState<Return[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnData, setReturnData] = useState({
    selectedItems: [] as string[],
    razonDevolucion: '',
    notas: '',
  });
  
  // Estados para el modal de factura
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceSale, setInvoiceSale] = useState<Sale | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    if (salesData.length === 0) {
      fetchSales();
    }
    fetchReturns();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  // Actualizar sales cuando cambien las props salesData
  useEffect(() => {
    if (salesData.length > 0) {
      setSales(salesData);
    }
  }, [salesData]);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales?checkReturns=true');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/returns');
      if (response.ok) {
        const data = await response.json();
        // El API devuelve directamente el array de devoluciones
        setReturns(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
    }
  };

  const fetchSaleDetails = async (ventaId: string) => {
    setLoadingInvoice(true);
    try {
      const response = await fetch(`/api/sales/${ventaId}`);
      if (response.ok) {
        const sale = await response.json();
        setInvoiceSale(sale);
        setShowInvoiceModal(true);
      } else {
        toast.error('No se pudo cargar la información de la factura');
      }
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast.error('Error al cargar la factura');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    // NO excluir ventas devueltas - solo las desabilitaremos visualmente
    // para que el usuario vea que ya fueron procesadas

    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.cliente?.cedula?.includes(searchTerm)
      );
    }

    setFilteredSales(filtered);
  };

  const handleReturnSubmit = async () => {
    if (!selectedSale || returnData.selectedItems.length === 0) {
      toast.error('Selecciona al menos un producto para devolver');
      return;
    }

    if (!returnData.razonDevolucion) {
      toast.error('Especifica la razón de la devolución');
      return;
    }

    try {
      setLoading(true);

      const selectedProducts = selectedSale.items.filter((item, idx) =>
        returnData.selectedItems.includes(idx.toString())
      );

      const montoDevuelto = selectedProducts.reduce(
        (sum, item) => sum + item.precioTotal,
        0
      );

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventaId: selectedSale._id,
          numeroFactura: selectedSale.numeroFactura,
          cliente: selectedSale.cliente,
          productosDevueltos: selectedProducts.map((item) => ({
            nombreProducto: item.nombreProducto,
            cantidad: item.cantidad,
            cantidadDevuelta: item.cantidad,
            tipoVenta: item.tipoVenta || 'unidad', // ⭐ Incluir tipo de venta
            precioUnitario: item.precioUnitario,
            precioTotal: item.precioTotal,
            razon: returnData.razonDevolucion,
          })),
          montoDevuelto,
          razonDevolucion: returnData.razonDevolucion,
          notas: returnData.notas,
        }),
      });

      if (response.ok) {
        toast.success('Devolución registrada exitosamente');
        setSelectedSale(null);
        setReturnData({ selectedItems: [], razonDevolucion: '', notas: '' });
        // Recargar tanto las devoluciones como las ventas para actualizar los badges
        await Promise.all([
          fetchReturns(),
          fetchSales()
        ]);
      } else {
        toast.error('Error al registrar la devolución');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la devolución');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobada':
      case 'procesada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobada':
      case 'procesada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendiente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rechazada':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatRazon = (razon: string) => {
    const razones: { [key: string]: string } = {
      'defectuoso': 'Producto defectuoso',
      'vencido': 'Producto vencido',
      'error_pedido': 'Error en el pedido',
      'no_requerido': 'Ya no se requiere',
      'otro': 'Otro',
      'no_especificada': 'No especificada'
    };
    return razones[razon] || razon;
  };

  return (
    <div className="space-y-6">
      {/* Panel de Nuevas Devoluciones */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-red-600" />
            Procesar Nueva Devolución
          </CardTitle>
          <CardDescription>
            Selecciona una venta y los productos a devolver
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buscar Venta */}
          <div>
            <Label className="text-gray-700 font-medium mb-2 block">
              Buscar Venta
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número de factura, cliente o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Listado de Ventas */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => {
                const isReturned = sale.estado === 'devuelta';
                const hasReturns = sale.tieneDevoluciones || false;
                const isDisabled = isReturned || hasReturns;
                
                return (
                  <Button
                    key={sale._id}
                    onClick={() => !isDisabled && setSelectedSale(sale)}
                    variant={selectedSale?._id === sale._id ? 'default' : 'outline'}
                    disabled={isDisabled}
                    className={`w-full justify-start text-left h-auto p-3 ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed bg-gray-100'
                        : selectedSale?._id === sale._id
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {sale.numeroFactura} - {sale.cliente?.nombre || 'Cliente General'}
                        </span>
                        {isReturned && (
                          <Badge variant="destructive" className="text-xs">
                            DEVUELTA COMPLETA
                          </Badge>
                        )}
                        {hasReturns && !isReturned && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                            {sale.cantidadDevoluciones} DEV. PROCESADA{sale.cantidadDevoluciones! > 1 ? 'S' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {sale.items.length} productos • {formatCurrency(sale.total)}
                      </div>
                    </div>
                  </Button>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {searchTerm ? 'No se encontraron ventas' : 'Ingresa un término de búsqueda'}
              </div>
            )}
          </div>

          {/* Detalles de Venta Seleccionada */}
          {selectedSale && (
            <div className="border-t pt-4 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Productos a Devolver
                </h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-blue-100 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={returnData.selectedItems.includes(idx.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReturnData({
                              ...returnData,
                              selectedItems: [...returnData.selectedItems, idx.toString()],
                            });
                          } else {
                            setReturnData({
                              ...returnData,
                              selectedItems: returnData.selectedItems.filter(
                                (id) => id !== idx.toString()
                              ),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-900">
                          {item.nombreProducto}
                        </div>
                        <div className="text-gray-600">
                          Cant: {item.cantidad} • {formatCurrency(item.precioTotal)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Razón y Notas */}
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">
                    Razón de Devolución *
                  </Label>
                  <Select
                    value={returnData.razonDevolucion}
                    onValueChange={(value) =>
                      setReturnData({ ...returnData, razonDevolucion: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una razón" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defectuoso">Producto defectuoso</SelectItem>
                      <SelectItem value="vencido">Producto vencido</SelectItem>
                      <SelectItem value="error_pedido">Error en el pedido</SelectItem>
                      <SelectItem value="no_requerido">Ya no se requiere</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">
                    Notas Adicionales
                  </Label>
                  <Textarea
                    placeholder="Agregar detalles adicionales sobre la devolución..."
                    value={returnData.notas}
                    onChange={(e) =>
                      setReturnData({ ...returnData, notas: e.target.value })
                    }
                    className="min-h-24"
                  />
                </div>
              </div>

              {/* Monto a Devolver */}
              {returnData.selectedItems.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-gray-600 mb-1">Monto a Devolver</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      selectedSale.items
                        .filter((_, idx) =>
                          returnData.selectedItems.includes(idx.toString())
                        )
                        .reduce((sum, item) => sum + item.precioTotal, 0)
                    )}
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleReturnSubmit}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Procesando...' : 'Registrar Devolución'}
                </Button>
                <Button
                  onClick={() => setSelectedSale(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Devoluciones */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Historial de Devoluciones
          </CardTitle>
          <CardDescription>
            {returns.length} devoluciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura Original</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Razón</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length > 0 ? (
                  returns.map((ret) => (
                    <TableRow key={ret._id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => ret.ventaId && fetchSaleDetails(ret.ventaId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer transition-colors"
                          disabled={loadingInvoice || !ret.ventaId}
                        >
                          {ret.numeroFactura}
                        </button>
                      </TableCell>
                      <TableCell>
                        {ret.cliente?.nombre || 'Cliente General'}
                        {ret.cliente?.cedula && (
                          <div className="text-xs text-gray-500">
                            CI: {ret.cliente.cedula}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ret.productosDevueltos.map((p, idx) => (
                            <div key={idx}>{p.nombreProducto} ({p.cantidadDevuelta || p.cantidad || 0})</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(ret.montoReembolso || ret.total || 0)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ret.razonDevolucion ? formatRazon(ret.razonDevolucion) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${getStatusColor(ret.estado)}`}
                          variant="outline"
                        >
                          <span className="mr-1">
                            {getStatusIcon(ret.estado)}
                          </span>
                          {ret.estado.charAt(0).toUpperCase() + ret.estado.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(ret.fechaCreacion).toLocaleDateString('es-CO')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
                      <p className="text-gray-500">Sin devoluciones registradas</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Factura Original */}
      {showInvoiceModal && invoiceSale && (
        <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Receipt className="h-6 w-6 text-blue-600" />
                Factura Original - {invoiceSale.numeroFactura}
              </DialogTitle>
              <DialogDescription>
                Detalles de la venta original
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Información del Cliente */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Cliente</h3>
                <div className="text-sm">
                  <p className="font-medium">{invoiceSale.cliente?.nombre || 'Cliente General'}</p>
                  {invoiceSale.cliente?.cedula && (
                    <p className="text-gray-600">Cédula: {invoiceSale.cliente.cedula}</p>
                  )}
                  {invoiceSale.cliente?.telefono && (
                    <p className="text-gray-600">Teléfono: {invoiceSale.cliente.telefono}</p>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Productos Vendidos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceSale.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.nombreProducto}</TableCell>
                        <TableCell className="text-right">{item.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.precioTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoiceSale.subtotal)}</span>
                </div>
                {invoiceSale.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento:</span>
                    <span className="text-red-600 font-medium">-{formatCurrency(invoiceSale.descuento)}</span>
                  </div>
                )}
                {invoiceSale.impuesto > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impuesto:</span>
                    <span className="font-medium">{formatCurrency(invoiceSale.impuesto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(invoiceSale.total)}</span>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de pago:</span>
                  <Badge variant="outline" className="capitalize">
                    {invoiceSale.metodoPago}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <Badge 
                    variant={invoiceSale.estado === 'devuelta' ? 'destructive' : 'default'}
                    className="capitalize"
                  >
                    {invoiceSale.estado}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de venta:</span>
                  <span className="font-medium">
                    {new Date(invoiceSale.fechaVenta).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {invoiceSale.notas && (
                  <div>
                    <span className="text-gray-600">Notas:</span>
                    <p className="mt-1 text-gray-800">{invoiceSale.notas}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowInvoiceModal(false)} variant="outline">
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
