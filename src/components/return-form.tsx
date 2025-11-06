'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReturnItem {
  productoId: string;
  nombreProducto: string;
  cantidadOriginal: number;
  cantidadDevuelta: number;
  precioUnitario: number;
  precioTotal: number;
  motivo: string;
}

interface ReturnFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saleData: {
    ventaId: string;
    numeroFactura: string;
    items: any[];
    total: number;
    cliente: {
      cedula: string;
      nombre: string;
    };
  };
  onReturnCreated?: () => void;
}

export function ReturnForm({
  isOpen,
  onOpenChange,
  saleData,
  onReturnCreated,
}: ReturnFormProps) {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [tipoDevolucion, setTipoDevolucion] = useState<'completa' | 'parcial'>(
    'parcial'
  );
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateTotals = () => {
    let subtotal = 0;
    returnItems.forEach((item) => {
      subtotal += item.precioTotal;
    });
    const subtotalConDescuento = subtotal - descuento;
    const impuesto = Math.round(subtotalConDescuento * 0.19);
    const total = subtotalConDescuento + impuesto;
    return { subtotal, impuesto, total };
  };

  const addReturnItem = (saleItem: any) => {
    const newReturnItem: ReturnItem = {
      productoId: saleItem._id || saleItem.productoId,
      nombreProducto: saleItem.nombreProducto,
      cantidadOriginal: saleItem.cantidad,
      cantidadDevuelta: 1,
      precioUnitario: saleItem.precioUnitario || saleItem.precio,
      precioTotal: saleItem.precioUnitario || saleItem.precio,
      motivo: 'Cambio de parecer',
    };
    setReturnItems([...returnItems, newReturnItem]);
  };

  const updateReturnItem = (index: number, updates: Partial<ReturnItem>) => {
    const updated = [...returnItems];
    updated[index] = { ...updated[index], ...updates };
    // Recalcular precioTotal
    if (updates.cantidadDevuelta) {
      updated[index].precioTotal =
        updated[index].cantidadDevuelta * updated[index].precioUnitario;
    }
    setReturnItems(updated);
  };

  const removeReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (returnItems.length === 0) {
      toast.error('Agregue al menos un producto a la devolución');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventaId: saleData.ventaId,
          numeroFactura: saleData.numeroFactura,
          cliente: saleData.cliente,
          items: returnItems,
          descuento,
          notas,
          tipoDevolucion,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la devolución');
      }

      const data = await response.json();
      toast.success(`Devolución creada: ${data.numeroDevolucion}`);
      onReturnCreated?.();
      onOpenChange(false);
      // Limpiar formulario
      setReturnItems([]);
      setDescuento(0);
      setNotas('');
      setTipoDevolucion('parcial');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, impuesto, total } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        <DialogHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-lg -m-6 mb-6">
          <DialogTitle className="flex items-center gap-2 text-white text-lg">
            <RotateCcw className="h-6 w-6" />
            Crear Devolución
          </DialogTitle>
          <DialogDescription className="text-orange-100 mt-1">
            Factura: <span className="font-mono font-semibold">{saleData.numeroFactura}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-1">
          {/* Información de la venta */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">Información de la Venta</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Cliente:</span>
                <p className="font-semibold">{saleData.cliente.nombre}</p>
              </div>
              <div>
                <span className="text-gray-600">Cédula:</span>
                <p className="font-mono font-semibold">{saleData.cliente.cedula}</p>
              </div>
            </div>
          </div>

          {/* Tipo de devolución */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-700">Tipo de Devolución</label>
            <div className="flex gap-4">
              <button
                onClick={() => setTipoDevolucion('completa')}
                className={`flex-1 px-4 py-2 rounded border-2 transition-colors ${
                  tipoDevolucion === 'completa'
                    ? 'bg-red-100 border-red-500 text-red-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Completa
              </button>
              <button
                onClick={() => setTipoDevolucion('parcial')}
                className={`flex-1 px-4 py-2 rounded border-2 transition-colors ${
                  tipoDevolucion === 'parcial'
                    ? 'bg-orange-100 border-orange-500 text-orange-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Parcial
              </button>
            </div>
          </div>

          {/* Productos disponibles para devolución */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-700">
              Productos para Devolver
            </label>
            <div className="border rounded-lg p-4 space-y-2 bg-white max-h-48 overflow-y-auto">
              {saleData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.nombreProducto}</p>
                    <p className="text-xs text-gray-500">
                      Stock: {item.cantidad} × ${item.precioUnitario || item.precio}
                    </p>
                  </div>
                  <Button
                    onClick={() => addReturnItem(item)}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de devoluciones */}
          {returnItems.length > 0 && (
            <div className="border-2 border-orange-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-orange-50">
                  <TableRow>
                    <TableHead className="px-4 text-xs font-bold">Producto</TableHead>
                    <TableHead className="px-4 text-xs font-bold text-right">Cant. Orig.</TableHead>
                    <TableHead className="px-4 text-xs font-bold text-right">Cant. Dev.</TableHead>
                    <TableHead className="px-4 text-xs font-bold text-right">Precio Unit.</TableHead>
                    <TableHead className="px-4 text-xs font-bold text-right">Total</TableHead>
                    <TableHead className="px-4 text-xs font-bold">Motivo</TableHead>
                    <TableHead className="px-4 text-center text-xs font-bold">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnItems.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-orange-50">
                      <TableCell className="px-4 py-3 text-sm font-medium">
                        {item.nombreProducto}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm">
                        {item.cantidadOriginal}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Input
                          type="number"
                          min="1"
                          max={item.cantidadOriginal}
                          value={item.cantidadDevuelta}
                          onChange={(e) =>
                            updateReturnItem(idx, {
                              cantidadDevuelta: parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-16 text-right text-sm"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-mono">
                        ${item.precioUnitario.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-bold text-orange-600">
                        ${item.precioTotal.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <select
                          value={item.motivo}
                          onChange={(e) =>
                            updateReturnItem(idx, { motivo: e.target.value })
                          }
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option>Cambio de parecer</option>
                          <option>Defecto de producto</option>
                          <option>No es lo que pedí</option>
                          <option>Producto dañado</option>
                          <option>Otra razón</option>
                        </select>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Button
                          onClick={() => removeReturnItem(idx)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Resumen de costos */}
          {returnItems.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border-2 border-orange-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-semibold text-red-600">
                  -${descuento.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Impuesto (19%):</span>
                <span className="font-semibold">${impuesto.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-orange-300">
                <span>Monto a Reembolsar:</span>
                <span className="text-red-600">${total.toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-700">Notas (Opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Agregar notas sobre la devolución..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading || returnItems.length === 0}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700"
            >
              {loading ? 'Procesando...' : 'Crear Devolución'}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
