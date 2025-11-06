'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ReturnRecord {
  _id: string;
  numeroDevolucion: string;
  numeroFactura: string;
  cliente: {
    cedula: string;
    nombre: string;
  };
  items: any[];
  total: number;
  montoReembolso: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'procesada';
  tipoDevolucion: 'completa' | 'parcial';
  notas?: string;
  fechaCreacion: string;
  fechaAprobacion?: string;
}

interface ReturnsListProps {
  cedula?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnsList({ cedula, isOpen, onOpenChange }: ReturnsListProps) {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen && cedula) {
      fetchReturns();
    }
  }, [isOpen, cedula]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const url = cedula
        ? `/api/returns?cedula=${encodeURIComponent(cedula)}`
        : '/api/returns';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReturns(data);
      }
    } catch (error) {
      toast.error('Error al cargar devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (returnId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/returns?id=${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (response.ok) {
        toast.success('Devolución actualizada');
        fetchReturns();
      }
    } catch (error) {
      toast.error('Error al actualizar devolución');
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pendiente':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rechazada':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'procesada':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'procesada':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-lg -m-6 mb-6">
            <DialogTitle className="flex items-center gap-2 text-white">
              <RotateCcw className="h-6 w-6" />
              Devoluciones y Ajustes
            </DialogTitle>
            <DialogDescription className="text-orange-100">
              {cedula ? `Devoluciones del cliente: ${cedula}` : 'Todas las devoluciones'}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RotateCcw className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Sin devoluciones registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="px-4 text-xs font-bold">Devolución</TableHead>
                      <TableHead className="px-4 text-xs font-bold">Factura Original</TableHead>
                      <TableHead className="px-4 text-xs font-bold">Fecha</TableHead>
                      <TableHead className="px-4 text-xs font-bold text-right">Monto</TableHead>
                      <TableHead className="px-4 text-xs font-bold">Estado</TableHead>
                      <TableHead className="px-4 text-xs font-bold text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((ret) => (
                      <TableRow key={ret._id} className="hover:bg-gray-50 border-b">
                        <TableCell className="px-4 py-3 font-semibold text-blue-600">
                          {ret.numeroDevolucion}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {ret.numeroFactura}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">
                          {format(new Date(ret.fechaCreacion), 'dd MMM yyyy', {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-bold text-red-600">
                          ${ret.montoReembolso.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={`${getStatusColor(ret.estado)} text-xs`}>
                            {ret.estado.charAt(0).toUpperCase() + ret.estado.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            onClick={() => {
                              setSelectedReturn(ret);
                              setShowDetails(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de detalles */}
      {selectedReturn && showDetails && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Devolución</DialogTitle>
              <DialogDescription>{selectedReturn.numeroDevolucion}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Información general */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Factura Original</p>
                  <p className="font-semibold">{selectedReturn.numeroFactura}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Tipo</p>
                  <p className="font-semibold capitalize">{selectedReturn.tipoDevolucion}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Estado</p>
                  <Badge className={getStatusColor(selectedReturn.estado)}>
                    {selectedReturn.estado}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Monto Reembolso</p>
                  <p className="font-semibold text-red-600">
                    ${selectedReturn.montoReembolso.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-2">Productos Devueltos</h3>
                <div className="space-y-2">
                  {selectedReturn.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-orange-50 rounded border border-orange-200"
                    >
                      <p className="font-medium text-gray-900">{item.nombreProducto}</p>
                      <p className="text-xs text-gray-600">
                        {item.cantidadDevuelta} unidades - Motivo: {item.motivo}
                      </p>
                      <p className="text-sm font-semibold text-orange-600">
                        ${item.precioTotal.toLocaleString('es-CO')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              {selectedReturn.estado === 'pendiente' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateReturnStatus(selectedReturn._id, 'aprobada')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Aprobar
                  </Button>
                  <Button
                    onClick={() => updateReturnStatus(selectedReturn._id, 'rechazada')}
                    variant="destructive"
                    className="flex-1"
                  >
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
