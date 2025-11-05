'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminConfigPanel } from '@/components/admin-config-panel';
import { CompanyConfig } from '@/hooks/useCompanyConfig';

export default function AdminConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Check if user is admin
      const userRole = (session.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/unauthorized');
        return;
      }

      fetchConfig();
    }
  }, [status, session, router]);

  const getDefaultConfig = (): CompanyConfig => ({
    _id: '',
    nombreEmpresa: '',
    logo: undefined,
    labels: {
      nombreApp: 'inventarios-app',
      subtitulo: 'Sistema de Gestión',
      modulo_inventario: 'Inventario',
      modulo_ventas: 'Ventas',
      modulo_usuarios: 'Usuarios',
      modulo_reportes: 'Reportes',
      modulo_categorias: 'Categorías',
      factura_titulo: 'Factura',
      factura_numero: 'Factura',
      factura_fecha: 'Fecha',
      factura_estado: 'Estado',
      factura_vendedor: 'Vendedor',
      factura_cliente: 'Cliente',
      factura_productos: 'Productos',
      factura_cantidad: 'Cantidad',
      factura_precio_unitario: 'Precio Unitario',
      factura_total: 'Total',
      factura_subtotal: 'Subtotal',
      factura_descuento: 'Descuento',
      factura_impuesto: 'Impuesto',
      factura_metodo_pago: 'Método de Pago',
      producto_nombre: 'Nombre',
      producto_descripcion: 'Descripción',
      producto_precio: 'Precio',
      producto_stock: 'Stock',
      producto_categoria: 'Categoría',
      producto_codigo: 'Código',
      boton_guardar: 'Guardar',
      boton_cancelar: 'Cancelar',
      boton_eliminar: 'Eliminar',
      boton_editar: 'Editar',
      boton_agregar: 'Agregar',
      boton_crear: 'Crear',
    },
    colores: {
      primario: '#3b82f6',
      secundario: '#6b7280',
      exito: '#10b981',
      peligro: '#ef4444',
      advertencia: '#f59e0b',
      informacion: '#0ea5e9',
    },
    informacion: {
      razonSocial: '',
      nit: '',
      direccion: '',
      telefono: '',
      email: '',
      ciudad: '',
      pais: '',
      sitioWeb: '',
    },
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/config');
      
      if (response.status === 404) {
        // No config exists, load defaults
        setConfig(getDefaultConfig());
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar la configuración');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Redirect handled in useEffect
  }

  if ((session?.user as any)?.role !== 'admin') {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
          <p className="text-gray-600 mt-2">Gestiona la configuración y branding de tu empresa</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchConfig}
              className="mt-2 text-red-600 hover:text-red-800 underline text-sm font-semibold"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Admin Config Panel */}
        {config && (
          <AdminConfigPanel 
            config={config}
            onSave={(updatedConfig) => {
              setConfig(updatedConfig);
            }}
          />
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Necesitas ayuda?</h3>
          <p className="text-blue-800 text-sm">
            Aquí puedes personalizar todos los textos, colores e información de tu empresa. 
            Los cambios se aplicarán automáticamente en toda la aplicación.
          </p>
        </div>
      </div>
    </div>
  );
}
