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
  printerType: 'usb' | 'windows' | 'network';
  printerName: string; // Nombre de impresora en Windows
  printerAddress?: string;
  printerPort?: number;
}

export default function PrinterSettingsPage() {
  const [config, setConfig] = useState<PrinterConfig>({
    autoprint: true,
    paperWidth: 80,
    printerType: 'usb',
    printerName: 'POS-5890',
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
              <h1 className="text-3xl font-bold text-gray-900">Impresora POS-5890U-L</h1>
              <p className="text-gray-600 mt-2">Configuración de impresora térmica de recibos</p>
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
                  <SelectItem value="80">80mm (48 caracteres) - Recomendado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                POS-5890U-L soporta papel de 80mm de ancho
              </p>
            </div>

            {/* Printer Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="printer-type">Método de Conexión</Label>
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
                  <SelectItem value="usb">USB Directo (Recomendado)</SelectItem>
                  <SelectItem value="windows">Cola de Impresión Windows</SelectItem>
                  <SelectItem value="network">Red TCP/IP</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Selecciona cómo está conectada tu impresora POS-5890U-L
              </p>
            </div>

            {/* Windows Printer Name */}
            {config.printerType === 'windows' && (
              <div className="space-y-2">
                <Label htmlFor="printer-name">Nombre de Impresora en Windows</Label>
                <Input
                  id="printer-name"
                  placeholder="POS-5890"
                  value={config.printerName}
                  onChange={(e) =>
                    setConfig({ ...config, printerName: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500">
                  Busca el nombre exacto en Configuración {'>'} Impresoras y escáneres
                </p>
              </div>
            )}

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
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">📋 Información POS-5890U-L</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Impresora térmica de 80mm</li>
                    <li>Compatible con comandos ESC/POS</li>
                    <li>Conexión USB</li>
                    <li>Velocidad: 200mm/s</li>
                    <li>Corte automático de papel</li>
                  </ul>
                </div>
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
              <p className="font-semibold text-gray-900 mb-2">🔌 ¿Cómo conectar mi POS-5890U-L?</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Conecta el cable USB al puerto de tu computadora</li>
                <li>Enciende la impresora (LED verde encendido)</li>
                <li>Windows detectará automáticamente la impresora</li>
                <li>Instala el driver si Windows lo solicita</li>
                <li>Selecciona "USB Directo" en el método de conexión</li>
                <li>Haz una prueba de impresión</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">🖨️ Cargar papel térmico</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Abre la tapa superior de la impresora</li>
                <li>Inserta el rollo de papel térmico (80mm)</li>
                <li>El papel debe salir por la parte frontal</li>
                <li>Cierra la tapa hasta escuchar un clic</li>
                <li>La impresora alimentará el papel automáticamente</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">❌ ¿Por qué no imprime?</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verifica que el LED esté verde (no rojo parpadeante)</li>
                <li>Asegúrate de tener papel térmico cargado</li>
                <li>Revisa que el cable USB esté bien conectado</li>
                <li>Reinicia la impresora (apagar y encender)</li>
                <li>Verifica los drivers en "Dispositivos e impresoras"</li>
                <li>Prueba con otro puerto USB</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">⚙️ Drivers POS-5890U-L</p>
              <p className="ml-2">
                Si Windows no detecta la impresora automáticamente, descarga los drivers desde el sitio del fabricante.
                La impresora es compatible con drivers ESC/POS genéricos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
