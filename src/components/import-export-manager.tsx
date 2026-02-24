'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportExportManagerProps {
  onImportSuccess?: () => void;
  isAdmin?: boolean;
}

export default function ImportExportManager({ onImportSuccess, isAdmin = false }: ImportExportManagerProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<any>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Solo mostrar si es admin
  if (!isAdmin) {
    return null;
  }

  const handleExportInventory = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/products/export');

      if (!response.ok) {
        throw new Error('Error al descargar el inventario');
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Inventario exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar el inventario');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportInventory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);

      // Usar fetch con streaming para SSE
      const response = await fetch('/api/products/import-stream', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al importar inventario');
      }

      if (!response.body) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // Leer el stream como eventos SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1]; // Guardar línea incompleta

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();

          if (line.startsWith('event:')) {
            const eventType = line.replace('event:', '').trim();
            const dataLine = lines[++i]?.trim() || '';

            if (dataLine.startsWith('data:')) {
              const eventData = dataLine.replace('data:', '').trim();

              try {
                const data = JSON.parse(eventData);

                if (eventType === 'start') {
                  setImportProgress(0);
                } else if (eventType === 'progress') {
                  setImportProgress(Math.min(data.progress, 99));
                } else if (eventType === 'complete') {
                  setImportProgress(100);
                  setImportErrors(data.errors || []);
                  setImportResults(data);
                  setIsResultsDialogOpen(true);

                  if (data.successCount.created > 0 || data.successCount.updated > 0) {
                    toast.success(data.message);
                    if (onImportSuccess) {
                      onImportSuccess();
                    }
                  }

                  if (data.errors && data.errors.length > 0) {
                    toast.warning(`Importación completada con ${data.errors.length} errores`);
                  }

                  setIsImportDialogOpen(false);
                } else if (eventType === 'error') {
                  toast.error(data.error || 'Error al importar inventario');
                  setImportProgress(0);
                }
              } catch (parseError) {
                console.error('Error al parsear evento SSE:', parseError, eventData);
              }
            }
          }
        }
      }

      setIsImporting(false);
    } catch (error) {
      console.error('Error al importar:', error);
      toast.error((error as Error).message || 'Error al importar el inventario');
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Botón Exportar */}
      <Button
        onClick={handleExportInventory}
        disabled={isExporting}
        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        title="Descargar el inventario actual en formato Excel"
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Descargando...' : 'Exportar Excel'}
      </Button>

      {/* Botón Importar */}
      <Dialog 
        open={isImportDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Resetear cuando se cierre el diálogo
            setImportProgress(0);
            if (!isImporting) {
              setIsImportDialogOpen(false);
            }
          } else {
            setIsImportDialogOpen(open);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            title="Cargar productos desde un archivo Excel"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Inventario</DialogTitle>
            <DialogDescription>
              Selecciona un archivo Excel con el formato correcto para importar o actualizar productos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barra de Progreso */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Importando archivo...</span>
                  <span className="text-gray-600 font-semibold">{importProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-sm">
                  <div
                    className="bg-linear-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out shadow-lg"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {importProgress < 50 ? 'Cargando archivo...' : 'Procesando productos...'}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <strong>Instrucciones:</strong>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>Descarga primero el inventario actual</li>
                    <li>Modifica o agrega filas mantiendo el formato</li>
                    <li>Los productos se crearán o actualizarán según su código</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportInventory}
                disabled={isImporting}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className={`cursor-pointer block ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium">
                  {isImporting ? 'Importando...' : 'Haz clic para seleccionar archivo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">o arrastra el archivo aquí</p>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setTimeout(() => setImportProgress(0), 300);
                setIsImporting(false);
              }}
              disabled={isImporting}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resultados */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados de la Importación</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Productos Creados</p>
                <p className="text-2xl font-bold text-green-900">{importResults?.successCount?.created || 0}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Productos Actualizados</p>
                <p className="text-2xl font-bold text-blue-900">{importResults?.successCount?.updated || 0}</p>
              </div>
            </div>

            {/* Errores */}
            {importResults?.errors && importResults.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-700 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <strong>Errores encontrados ({importResults.errors.length}):</strong>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1 max-h-48 overflow-y-auto">
                      {importResults.errors.map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Resultados */}
            {importResults?.results && importResults.results.length > 0 && (
              <div>
                <strong className="text-sm">Primeros resultados:</strong>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {importResults.results.map((result: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded text-sm flex items-center gap-2">
                      {result.accion === 'creado' ? (
                        <div className="text-green-600">✓ Creado:</div>
                      ) : (
                        <div className="text-blue-600">↻ Actualizado:</div>
                      )}
                      <span>{result.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsResultsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
