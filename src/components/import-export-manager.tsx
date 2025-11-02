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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar inventario');
      }

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
    } catch (error) {
      console.error('Error al importar:', error);
      toast.error((error as Error).message || 'Error al importar el inventario');
    } finally {
      setIsImporting(false);
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
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
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
                className="cursor-pointer block"
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
              onClick={() => setIsImportDialogOpen(false)}
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
