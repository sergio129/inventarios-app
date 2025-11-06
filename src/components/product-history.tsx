'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Clock, User, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface AuditEntry {
  _id: string;
  usuarioEmail: string;
  usuarioNombre: string;
  tipoAccion: string;
  cambios: Array<{
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
  }>;
  detalles: string;
  fechaCreacion: string;
}

interface ProductHistoryProps {
  productoId: string;
}

const tipoAccionColores: Record<string, { bg: string; text: string; label: string }> = {
  actualizar: { bg: 'bg-blue-100', text: 'text-blue-700', label: '🔄 Actualizado' },
  crear: { bg: 'bg-green-100', text: 'text-green-700', label: '✨ Creado' },
  eliminar: { bg: 'bg-red-100', text: 'text-red-700', label: '🗑️ Eliminado' },
  importar: { bg: 'bg-purple-100', text: 'text-purple-700', label: '📥 Importado' },
};

const campoIconos: Record<string, string> = {
  stockCajas: '📦',
  stockUnidadesSueltas: '📄',
  precio: '💰',
  precioCompra: '💳',
  nombre: '📝',
  categoria: '🏷️',
  codigo: '🔢',
  codigoBarras: '🔲',
  marca: '🏢',
  descripcion: '📋',
};

export default function ProductHistory({ productoId }: ProductHistoryProps) {
  const [historial, setHistorial] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await fetch(`/api/products/${productoId}/audit`);
        if (response.ok) {
          const data = await response.json();
          setHistorial(data);
        } else {
          toast.error('Error al cargar historial');
        }
      } catch (error) {
        console.error('Error fetching historial:', error);
        toast.error('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (productoId) {
      fetchHistorial();
    }
  }, [productoId]);

  if (loading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3 text-blue-600">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="font-medium">Cargando historial...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (historial.length === 0) {
    return (
      <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-gray-500">
            <History className="h-12 w-12 text-gray-300" />
            <p className="font-medium">Sin cambios registrados</p>
            <p className="text-sm">Los cambios futuros aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 overflow-hidden shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <History className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              Historial de Cambios
            </CardTitle>
            <CardDescription className="text-indigo-100">
              {historial.length} cambio(s) registrado(s)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {historial.map((entry) => {
            const config = tipoAccionColores[entry.tipoAccion] || tipoAccionColores.actualizar;
            const isExpanded = expandedId === entry._id;
            const fecha = new Date(entry.fechaCreacion);
            const fechaFormato = fecha.toLocaleString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div
                key={entry._id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Header del cambio */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                  className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 flex items-center justify-between gap-3 text-left transition-colors"
                >
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    {/* Icono del tipo de acción */}
                    <div className={`${config.bg} ${config.text} px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap`}>
                      {config.label}
                    </div>

                    {/* Info del usuario */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <p className="font-semibold text-gray-900 truncate">
                          {entry.usuarioNombre}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{entry.usuarioEmail}</span>
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      <span>{fechaFormato}</span>
                    </div>
                  </div>

                  {/* Icono expandir/contraer */}
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {/* Contenido expandido */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                    {/* Detalles */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">{entry.detalles}</p>
                    </div>

                    {/* Cambios */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Cambios Realizados ({entry.cambios.length})
                      </p>
                      <div className="space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg">
                        {entry.cambios.map((cambio, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-lg">
                                {campoIconos[cambio.campo] || '📝'}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {cambio.campo}
                              </span>
                              <Badge variant="secondary" className="ml-auto text-xs">
                                Modificado
                              </Badge>
                            </div>

                            {/* Valor anterior */}
                            <div className="mb-2">
                              <p className="text-xs text-gray-600 font-medium mb-1">Antes:</p>
                              <div className="bg-red-50 border border-red-200 p-2 rounded font-mono text-xs text-red-700 line-through">
                                {JSON.stringify(cambio.valorAnterior) === 'null'
                                  ? '(vacío)'
                                  : JSON.stringify(cambio.valorAnterior)}
                              </div>
                            </div>

                            {/* Flecha */}
                            <div className="text-center text-gray-400 mb-2">
                              <span className="text-sm">→</span>
                            </div>

                            {/* Valor nuevo */}
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">Después:</p>
                              <div className="bg-green-50 border border-green-200 p-2 rounded font-mono text-xs text-green-700 font-bold">
                                {JSON.stringify(cambio.valorNuevo) === 'null'
                                  ? '(vacío)'
                                  : JSON.stringify(cambio.valorNuevo)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timestamp completo */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <p className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.fechaCreacion).toISOString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
