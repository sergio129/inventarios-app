'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SalesKeyboardHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ALT + H para abrir ayuda en módulo de ventas
      if (event.altKey && event.key === 'h') {
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
          <h2 className="text-2xl font-bold text-gray-900">Atajos de Ventas (ALT+H)</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Acciones principales */}
          <section>
            <h3 className="text-lg font-semibold text-green-600 mb-3">Acciones Principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'C', desc: 'Calcular total' },
                { key: 'P', desc: 'Procesar pago' },
                { key: 'D', desc: 'Aplicar descuento' },
                { key: 'E', desc: 'Seleccionar cliente' },
                { key: 'N', desc: 'Nuevo cliente' },
                { key: 'X', desc: 'Eliminar último ítem' },
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

          {/* Métodos de Pago */}
          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">Métodos de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: '1', desc: 'Efectivo' },
                { key: '2', desc: 'Tarjeta de crédito/débito' },
                { key: '3', desc: 'Transferencia bancaria' },
                { key: '4', desc: 'Cheque' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-sm font-mono font-semibold">
                    {key}
                  </kbd>
                  <span className="text-gray-700">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Búsqueda y Cantidad */}
          <section>
            <h3 className="text-lg font-semibold text-purple-600 mb-3">Búsqueda y Cantidad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'CTRL+F', desc: 'Enfocar búsqueda de productos' },
                { key: 'ENTER', desc: 'Agregar producto/confirmar' },
                { key: 'CTRL+X', desc: 'Vaciar carrito (con confirmación)' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-purple-100 border border-purple-300 rounded text-sm font-mono font-semibold">
                    {key}
                  </kbd>
                  <span className="text-gray-700">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tips */}
          <section className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong className="text-green-700">💡 Tips:</strong> Después de agregar un producto, puedes escribir inmediatamente la cantidad y presionar ENTER para confirmar. Ejemplo: escanea código → ENTER → 5 → ENTER
            </p>
          </section>

          {/* Fase 3 - Accesos Avanzados */}
          <section className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">🚀 Fase 3 - Accesos Avanzados</h4>
            <p className="text-sm text-gray-700 mb-3">
              Nuevos atajos para descuentos rápidos, clientes frecuentes y reportes.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'SHIFT+1-4', desc: 'Descuentos rápidos (5%-20%)' },
                { key: 'CTRL+ALT+K', desc: 'Modal de accesos avanzados' },
                { key: 'CTRL+SHIFT+1-4', desc: 'Abrir reportes' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-purple-300 rounded text-xs font-mono">
                    {key}
                  </kbd>
                  <span className="text-gray-600">{desc}</span>
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
