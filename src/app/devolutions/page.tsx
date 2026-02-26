'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, RotateCcw, Package, Search } from 'lucide-react';
import { ReturnsComponent } from '@/components/returns-component';
import { toast } from 'sonner';

interface Return {
  _id: string;
  numeroFacturaOriginal: string;
  cliente?: {
    nombre: string;
    cedula?: string;
  };
  items: Array<{
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    precioTotal: number;
  }>;
  montoDevuelto: number;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaDevolucion: Date;
  vendedor?: {
    name: string;
  };
}

export default function DevolutionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    fetchReturns();
  }, [session, status, router]);

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/returns');
      if (response.ok) {
        const data = await response.json();
        setReturns(Array.isArray(data) ? data : []);
      } else {
        toast.error('Error al cargar devoluciones');
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Error de conexión');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = returns;

    if (searchTerm) {
      filtered = filtered.filter(ret =>
        ret.numeroFacturaOriginal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.cliente?.cedula?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ret => ret.estado === statusFilter);
    }

    setFilteredReturns(filtered);
  }, [returns, searchTerm, statusFilter]);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return 'default' as const;
      case 'pendiente':
        return 'secondary' as const;
      case 'rechazada':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return 'Aprobada';
      case 'pendiente':
        return 'Pendiente';
      case 'rechazada':
        return 'Rechazada';
      default:
        return estado;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 -z-10" />

      <div className="container mx-auto px-6 py-8 relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl shadow-lg">
                  <RotateCcw className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Devoluciones
                  </h1>
                  <p className="text-gray-600 text-lg">Gestión de devoluciones y cambios</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => router.push('/sales')}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Ventas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Nueva Devolución */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-red-600" />
                Nueva Devolución
              </CardTitle>
              <CardDescription className="text-gray-600">
                Registra devoluciones de productos desde ventas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReturnsComponent />
            </CardContent>
          </Card>

          {/* Historial de Devoluciones */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Historial de Devoluciones
              </CardTitle>
              <CardDescription className="text-gray-600">
                Todas las devoluciones registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por factura, cliente o cédula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-gray-400"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobada">Aprobadas</option>
                  <option value="rechazada">Rechazadas</option>
                </select>
              </div>

              {filteredReturns.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Factura Original</TableHead>
                        <TableHead className="font-semibold">Cliente</TableHead>
                        <TableHead className="font-semibold">Monto</TableHead>
                        <TableHead className="font-semibold">Motivo</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReturns.map((ret) => (
                        <TableRow key={ret._id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-mono text-sm">
                            {ret.numeroFacturaOriginal}
                          </TableCell>
                          <TableCell className="text-sm">
                            {ret.cliente?.nombre || 'Sin cliente'}
                            {ret.cliente?.cedula && (
                              <p className="text-xs text-gray-500">{ret.cliente.cedula}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-red-600">
                            ${ret.montoDevuelto?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {ret.motivo}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(ret.estado)}>
                              {getStatusLabel(ret.estado)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(ret.fechaDevolucion).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No se encontraron devoluciones'
                      : 'No hay devoluciones registradas'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
