'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ShoppingCart,
  Calendar,
  DollarSign,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PurchaseItem {
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

interface PurchaseRecord {
  _id: string;
  numeroFactura: string;
  items: PurchaseItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  notas: string;
  createdAt: string;
}

interface ClientPurchaseHistoryProps {
  cedula: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
}

export function ClientPurchaseHistory({
  cedula,
  isOpen,
  onOpenChange,
  clientName = 'Cliente',
}: ClientPurchaseHistoryProps) {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && cedula) {
      fetchPurchaseHistory();
    }
  }, [isOpen, cedula]);

  const fetchPurchaseHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(cedula)}/history`
      );

      if (!response.ok) {
        throw new Error('Error al cargar el historial');
      }

      const data = await response.json();
      setPurchases(data.historial || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getTotalAmount = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  };

  const getMethodoPagoColor = (metodo: string) => {
    switch (metodo?.toLowerCase()) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'transferencia':
        return 'bg-purple-100 text-purple-800';
      case 'cheque':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg -m-6 mb-6">
          <DialogTitle className="flex items-center gap-2 text-white text-lg">
            <ShoppingCart className="h-6 w-6" />
            Historial de Compras
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-1">
            {clientName} • Cédula: <span className="font-mono font-semibold">{cedula}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mt-6">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Sin historial de compras</p>
            <p className="text-sm text-gray-400">
              Este cliente aún no ha realizado compras
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total de Compras</p>
                <p className="text-3xl font-bold text-blue-600">
                  {purchases.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Monto Total Invertido</p>
                <p className="text-3xl font-bold text-green-600">
                  ${getTotalAmount().toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            {/* Tabla de compras */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-md">
              <Table>
                <TableHeader className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <TableRow className="border-b-2 border-gray-200">
                    <TableHead className="w-12 px-4 text-gray-700"></TableHead>
                    <TableHead className="px-4 text-xs font-bold text-gray-700">Factura</TableHead>
                    <TableHead className="px-4 text-xs font-bold text-gray-700">Fecha</TableHead>
                    <TableHead className="px-4 text-xs font-bold text-gray-700">Método de Pago</TableHead>
                    <TableHead className="px-4 text-right text-xs font-bold text-gray-700">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <div key={purchase._id}>
                      <TableRow className="hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors">
                        <TableCell className="w-12 px-4 py-4">
                          <button
                            onClick={() => toggleRowExpanded(purchase._id)}
                            className="p-1 hover:bg-blue-200 rounded transition-colors"
                          >
                            <ChevronDown
                              className={`h-4 w-4 text-blue-600 transition-transform ${
                                expandedRows.has(purchase._id)
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="px-4 text-sm font-semibold text-blue-600 py-4">
                          {purchase.numeroFactura}
                        </TableCell>
                        <TableCell className="px-4 text-sm text-gray-700 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {format(
                                new Date(purchase.createdAt),
                                'dd MMM yyyy',
                                { locale: es }
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            className={`text-xs font-semibold ${getMethodoPagoColor(
                              purchase.metodoPago
                            )}`}
                            variant="outline"
                          >
                            {purchase.metodoPago}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold text-gray-900 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              {purchase.total.toLocaleString('es-CO', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Detalles expandidos */}
                      {expandedRows.has(purchase._id) && (
                        <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-300">
                          <TableCell colSpan={5}>
                            <div className="py-4 space-y-4">
                              {/* Items de la compra */}
                              <div>
                                <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                                  Productos ({purchase.items.length})
                                </h4>
                                <div className="space-y-2 bg-white rounded-lg p-4 border-2 border-blue-150 shadow-sm">
                                  {purchase.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-start text-sm pb-3 border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-900">
                                          {item.nombreProducto}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          <span className="font-medium">Cantidad:</span> {item.cantidad} × <span className="font-mono">${item.precioUnitario.toLocaleString('es-CO')}</span>
                                        </p>
                                      </div>
                                      <p className="font-bold text-gray-900 text-right ml-4">
                                        ${item.precioTotal.toLocaleString('es-CO', {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                        })}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Resumen de montos */}
                              <div className="bg-white rounded-lg p-4 border-2 border-blue-150 shadow-sm space-y-2 text-sm">
                                <div className="flex justify-between pb-2 border-b border-gray-200">
                                  <span className="text-gray-600 font-medium">Subtotal:</span>
                                  <span className="font-semibold text-gray-900">
                                    ${purchase.subtotal.toLocaleString('es-CO', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                </div>
                                {purchase.descuento > 0 && (
                                  <div className="flex justify-between text-red-600 pb-2 border-b border-red-100">
                                    <span className="font-medium">Descuento:</span>
                                    <span className="font-semibold">
                                      -${purchase.descuento.toLocaleString('es-CO', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                  </div>
                                )}
                                {purchase.impuesto > 0 && (
                                  <div className="flex justify-between text-orange-600 pb-2 border-b border-orange-100">
                                    <span className="font-medium">Impuesto:</span>
                                    <span className="font-semibold">
                                      +${purchase.impuesto.toLocaleString('es-CO', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t-2 border-gray-300 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded">
                                  <span>Total a Pagar:</span>
                                  <span className="text-green-600 text-base">
                                    ${purchase.total.toLocaleString('es-CO', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Notas si existen */}
                              {purchase.notas && (
                                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                                  <p className="text-xs font-bold text-yellow-900 mb-2 flex items-center gap-1">
                                    📝 Notas:
                                  </p>
                                  <p className="text-sm text-yellow-800">
                                    {purchase.notas}
                                  </p>
                                </div>
                              )}

                              {/* Metadatos */}
                              <div className="text-xs text-gray-500 pt-3 border-t border-gray-200 space-y-1">
                                <p className="font-mono">ID: {purchase._id}</p>
                                <p>
                                  {format(
                                    new Date(purchase.createdAt),
                                    'dd MMM yyyy HH:mm:ss',
                                    { locale: es }
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </div>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Botón para cerrar */}
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold py-2 rounded-lg"
            >
              Cerrar Historial
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
