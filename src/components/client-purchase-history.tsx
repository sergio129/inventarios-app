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
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="text-xs">Factura</TableHead>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Método</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <div key={purchase._id}>
                      <TableRow className="hover:bg-gray-50 cursor-pointer">
                        <TableCell className="w-12">
                          <button
                            onClick={() => toggleRowExpanded(purchase._id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedRows.has(purchase._id)
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {purchase.numeroFactura}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(purchase.createdAt),
                              'dd MMM yyyy',
                              { locale: es }
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${getMethodoPagoColor(
                              purchase.metodoPago
                            )}`}
                            variant="outline"
                          >
                            {purchase.metodoPago}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="h-3 w-3" />
                            {purchase.total.toLocaleString('es-CO', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Detalles expandidos */}
                      {expandedRows.has(purchase._id) && (
                        <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                          <TableCell colSpan={5}>
                            <div className="py-4 space-y-3">
                              {/* Items de la compra */}
                              <div>
                                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                  Productos ({purchase.items.length})
                                </h4>
                                <div className="space-y-2 bg-white rounded p-3 border border-blue-100">
                                  {purchase.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-start text-sm"
                                    >
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {item.nombreProducto}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Cantidad: {item.cantidad} × $
                                          {item.precioUnitario.toLocaleString(
                                            'es-CO',
                                            {
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 0,
                                            }
                                          )}
                                        </p>
                                      </div>
                                      <p className="font-semibold text-gray-900">
                                        $
                                        {item.precioTotal.toLocaleString(
                                          'es-CO',
                                          {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                          }
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Resumen de montos */}
                              <div className="bg-white rounded p-3 border border-blue-100 space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Subtotal:</span>
                                  <span className="font-medium">
                                    $
                                    {purchase.subtotal.toLocaleString('es-CO',
                                      {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      }
                                    )}
                                  </span>
                                </div>
                                {purchase.descuento > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Descuento:</span>
                                    <span className="font-medium">
                                      -$
                                      {purchase.descuento.toLocaleString(
                                        'es-CO',
                                        {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                        }
                                      )}
                                    </span>
                                  </div>
                                )}
                                {purchase.impuesto > 0 && (
                                  <div className="flex justify-between text-orange-600">
                                    <span>Impuesto:</span>
                                    <span className="font-medium">
                                      +$
                                      {purchase.impuesto.toLocaleString(
                                        'es-CO',
                                        {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                        }
                                      )}
                                    </span>
                                  </div>
                                )}
                                <div className="border-t pt-1 mt-1 flex justify-between font-bold text-gray-900">
                                  <span>Total:</span>
                                  <span>
                                    $
                                    {purchase.total.toLocaleString('es-CO', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Notas si existen */}
                              {purchase.notas && (
                                <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
                                  <p className="text-xs font-medium text-yellow-900 mb-1">
                                    Notas:
                                  </p>
                                  <p className="text-sm text-yellow-800">
                                    {purchase.notas}
                                  </p>
                                </div>
                              )}

                              {/* Metadatos */}
                              <div className="text-xs text-gray-500 pt-2 border-t">
                                <p>
                                  ID: {purchase._id}
                                </p>
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
              className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
