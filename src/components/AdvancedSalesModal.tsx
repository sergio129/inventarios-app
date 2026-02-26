'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, User, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FrequentClient {
  _id: string;
  nombre: string;
  cedula?: string;
  telefono?: string;
  purchaseCount: number;
  totalSpent: number;
  lastPurchase: string;
}

interface QuickDiscount {
  label: string;
  percentage: number;
  key: string;
}

export function AdvancedSalesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clientes' | 'descuentos' | 'reportes'>('clientes');
  const [frequentClients, setFrequentClients] = useState<FrequentClient[]>([]);
  const [loading, setLoading] = useState(false);

  const quickDiscounts: QuickDiscount[] = [
    { label: '5%', percentage: 5, key: 'shift+1' },
    { label: '10%', percentage: 10, key: 'shift+2' },
    { label: '15%', percentage: 15, key: 'shift+3' },
    { label: '20%', percentage: 20, key: 'shift+4' },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // CTRL + ALT + K para abrir modal de accesos avanzados
      if (event.ctrlKey && event.altKey && event.key === 'k') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const fetchFrequentClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients?top=10&sortBy=purchaseCount');
      if (response.ok) {
        const data = await response.json();
        setFrequentClients(data);
      }
    } catch (error) {
      console.error('Error fetching frequent clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'clientes' && frequentClients.length === 0) {
      fetchFrequentClients();
    }
  }, [isOpen, activeTab, frequentClients.length, fetchFrequentClients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Accesos Rápidos (CTRL+ALT+K)</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b sticky top-16 bg-white flex gap-0">
          {[
            { id: 'clientes', label: 'Clientes Frecuentes', icon: User },
            { id: 'descuentos', label: 'Descuentos Rápidos', icon: TrendingUp },
            { id: 'reportes', label: 'Historial', icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Clientes Frecuentes */}
          {activeTab === 'clientes' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Los 10 clientes más frecuentes. Haz clic para seleccionar.
              </p>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : frequentClients.length > 0 ? (
                frequentClients.map((client) => (
                  <div
                    key={client._id}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{client.nombre}</p>
                        {client.cedula && (
                          <p className="text-sm text-gray-600">Cédula: {client.cedula}</p>
                        )}
                        {client.telefono && (
                          <p className="text-sm text-gray-600">Teléfono: {client.telefono}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          {client.purchaseCount} compras
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          Última: {new Date(client.lastPurchase).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay clientes registrados aún</p>
              )}
            </div>
          )}

          {/* Descuentos Rápidos */}
          {activeTab === 'descuentos' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Descuentos predefinidos. Úsalos con los atajos de teclado.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickDiscounts.map(({ label, percentage, key }) => (
                  <div
                    key={percentage}
                    className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">{label}</p>
                      <p className="text-xs text-gray-600 mt-2">Descuento</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {key}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-amber-900">
                  <strong>💡 Uso:</strong> Presiona el atajo del descuento para aplicarlo automáticamente al carrito actual.
                </p>
              </div>
            </div>
          )}

          {/* Reportes/Historial */}
          {activeTab === 'reportes' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Acceso rápido a reportes y análisis de ventas.
              </p>
              {[
                { 
                  title: 'Últimas Ventas (Hoy)', 
                  desc: 'Ver todas las ventas del día actual',
                  key: 'CTRL+SHIFT+1'
                },
                { 
                  title: 'Comparativa Semanal', 
                  desc: 'Análisis de ventas de esta semana',
                  key: 'CTRL+SHIFT+2'
                },
                { 
                  title: 'Top Productos', 
                  desc: 'Productos más vendidos',
                  key: 'CTRL+SHIFT+3'
                },
                { 
                  title: 'Análisis de Clientes', 
                  desc: 'Segmentación y comportamiento',
                  key: 'CTRL+SHIFT+4'
                },
              ].map(({ title, desc, key }) => (
                <div
                  key={title}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {key}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50 flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="ml-auto">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
