'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
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

export default function ProductHistory({ productoId }: ProductHistoryProps) {
  const [historial, setHistorial] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="p-4 text-center text-gray-500">
        Cargando historial...
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No hay cambios registrados para este producto
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Cambios
        </CardTitle>
        <CardDescription>
          Últimas {historial.length} actualización(es) del producto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {historial.map((entry) => (
            <div
              key={entry._id}
              className="border-l-4 border-blue-500 pl-4 py-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{entry.usuarioNombre}</p>
                  <p className="text-sm text-gray-500">{entry.usuarioEmail}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {entry.tipoAccion.charAt(0).toUpperCase() + entry.tipoAccion.slice(1)}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-2">{entry.detalles}</p>

              <div className="text-xs space-y-1">
                {entry.cambios.map((cambio, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-2 rounded font-mono"
                  >
                    <span className="font-semibold text-gray-700">
                      {cambio.campo}:
                    </span>
                    <div className="ml-2 text-gray-600">
                      <span className="line-through">{JSON.stringify(cambio.valorAnterior)}</span>
                      {' → '}
                      <span className="font-semibold">{JSON.stringify(cambio.valorNuevo)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                {new Date(entry.fechaCreacion).toLocaleString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
