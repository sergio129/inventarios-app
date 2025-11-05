'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, ArrowLeft, Package, ShoppingCart, Users, DollarSign, Download } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel, formatSalesForExport } from '@/lib/excel-utils';

interface Stats {
  totalProductos: { value: string; change: number; changeType: string };
  ventasHoy: { value: string; change: number; changeType: string };
  usuariosActivos: { value: string; change: number; changeType: string };
  pedidosPendientes: { value: string; change: number; changeType: string };
}

interface SalesStats {
  period: string;
  data: any[];
  totals: {
    totalVentas: number;
    totalIngresos: number;
    totalDescuentos: number;
    totalImpuestos: number;
    ventasCompletadas: number;
    ventasCanceladas: number;
  };
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('day');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    fetchStats();
    fetchSalesStats();
  }, [session, status, router, period]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesStats = async () => {
    try {
      console.log('🔄 Fetching sales stats for period:', period);
      const response = await fetch(`/api/sales-stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sales stats received:', data);
        setSalesStats(data);
      } else {
        const error = await response.json();
        console.error('❌ API Error:', error);
        toast.error('Error al cargar estadísticas de ventas');
      }
    } catch (error) {
      console.error('❌ Error fetching sales stats:', error);
      toast.error('Error al cargar estadísticas de ventas');
    }
  };

  const handleExportToExcel = () => {
    if (!salesStats || !salesStats.data) {
      toast.error('No hay datos para exportar');
      return;
    }

    const formattedData = formatSalesForExport(salesStats.data);
    const periodName = {
      'day': 'ventas-por-dia',
      'week': 'ventas-por-semana',
      'month': 'ventas-por-mes',
      'year': 'ventas-por-año'
    }[period] || 'ventas';

    exportToExcel(formattedData, periodName);
    toast.success('Archivo descargado correctamente');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Reportes y Estadísticas
            </h1>
            <p className="text-gray-600 mt-1">Análisis de ventas y rendimiento</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Por Día</SelectItem>
                <SelectItem value="week">Por Semana</SelectItem>
                <SelectItem value="month">Por Mes</SelectItem>
                <SelectItem value="year">Por Año</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExportToExcel}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Excel
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Productos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProductos.value}</p>
                    <p className={`text-sm font-medium ${
                      stats.totalProductos.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.totalProductos.change >= 0 ? '+' : ''}{stats.totalProductos.change}%
                    </p>
                  </div>
                  <Package className="h-12 w-12 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Ventas del Período</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.ventasHoy.value}</p>
                    <p className={`text-sm font-medium ${
                      stats.ventasHoy.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.ventasHoy.change >= 0 ? '+' : ''}{stats.ventasHoy.change}%
                    </p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.usuariosActivos.value}</p>
                    <p className={`text-sm font-medium ${
                      stats.usuariosActivos.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.usuariosActivos.change >= 0 ? '+' : ''}{stats.usuariosActivos.change}%
                    </p>
                  </div>
                  <Users className="h-12 w-12 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pedidos Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pedidosPendientes.value}</p>
                    <p className={`text-sm font-medium ${
                      stats.pedidosPendientes.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.pedidosPendientes.change >= 0 ? '+' : ''}{stats.pedidosPendientes.change}%
                    </p>
                  </div>
                  <ShoppingCart className="h-12 w-12 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sales Stats Section */}
        {salesStats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{salesStats.totals.totalVentas}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">${salesStats.totals.totalIngresos.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Descuentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">${salesStats.totals.totalDescuentos.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Impuestos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">${salesStats.totals.totalImpuestos.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Completadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{salesStats.totals.ventasCompletadas}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Canceladas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{salesStats.totals.ventasCanceladas}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tasa Completación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {salesStats.totals.totalVentas > 0 
                      ? ((salesStats.totals.ventasCompletadas / salesStats.totals.totalVentas) * 100).toFixed(1)
                      : '0'
                    }%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle>Detalles de Ventas</CardTitle>
                <CardDescription>
                  Análisis detallado por {period === 'day' ? 'hora' : period === 'week' ? 'día' : period === 'month' ? 'día' : 'mes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 bg-gray-50">
                        <TableHead className="font-semibold">
                          {period === 'day' ? 'Hora' : period === 'week' ? 'Día' : period === 'month' ? 'Fecha' : 'Mes'}
                        </TableHead>
                        <TableHead className="text-right font-semibold">Ventas</TableHead>
                        <TableHead className="text-right font-semibold">Ingresos</TableHead>
                        <TableHead className="text-right font-semibold">Descuentos</TableHead>
                        <TableHead className="text-right font-semibold">Impuestos</TableHead>
                        <TableHead className="text-right font-semibold">Completadas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesStats.data && salesStats.data.length > 0 ? (
                        salesStats.data.map((row: any, idx: number) => {
                          let dateStr = '';
                          if (typeof row._id === 'string') {
                            dateStr = row._id;
                          } else {
                            dateStr = new Date(row._id).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }
                          return (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{dateStr}</TableCell>
                              <TableCell className="text-right">{row.count}</TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">${row.totalIngresos.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-orange-600">${row.totalDescuentos.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-purple-600">${row.totalImpuestos.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-blue-600 font-semibold">{row.completadas}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hay datos disponibles para el período seleccionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-lg">Historial de Ventas</CardTitle>
              <CardDescription>
                Consultar todas las ventas realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push('/sales')}
              >
                Ver Ventas
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-lg">Reporte de Inventario</CardTitle>
              <CardDescription>
                Estado actual del stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => router.push('/inventory')}
              >
                Ver Inventario
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-lg">Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administrar usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => router.push('/admin/users')}
              >
                Ver Usuarios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
