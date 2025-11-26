'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, X } from 'lucide-react';
import { generateInvoicePDF, printInvoice } from '@/lib/invoice-utils';
import { printThermalReceipt } from '@/lib/thermal-printer';
import { toast } from 'sonner';

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
    precioUnitario: number;
    precioTotal: number;
  }>;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  estado: string;
  vendedor?: {
    name: string;
    email: string;
  };
  notas?: string;
  fechaVenta: Date;
  fechaCreacion: Date;
}

interface InvoiceProps {
  sale: Sale;
  onClose: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function Invoice({ sale, onClose, onPrint, onDownload }: InvoiceProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handleThermalPrint = async () => {
    try {
      setIsPrinting(true);
      toast.loading('Enviando a impresora térmica...', { id: 'thermal-print' });
      await printThermalReceipt(sale as any, 58);
      toast.success('Recibo enviado a la impresora', { id: 'thermal-print' });
    } catch (error) {
      console.error('Error en impresión térmica:', error);
      toast.error('Error al enviar a la impresora térmica', { id: 'thermal-print' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printInvoice(sale);
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      try {
        toast.loading('Generando PDF...', { id: 'pdf-download' });
        await generateInvoicePDF(sale);
        toast.success('PDF descargado exitosamente', { id: 'pdf-download' });
      } catch (error) {
        console.error('Error descargando PDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar el PDF';
        toast.error(`Error al descargar el PDF: ${errorMessage}`, { id: 'pdf-download' });
      }
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header con acciones */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50 flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Factura #{sale.numeroFactura}</h2>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleThermalPrint} 
              disabled={isPrinting}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Printer className="h-4 w-4" />
              {isPrinting ? 'Imprimiendo...' : 'Impresora Térmica'}
            </Button>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenido de la factura */}
        <div id="invoice-content" className="p-6 space-y-6">
          {/* Información de la empresa */}
          <div className="text-center border-b pb-4">
            <h1 className="text-3xl font-bold text-orange-600">Unik Retail</h1>
            <p className="text-gray-600">Sistema de Gestión de Inventario</p>
            <p className="text-sm text-gray-500">Factura Electrónica</p>
          </div>

          {/* Información de la factura */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Información de la Venta</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Factura:</span> {sale.numeroFactura}</p>
                <p><span className="font-medium">Fecha:</span> {formatDate(sale.fechaVenta)}</p>
                <p><span className="font-medium">Estado:</span>
                  <Badge variant={sale.estado === 'completada' ? 'default' : 'secondary'} className="ml-2">
                    {sale.estado}
                  </Badge>
                </p>
                {sale.vendedor && (
                  <p><span className="font-medium">Vendedor:</span> {sale.vendedor.name}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Información del Cliente</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nombre:</span> {sale.cliente?.nombre || 'Cliente General'}</p>
                {sale.cliente?.cedula && (
                  <p><span className="font-medium">Cédula:</span> {sale.cliente.cedula}</p>
                )}
                {sale.cliente?.telefono && (
                  <p><span className="font-medium">Teléfono:</span> {sale.cliente.telefono}</p>
                )}
              </div>
            </div>
          </div>

          {/* Detalles de productos */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Detalles de Productos</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Producto</th>
                    <th className="text-center py-2 px-3 font-medium">Cant.</th>
                    <th className="text-right py-2 px-3 font-medium">Precio Unit.</th>
                    <th className="text-right py-2 px-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-3">{item.nombreProducto}</td>
                      <td className="text-center py-3 px-3">{item.cantidad}</td>
                      <td className="text-right py-3 px-3">{formatCurrency(item.precioUnitario)}</td>
                      <td className="text-right py-3 px-3 font-medium">{formatCurrency(item.precioTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de totales */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({sale.descuento}%):</span>
                  <span>-{formatCurrency((sale.subtotal * sale.descuento) / 100)}</span>
                </div>
              )}
              {sale.impuesto > 0 && (
                <div className="flex justify-between">
                  <span>Impuesto:</span>
                  <span>{formatCurrency(sale.impuesto)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Método de pago:</span>
                <span className="capitalize">{sale.metodoPago}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          {sale.notas && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Notas</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{sale.notas}</p>
            </div>
          )}

          {/* Pie de página */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Gracias por su compra en la Unik</p>
            <p>Factura generada automáticamente por el sistema</p>
          </div>
        </div>
      </div>
    </div>
  );
}
