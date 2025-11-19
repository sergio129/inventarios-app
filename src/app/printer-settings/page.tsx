'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Printer, Save, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface PrinterConfig {
  autoprint: boolean;
  paperWidth: 58 | 80;
  printerType: 'thermal' | 'network' | 'usb';
  printerAddress?: string;
  printerPort?: number;
}

export default function PrinterSettingsPage() {
  const [config, setConfig] = useState<PrinterConfig>({
    autoprint: true,
    paperWidth: 80,
    printerType: 'thermal',
    printerAddress: '192.168.1.100',
    printerPort: 9100
  });
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración del localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('printerConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading printer config:', error);
    }
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      localStorage.setItem('printerConfig', JSON.stringify(config));
      toast.success('Configuración de impresora guardada');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      toast.loading('Enviando prueba de impresión...', { id: 'test-print' });
      
      const testData = `
${' '.repeat(15)}PRUEBA DE IMPRESORA
${' '.repeat(10)}Sistema de Gestión de Inventario

Fecha: ${new Date().toLocaleDateString('es-CO')}
Hora: ${new Date().toLocaleTimeString('es-CO')}

${'-'.repeat(48)}

          ¡Impresora funcionando correctamente!

${'-'.repeat(48)}

      `;

      const response = await fetch('/api/print/thermal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: testData
      });

      if (response.ok) {
        toast.success('Prueba de impresión enviada', { id: 'test-print' });
      } else {
        toast.error('Error al enviar prueba de impresión', { id: 'test-print' });
      }
    } catch (error) {
      console.error('Error en prueba de impresión:', error);
      toast.error('Error al enviar prueba de impresión', { id: 'test-print' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/sales">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Ventas
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración de Impresora</h1>
              <p className="text-gray-600 mt-2">Configura tu impresora térmica para recibos</p>
            </div>
            <Link href="/thermal-preview">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vista Previa
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Configuración de Impresora Térmica
            </CardTitle>
            <CardDescription>
              Ajusta los parámetros para que los recibos se impriman correctamente
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Autoprint Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <Label className="text-base font-semibold">Impresión Automática</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Imprime automáticamente después de completar la venta
                </p>
              </div>
              <Switch
                checked={config.autoprint}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, autoprint: checked })
                }
              />
            </div>

            {/* Paper Width Selection */}
            <div className="space-y-2">
              <Label htmlFor="paper-width">Ancho del Papel</Label>
              <Select 
                value={config.paperWidth.toString()} 
                onValueChange={(value) =>
                  setConfig({ ...config, paperWidth: parseInt(value) as 58 | 80 })
                }
              >
                <SelectTrigger id="paper-width">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm (32 caracteres)</SelectItem>
                  <SelectItem value="80">80mm (48 caracteres)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Selecciona el ancho de papel de tu impresora térmica
              </p>
            </div>

            {/* Printer Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="printer-type">Tipo de Impresora</Label>
              <Select 
                value={config.printerType} 
                onValueChange={(value) =>
                  setConfig({ ...config, printerType: value as any })
                }
              >
                <SelectTrigger id="printer-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Térmica USB</SelectItem>
                  <SelectItem value="network">Red (LPR)</SelectItem>
                  <SelectItem value="usb">USB Directo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Selecciona cómo está conectada tu impresora
              </p>
            </div>

            {/* Network Printer Options */}
            {config.printerType === 'network' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="printer-address">Dirección IP de Impresora</Label>
                  <Input
                    id="printer-address"
                    placeholder="192.168.1.100"
                    value={config.printerAddress || ''}
                    onChange={(e) =>
                      setConfig({ ...config, printerAddress: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="printer-port">Puerto</Label>
                  <Input
                    id="printer-port"
                    type="number"
                    placeholder="9100"
                    value={config.printerPort || 9100}
                    onChange={(e) =>
                      setConfig({ ...config, printerPort: parseInt(e.target.value) })
                    }
                  />
                </div>
              </>
            )}

            {/* Info Box */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Compatibilidad</p>
                <p>
                  Esta aplicación soporta impresoras térmicas ESC/POS. 
                  Asegúrate de tener tu impresora correctamente conectada y configurada 
                  en tu sistema operativo.
                </p>
              </div>
            </div>

            {/* Test Print Button */}
            <Button 
              onClick={handleTestPrint} 
              variant="outline" 
              className="w-full"
            >
              <Printer className="h-4 w-4 mr-2" />
              Enviar Prueba de Impresión
            </Button>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Ayuda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900 mb-2">¿Cómo conectar mi impresora térmica?</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Conecta la impresora al puerto USB de tu computadora</li>
                <li>Instala los drivers si es necesario</li>
                <li>Selecciona &quot;Térmica USB&quot; en el tipo de impresora</li>
                <li>Haz una prueba de impresión para verificar</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">¿Por qué no imprime?</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verifica que la impresora esté encendida y conectada</li>
                <li>Asegúrate de tener papel en la impresora</li>
                <li>Prueba enviando una página de prueba</li>
                <li>Revisa los logs del navegador (F12) para errores</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
