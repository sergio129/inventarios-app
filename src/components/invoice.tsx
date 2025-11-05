'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, X } from 'lucide-react';
import { generateInvoicePDF, printInvoice } from '@/lib/invoice-utils';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';
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
  const { config, loading: configLoading } = useCompanyConfig();

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printInvoice(sale, config || undefined);
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      try {
        toast.loading('Generando PDF...', { id: 'pdf-download' });
        await generateInvoicePDF(sale, config || undefined);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900">{config?.labels.factura_titulo || 'Factura'} #{sale.numeroFactura}</h2>
          <div className="flex gap-2">
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
            <h1 className="text-3xl font-bold text-orange-600">{config?.nombreEmpresa || config?.labels.nombreApp || 'inventarios-app'}</h1>
            <p className="text-gray-600">{config?.labels.subtitulo || 'Sistema de Gestión'}</p>
            <p className="text-sm text-gray-500">{config?.labels.factura_titulo || 'Factura'} Electrónica</p>
            {config?.informacion?.razonSocial && (
              <p className="text-sm text-gray-500">{config.informacion.razonSocial}</p>
            )}
            {config?.informacion?.telefono && (
              <p className="text-xs text-gray-400">{config.informacion.telefono}</p>
            )}
          </div>

          {/* Información de la factura */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{config?.labels.factura_titulo || 'Factura'} - {config?.labels.modulo_ventas || 'Información'}</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">{config?.labels.factura_numero || 'Factura'}:</span> {sale.numeroFactura}</p>
                <p><span className="font-medium">{config?.labels.factura_fecha || 'Fecha'}:</span> {formatDate(sale.fechaVenta)}</p>
                <p><span className="font-medium">{config?.labels.factura_estado || 'Estado'}:</span>
                  <Badge variant={sale.estado === 'completada' ? 'default' : 'secondary'} className="ml-2">
                    {sale.estado}
                  </Badge>
                </p>
                {sale.vendedor && (
                  <p><span className="font-medium">{config?.labels.factura_vendedor || 'Vendedor'}:</span> {sale.vendedor.name}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{config?.labels.factura_cliente || 'Información del Cliente'}</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">{config?.labels.producto_nombre || 'Nombre'}:</span> {sale.cliente?.nombre || 'Cliente General'}</p>
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
            <h3 className="font-semibold text-gray-900 mb-4">{config?.labels.factura_productos || 'Detalles de Productos'}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">{config?.labels.producto_nombre || 'Producto'}</th>
                    <th className="text-center py-2 px-3 font-medium">{config?.labels.factura_cantidad || 'Cant.'}</th>
                    <th className="text-right py-2 px-3 font-medium">{config?.labels.factura_precio_unitario || 'Precio Unit.'}</th>
                    <th className="text-right py-2 px-3 font-medium">{config?.labels.factura_total || 'Total'}</th>
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
                <span>{config?.labels.factura_subtotal || 'Subtotal'}:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.descuento > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{config?.labels.factura_descuento || 'Descuento'} ({sale.descuento}%):</span>
                  <span>-{formatCurrency((sale.subtotal * sale.descuento) / 100)}</span>
                </div>
              )}
              {sale.impuesto > 0 && (
                <div className="flex justify-between">
                  <span>{config?.labels.factura_impuesto || 'Impuesto'}:</span>
                  <span>{formatCurrency(sale.impuesto)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{config?.labels.factura_total || 'Total'}:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{config?.labels.factura_metodo_pago || 'Método de pago'}:</span>
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
            <p>Gracias por su compra en {config?.nombreEmpresa || config?.labels.nombreApp || 'inventarios-app'}</p>
            <p>Factura generada automáticamente por el sistema</p>
          </div>
        </div>
      </div>
    </div>
  );
}
