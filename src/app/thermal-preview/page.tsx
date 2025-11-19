'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { ThermalPrinter } from '@/lib/thermal-printer';

interface PrinterSale {
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
  notas?: string;
  fechaVenta: Date;
}

// Datos de ejemplo
const exampleSale: PrinterSale = {
  numeroFactura: 'FAC-20251119-001',
  cliente: {
    nombre: 'Juan Carlos Pérez',
    cedula: '123456789',
    telefono: '3001234567'
  },
  items: [
    {
      nombreProducto: 'SALSA DE PIÑA DIFEER X 4000GR',
      cantidad: 2,
      precioUnitario: 7500,
      precioTotal: 15000
    },
    {
      nombreProducto: 'SALSA DE TOMATE DIFFER X 4000GR',
      cantidad: 1,
      precioUnitario: 7500,
      precioTotal: 7500
    },
    {
      nombreProducto: 'HAMBURGUESAPRUEBA',
      cantidad: 3,
      precioUnitario: 17250,
      precioTotal: 51750
    }
  ],
  subtotal: 74250,
  descuento: 10,
  impuesto: 0,
  total: 66825,
  metodoPago: 'efectivo',
  notas: 'Entrega rápida',
  fechaVenta: new Date()
};

export default function ThermalPreviewPage() {
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('80');
  const [previewHTML, setPreviewHTML] = useState('');

  useEffect(() => {
    const printer = new ThermalPrinter({ paperWidth: parseInt(paperWidth) as 58 | 80 });
    const receiptData = printer.generateReceipt(exampleSale);
    
    // Convertir a HTML para vista previa
    const escaped = receiptData
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/ /g, '&nbsp;');

    setPreviewHTML(escaped);
  }, [paperWidth]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/sales">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Ventas
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Vista Previa de Recibo Térmico</h1>
          <p className="text-gray-600 mt-2">Visualiza cómo se verá el recibo en la impresora térmica</p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuración de Vista Previa</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Ancho de Papel</label>
              <Select value={paperWidth} onValueChange={(value) => setPaperWidth(value as '58' | '80')}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm (32 caracteres)</SelectItem>
                  <SelectItem value="80">80mm (48 caracteres)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-gray-500 mt-6">
              <p>Selecciona el ancho para ver diferentes formatos</p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Preview */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Vista Previa del Recibo
                </CardTitle>
                <CardDescription>
                  Así se verá cuando se imprima en la impresora térmica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 overflow-x-auto"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    backgroundColor: '#f9f9f9',
                    maxWidth: paperWidth === '58' ? '320px' : '420px'
                  }}
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                  />
                </div>

                {/* Size Info */}
                <div className="mt-6 text-xs text-gray-500 space-y-2">
                  <p>
                    <strong>Ancho configurado:</strong> {paperWidth}mm
                  </p>
                  <p>
                    <strong>Caracteres por línea:</strong> {paperWidth === '58' ? '32' : '48'}
                  </p>
                  <p>
                    <strong>Fuente:</strong> Monoespaciada (como en impresora térmica)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Sale Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Ejemplo</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">Factura</p>
                  <p className="text-gray-600">{exampleSale.numeroFactura}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Cliente</p>
                  <p className="text-gray-600">{exampleSale.cliente?.nombre}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Productos</p>
                  <p className="text-gray-600">{exampleSale.items.length} artículos</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Subtotal</p>
                  <p className="text-gray-600">${exampleSale.subtotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Descuento</p>
                  <p className="text-gray-600">{exampleSale.descuento}% (-${((exampleSale.subtotal * exampleSale.descuento) / 100).toLocaleString()})</p>
                </div>
                <div className="border-t pt-2">
                  <p className="font-semibold text-gray-900">Total</p>
                  <p className="text-lg font-bold text-green-600">${exampleSale.total.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Características</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Formato ESC/POS estándar</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Alineación automática</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Cálculo correcto de descuentos</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Datos del cliente</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Corte automático</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consejos</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-gray-600">
                <p>
                  • Prueba con diferentes anchos de papel para ver el mejor formato
                </p>
                <p>
                  • La fuente monoespaciada simula la impresora térmica real
                </p>
                <p>
                  • Los recibos se imprimen automáticamente después de cada venta
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
