'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KeyboardHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Atajos de Teclado (F1)</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Navegación Principal */}
          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">Navegación Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'F2', desc: 'Módulo de Ventas' },
                { key: 'F3', desc: 'Módulo de Devoluciones' },
                { key: 'F4', desc: 'Módulo de Inventario' },
                { key: 'F5', desc: 'Módulo de Reportes' },
                { key: 'F6', desc: 'Módulo de Clientes' },
                { key: 'F1', desc: 'Ayuda (Este modal)' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono font-semibold">
                    {key}
                  </kbd>
                  <span className="text-gray-700">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Controles Generales */}
          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">Controles Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'ESC', desc: 'Cancelar/Atrás' },
                { key: 'ENTER', desc: 'Confirmar/Buscar' },
                { key: 'TAB', desc: 'Siguiente campo' },
                { key: 'SHIFT+TAB', desc: 'Campo anterior' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono font-semibold">
                    {key}
                  </kbd>
                  <span className="text-gray-700">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Atajos de Ventas */}
          <section>
            <h3 className="text-lg font-semibold text-purple-600 mb-3">Atajos de Ventas (ALT+H para más info)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'C', desc: 'Calcular total' },
                { key: 'P', desc: 'Procesar pago' },
                { key: 'D', desc: 'Aplicar descuento' },
                { key: 'E', desc: 'Seleccionar cliente' },
                { key: 'N', desc: 'Nuevo cliente' },
                { key: 'X', desc: 'Eliminar último item' },
                { key: 'CTRL+X', desc: 'Limpiar carrito' },
                { key: 'CTRL+F', desc: 'Buscar productos' },
                { key: '1-4', desc: 'Métodos de pago' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-purple-100 border border-purple-300 rounded text-sm font-mono font-semibold text-purple-700">
                    {key}
                  </kbd>
                  <span className="text-gray-700">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Búsqueda de productos - nota especial */}
          <section className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip de Búsqueda:</strong> Cuando buscas un producto por nombre o código, si hay solo 1 resultado, presiona <kbd className="px-1 py-0.5 bg-green-200 rounded text-xs font-mono font-semibold">ENTER</kbd> para agregarlo automáticamente al carrito.
            </p>
          </section>

          {/* Atajos Avanzados */}
          <section>
            <h3 className="text-lg font-semibold text-indigo-600 mb-3">Atajos Avanzados (CTRL+ALT+K)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'SHIFT+1', desc: 'Descuento 5%' },
                { key: 'SHIFT+2', desc: 'Descuento 10%' },
                { key: 'SHIFT+3', desc: 'Descuento 15%' },
                { key: 'SHIFT+4', desc: 'Descuento 20%' },
                { key: 'CTRL+SHIFT+1', desc: 'Reporte diario' },
                { key: 'CTRL+SHIFT+2', desc: 'Reporte semanal' },
                { key: 'CTRL+SHIFT+3', desc: 'Productos top' },
                { key: 'CTRL+SHIFT+4', desc: 'Análisis clientes' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-indigo-100 border border-indigo-300 rounded text-sm font-mono font-semibold text-indigo-700">
                    {key}
                  </kbd>
                  <span className="text-gray-700">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex gap-2">
            <Button onClick={() => setIsOpen(false)} className="ml-auto">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
