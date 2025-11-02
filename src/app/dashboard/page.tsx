'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  LogOut,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const modules = [
    {
      title: 'Inventario',
      description: 'Gestionar medicamentos y stock',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      action: () => router.push('/inventory'),
      available: true
    },
    {
      title: 'Ventas',
      description: 'Procesar ventas y facturas',
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      action: () => router.push('/sales'),
      available: true
    },
    {
      title: 'Reportes',
      description: 'Ver estadísticas y análisis',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      action: () => router.push('/reports'),
      available: true
    },
    {
      title: 'Usuarios',
      description: 'Gestionar usuarios del sistema',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      action: () => router.push('/admin/users'),
      available: (session?.user as { role?: string })?.role === 'admin'
    }
  ];

  const [stats, setStats] = useState([
    {
      title: 'Total Productos',
      value: '0',
      change: 0,
      changeType: 'positive' as const,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Ventas Hoy',
      value: '$0',
      change: 0,
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Usuarios Activos',
      value: '0',
      change: 0,
      changeType: 'positive' as const,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Pedidos Pendientes',
      value: '0',
      change: 0,
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'text-orange-600'
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats([
          {
            title: 'Total Productos',
            value: data.totalProductos.value,
            change: data.totalProductos.change,
            changeType: data.totalProductos.changeType,
            icon: Package,
            color: 'text-blue-600'
          },
          {
            title: 'Ventas Hoy',
            value: data.ventasHoy.value,
            change: data.ventasHoy.change,
            changeType: data.ventasHoy.changeType,
            icon: TrendingUp,
            color: 'text-green-600'
          },
          {
            title: 'Usuarios Activos',
            value: data.usuariosActivos.value,
            change: data.usuariosActivos.change,
            changeType: data.usuariosActivos.changeType,
            icon: Users,
            color: 'text-purple-600'
          },
          {
            title: 'Pedidos Pendientes',
            value: data.pedidosPendientes.value,
            change: data.pedidosPendientes.change,
            changeType: data.pedidosPendientes.changeType,
            icon: ShoppingCart,
            color: 'text-orange-600'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats_old = [
    {
      title: 'Total Productos',
      value: '1,234',
      change: '+12%',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Ventas Hoy',
      value: '$2,450',
      change: '+8%',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Usuarios Activos',
      value: '89',
      change: '+5%',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Pedidos Pendientes',
      value: '12',
      change: '-2%',
      icon: ShoppingCart,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Bienvenido a Inventarios-app!
              </h1>
              <p className="text-blue-100 text-lg">
                Sistema de gestión de inventario para comidas rápidas
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-4 py-2">
                <User className="h-5 w-5" />
                <span className="font-medium">{session?.user?.name}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                  {(((session?.user as { role?: string })?.role === 'admin') ? 'Admin' : 'Vendedor')}
                </span>
              </div>
              <Button
                onClick={() => signOut({ callbackUrl: '/login' })}
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                      ) : (
                        `${stat.change >= 0 ? '+' : ''}${stat.change}% vs ayer`
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color.replace('text-', 'from-').replace('text-', 'to-')} bg-opacity-10`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Módulos del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, index) => {
              if (!module.available) return null;

              const IconComponent = module.icon;

              return (
                <Card
                  key={index}
                  className={`bg-gradient-to-br ${module.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden relative`}
                  onClick={module.action}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      className={`w-full bg-gradient-to-r ${module.color} hover:opacity-90 text-white border-0 group-hover:shadow-lg transition-all duration-300`}
                      onClick={(e) => {
                        e.stopPropagation();
                        module.action();
                      }}
                    >
                      Acceder
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
              <Calendar className="h-6 w-6 mr-2 text-blue-600" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                onClick={() => router.push('/inventory')}
              >
                <Package className="h-8 w-8 text-blue-600" />
                <span className="font-medium">Nuevo Producto</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200 transition-colors"
                onClick={() => router.push('/sales')}
              >
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <span className="font-medium">Nueva Venta</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                onClick={() => router.push('/reports')}
              >
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <span className="font-medium">Ver Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
