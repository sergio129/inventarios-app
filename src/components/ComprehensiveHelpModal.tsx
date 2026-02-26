'use client';

import { useState } from 'react';
import { X, Book, Keyboard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function ComprehensiveHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('navigation');

  if (!isOpen) return null;

  const sections: HelpSection[] = [
    {
      id: 'navigation',
      title: 'Navegación Principal',
      icon: <Keyboard className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Navegación Principal (F1-F12)</h3>
          <div className="space-y-3">
            {[
              { key: 'F1', module: 'Ayuda', desc: 'Abre el manual de atajos' },
              { key: 'F2', module: 'Ventas', desc: 'Módulo de ventas (PRINCIPAL)' },
              { key: 'F3', module: 'Devoluciones', desc: 'Módulo de devoluciones y cambios' },
              { key: 'F4', module: 'Inventario', desc: 'Gestión de productos' },
              { key: 'F5', module: 'Reportes', desc: 'Reportes y estadísticas' },
              { key: 'F6', module: 'Clientes', desc: 'Gestión de clientes' },
            ].map(({ key, module, desc }) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Badge className="bg-blue-600 text-white font-mono">{key}</Badge>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{module}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'sales',
      title: 'Módulo de Ventas',
      icon: <Zap className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Atajos de Ventas (F2)</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Acciones Principales</h4>
              {[
                { key: 'SHIFT+C', desc: 'Calcular total' },
                { key: 'SHIFT+P', desc: 'Procesar pago' },
                { key: 'SHIFT+D', desc: 'Aplicar descuento' },
                { key: 'SHIFT+E', desc: 'Seleccionar cliente' },
                { key: 'SHIFT+N', desc: 'Nuevo cliente' },
                { key: 'SHIFT+X', desc: 'Eliminar último ítem' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-3 p-2 text-sm">
                  <Badge className="bg-green-600 text-white font-mono whitespace-nowrap">{key}</Badge>
                  <span>{desc}</span>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2 mt-4">Métodos de Pago</h4>
              {[
                { key: 'ALT+1', desc: 'Efectivo' },
                { key: 'ALT+2', desc: 'Tarjeta de crédito/débito' },
                { key: 'ALT+3', desc: 'Transferencia bancaria' },
                { key: 'ALT+4', desc: 'Cheque' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-3 p-2 text-sm">
                  <Badge className="bg-blue-600 text-white font-mono whitespace-nowrap">{key}</Badge>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-900">
              <strong>💡 Flujo de Venta Rápida:</strong><br/>
              1. Escanea código → ENTER<br/>
              2. Ingresa cantidad → ENTER<br/>
              3. SHIFT+C (Calcular)<br/>
              4. SHIFT+E (Seleccionar cliente)<br/>
              5. SHIFT+P (Pagar) → ALT+1-4 (Método)
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'advanced',
      title: 'Atajos Avanzados',
      icon: <Book className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Atajos Avanzados</h3>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Descuentos Rápidos</h4>
            {[
              { key: 'ALT+SHIFT+1', desc: 'Descuento 5%' },
              { key: 'ALT+SHIFT+2', desc: 'Descuento 10%' },
              { key: 'ALT+SHIFT+3', desc: 'Descuento 15%' },
              { key: 'ALT+SHIFT+4', desc: 'Descuento 20%' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-center gap-3 p-2 text-sm">
                <Badge className="bg-purple-600 text-white font-mono whitespace-nowrap">{key}</Badge>
                <span>{desc}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 mt-4">Reportes</h4>
            {[
              { key: 'CTRL+ALT+1', desc: 'Reporte diario' },
              { key: 'CTRL+ALT+2', desc: 'Reporte semanal' },
              { key: 'CTRL+ALT+3', desc: 'Productos más vendidos' },
              { key: 'CTRL+ALT+4', desc: 'Análisis de clientes' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-center gap-3 p-2 text-sm">
                <Badge className="bg-indigo-600 text-white font-mono whitespace-nowrap">{key}</Badge>
                <span>{desc}</span>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-green-900">
              <strong>🎛️ Acceso Rápido:</strong><br/>
              Presiona <Badge className="bg-indigo-600 text-white text-xs">CTRL+ALT+K</Badge> para abrir el modal de accesos avanzados
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'modules',
      title: 'Por Módulo',
      icon: <Zap className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Devoluciones (F3)</h4>
            <div className="space-y-2 text-sm">
              <p>• <strong>ENTER</strong> - Buscar ticket</p>
              <p>• <strong>C</strong> - Marcar como cambio</p>
              <p>• <strong>R</strong> - Marcar como reembolso</p>
              <p>• <strong>P</strong> - Procesar devolución</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 mt-4">Inventario (F4)</h4>
            <div className="space-y-2 text-sm">
              <p>• <strong>ENTER</strong> - Buscar producto</p>
              <p>• <strong>+</strong> - Nuevo producto</p>
              <p>• <strong>E</strong> - Editar</p>
              <p>• <strong>I</strong> - Importar Excel</p>
              <p>• <strong>X</strong> - Exportar Excel</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 mt-4">Clientes (F6)</h4>
            <div className="space-y-2 text-sm">
              <p>• <strong>ENTER</strong> - Buscar cliente</p>
              <p>• <strong>+</strong> - Nuevo cliente</p>
              <p>• <strong>E</strong> - Editar cliente</p>
              <p>• <strong>H</strong> - Ver historial</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'general',
      title: 'Controles Generales',
      icon: <Keyboard className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Controles Generales en Cualquier Pantalla</h3>
          
          <div className="space-y-3">
            {[
              { key: 'ESC', desc: 'Cancelar/Atrás' },
              { key: 'ENTER', desc: 'Confirmar/Buscar' },
              { key: 'TAB', desc: 'Siguiente campo' },
              { key: 'SHIFT+TAB', desc: 'Campo anterior' },
              { key: 'CTRL+F', desc: 'Búsqueda rápida' },
              { key: 'CTRL+S', desc: 'Guardar cambios' },
              { key: 'CTRL+Z', desc: 'Deshacer' },
              { key: 'CTRL+Y', desc: 'Rehacer' },
              { key: 'ALT+H', desc: 'Esta ayuda en Ventas' },
              { key: 'CTRL+ALT+K', desc: 'Modal avanzado' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Badge className="bg-gray-700 text-white font-mono whitespace-nowrap">{key}</Badge>
                <span className="text-gray-700">{desc}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900">
              <strong>✅ Tips Importantes:</strong><br/>
              • Los números libres (0-9) se usan para entrada de datos<br/>
              • Las letras con SHIFT no interfieren con búsquedas<br/>
              • ALT+números para métodos de pago y reportes
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Book className="h-8 w-8" />
            <div>
              <h2 className="text-3xl font-bold">Manual Completo de Atajos</h2>
              <p className="text-blue-100 mt-1">Inventarios POS - Sistema de Ventas Rápido</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b sticky top-20 bg-white flex gap-0 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === section.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {section.icon}
              {section.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {sections.find((s) => s.id === activeTab)?.content}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6 rounded-b-xl flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <strong>Última actualización:</strong> 26 de febrero de 2026 | <strong>Versión:</strong> 1.0
          </p>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
