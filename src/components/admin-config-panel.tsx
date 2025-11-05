'use client';

import React, { useState, useEffect } from 'react';
import { CompanyConfig, useCompanyConfig } from '@/hooks/useCompanyConfig';
import { toast } from 'sonner';

interface AdminConfigProps {
  config?: CompanyConfig;
  onSave?: (config: CompanyConfig) => void;
}

export const AdminConfigPanel: React.FC<AdminConfigProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Usar el hook para poder refetch después de guardar
  const { refetch } = useCompanyConfig();

  useEffect(() => {
    if (config) {
      // Asegurar que siempre tenga todos los campos, aunque falten en la BD
      const ensureFields = (obj: any, template: any): any => {
        if (!obj) obj = {};
        const result = { ...template, ...obj };
        
        // Para objetos anidados (labels, colores, informacion)
        for (const key in template) {
          if (typeof template[key] === 'object' && !Array.isArray(template[key])) {
            result[key] = ensureFields(obj[key], template[key]);
          }
        }
        return result;
      };

      const defaultFormData = {
        nombreEmpresa: '',
        logo: '',
        labels: {
          nombreApp: 'inventarios-app',
          subtitulo: 'Sistema de Gestión',
          bienvenida_titulo: '¡Bienvenido!',
          bienvenida_subtitulo: 'Bienvenido al sistema',
          dashboard_total_productos: 'Total Productos',
          dashboard_ventas_hoy: 'Ventas Hoy',
          dashboard_usuarios_activos: 'Usuarios Activos',
          dashboard_pedidos_pendientes: 'Pedidos Pendientes',
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
        _id: '',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      };

      const completeConfig = ensureFields(config, defaultFormData);
      setFormData(completeConfig);
    }
  }, [config]);

  const handleInputChange = (path: string, value: any) => {
    if (!formData) return;

    const keys = path.split('.');
    const newFormData = JSON.parse(JSON.stringify(formData));
    
    let current = newFormData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setFormData(newFormData);
  };

  const handleSave = async () => {
    if (!formData) return;

    // Validar que el nombre de empresa no esté vacío
    if (!formData.nombreEmpresa || formData.nombreEmpresa.trim() === '') {
      toast.error('El nombre de la empresa es requerido');
      return;
    }

    try {
      setLoading(true);
      setSaveSuccess(false);

      // Determinar si es creación o actualización
      const isUpdate = formData._id && formData._id.trim() !== '';
      
      let url: string;
      let method: string;
      let dataToSend: any;

      if (isUpdate) {
        // Update: usar el endpoint con ID en la URL
        url = `/api/admin/config/${formData._id}`;
        method = 'PUT';
        
        // Preparar datos para actualización: incluye TODOS los campos
        dataToSend = {
          nombreEmpresa: formData.nombreEmpresa,
          logo: formData.logo || '',
          labels: formData.labels || {},
          colores: formData.colores || {},
          informacion: formData.informacion || {},
          activo: formData.activo,
          _id: formData._id,
          fechaCreacion: formData.fechaCreacion,
          fechaActualizacion: formData.fechaActualizacion,
        };
      } else {
        // Create: usar el endpoint general sin ID
        url = '/api/admin/config';
        method = 'POST';
        
        // Para creación, no incluir _id si está vacío
        dataToSend = {
          nombreEmpresa: formData.nombreEmpresa,
          logo: formData.logo || '',
          labels: formData.labels || {},
          colores: formData.colores || {},
          informacion: formData.informacion || {},
          activo: formData.activo,
        };
      }

      console.log('handleSave - isUpdate:', isUpdate);
      console.log('handleSave - url:', url);
      console.log('handleSave - method:', method);
      console.log('handleSave - dataToSend:', JSON.stringify(dataToSend, null, 2));

      const toastId = toast.loading('Guardando configuración...');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Error desconocido' };
        }
        
        const errorMessage = errorData?.error || `Error ${response.status}: ${response.statusText}`;
        console.error('handleSave - Error response:', errorMessage);
        toast.error(errorMessage, { id: toastId });
        return;
      }

      const savedConfig = await response.json();
      console.log('handleSave - Respuesta del servidor:', JSON.stringify(savedConfig, null, 2));
      
      setFormData(savedConfig);
      setSaveSuccess(true);
      
      toast.success(
        isUpdate
          ? 'Configuración actualizada exitosamente' 
          : 'Configuración creada exitosamente',
        { id: toastId }
      );
      
      if (onSave) {
        onSave(savedConfig);
      }
      
      // Refetch para actualizar el hook en todos los componentes
      await refetch();

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return <div className="p-4">Cargando configuración...</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Configuración de la Empresa</h2>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'general'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('labels')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'labels'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Labels
        </button>
        <button
          onClick={() => setActiveTab('colores')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'colores'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Colores
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'info'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Información
        </button>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={formData.nombreEmpresa}
              onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre de tu empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Logo
            </label>
            <input
              type="text"
              value={formData.logo || ''}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          {formData.logo && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview del Logo:</p>
              <img 
                src={formData.logo} 
                alt="Logo" 
                className="h-24 w-auto rounded border border-gray-300 p-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la App
            </label>
            <input
              type="text"
              value={formData.labels.nombreApp}
              onChange={(e) => handleInputChange('labels.nombreApp', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de tu aplicación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtítulo
            </label>
            <input
              type="text"
              value={formData.labels.subtitulo}
              onChange={(e) => handleInputChange('labels.subtitulo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Subtítulo de la aplicación"
            />
          </div>

          {/* Bienvenida y Dashboard */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-3">Bienvenida y Dashboard</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de Bienvenida
            </label>
            <input
              type="text"
              value={formData.labels.bienvenida_titulo}
              onChange={(e) => handleInputChange('labels.bienvenida_titulo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtítulo de Bienvenida
            </label>
            <input
              type="text"
              value={formData.labels.bienvenida_subtitulo}
              onChange={(e) => handleInputChange('labels.bienvenida_subtitulo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta: Total Productos
            </label>
            <input
              type="text"
              value={formData.labels.dashboard_total_productos}
              onChange={(e) => handleInputChange('labels.dashboard_total_productos', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta: Ventas Hoy
            </label>
            <input
              type="text"
              value={formData.labels.dashboard_ventas_hoy}
              onChange={(e) => handleInputChange('labels.dashboard_ventas_hoy', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta: Usuarios Activos
            </label>
            <input
              type="text"
              value={formData.labels.dashboard_usuarios_activos}
              onChange={(e) => handleInputChange('labels.dashboard_usuarios_activos', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta: Pedidos Pendientes
            </label>
            <input
              type="text"
              value={formData.labels.dashboard_pedidos_pendientes}
              onChange={(e) => handleInputChange('labels.dashboard_pedidos_pendientes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Módulos */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-3">Nombres de Módulos</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Módulo Inventario
            </label>
            <input
              type="text"
              value={formData.labels.modulo_inventario}
              onChange={(e) => handleInputChange('labels.modulo_inventario', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Módulo Ventas
            </label>
            <input
              type="text"
              value={formData.labels.modulo_ventas}
              onChange={(e) => handleInputChange('labels.modulo_ventas', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Módulo Usuarios
            </label>
            <input
              type="text"
              value={formData.labels.modulo_usuarios}
              onChange={(e) => handleInputChange('labels.modulo_usuarios', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Módulo Reportes
            </label>
            <input
              type="text"
              value={formData.labels.modulo_reportes}
              onChange={(e) => handleInputChange('labels.modulo_reportes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Factura */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-3">Labels de Factura</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de Factura
            </label>
            <input
              type="text"
              value={formData.labels.factura_titulo}
              onChange={(e) => handleInputChange('labels.factura_titulo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Factura
            </label>
            <input
              type="text"
              value={formData.labels.factura_numero}
              onChange={(e) => handleInputChange('labels.factura_numero', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formData.colores).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleInputChange(`colores.${key}`, e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleInputChange(`colores.${key}`, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón Social
            </label>
            <input
              type="text"
              value={formData.informacion.razonSocial || ''}
              onChange={(e) => handleInputChange('informacion.razonSocial', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIT / RUC
            </label>
            <input
              type="text"
              value={formData.informacion.nit || ''}
              onChange={(e) => handleInputChange('informacion.nit', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.informacion.direccion || ''}
              onChange={(e) => handleInputChange('informacion.direccion', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.informacion.telefono || ''}
              onChange={(e) => handleInputChange('informacion.telefono', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.informacion.email || ''}
              onChange={(e) => handleInputChange('informacion.email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <input
              type="text"
              value={formData.informacion.ciudad || ''}
              onChange={(e) => handleInputChange('informacion.ciudad', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <input
              type="text"
              value={formData.informacion.pais || ''}
              onChange={(e) => handleInputChange('informacion.pais', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sitio Web
            </label>
            <input
              type="url"
              value={formData.informacion.sitioWeb || ''}
              onChange={(e) => handleInputChange('informacion.sitioWeb', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 flex gap-4 items-center">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
          ) : (
            'Guardar Cambios'
          )}
        </button>
      </div>
    </div>
  );
};
