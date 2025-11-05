import { useEffect, useState } from 'react';

export interface CompanyConfig {
  _id: string;
  nombreEmpresa: string;
  logo?: string;
  labels: {
    nombreApp: string;
    subtitulo: string;
    bienvenida_titulo: string;
    bienvenida_subtitulo: string;
    dashboard_total_productos: string;
    dashboard_ventas_hoy: string;
    dashboard_usuarios_activos: string;
    dashboard_pedidos_pendientes: string;
    modulo_inventario: string;
    modulo_ventas: string;
    modulo_usuarios: string;
    modulo_reportes: string;
    modulo_categorias: string;
    factura_titulo: string;
    factura_numero: string;
    factura_fecha: string;
    factura_estado: string;
    factura_vendedor: string;
    factura_cliente: string;
    factura_productos: string;
    factura_cantidad: string;
    factura_precio_unitario: string;
    factura_total: string;
    factura_subtotal: string;
    factura_descuento: string;
    factura_impuesto: string;
    factura_metodo_pago: string;
    producto_nombre: string;
    producto_descripcion: string;
    producto_precio: string;
    producto_stock: string;
    producto_categoria: string;
    producto_codigo: string;
    boton_guardar: string;
    boton_cancelar: string;
    boton_eliminar: string;
    boton_editar: string;
    boton_agregar: string;
    boton_crear: string;
  };
  colores: {
    primario: string;
    secundario: string;
    exito: string;
    peligro: string;
    advertencia: string;
    informacion: string;
  };
  informacion: {
    razonSocial?: string;
    nit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    ciudad?: string;
    pais?: string;
    sitioWeb?: string;
  };
  activo?: boolean;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

const DEFAULT_CONFIG: CompanyConfig = {
  _id: '',
  nombreEmpresa: 'inventarios-app',
  labels: {
    nombreApp: 'inventarios-app',
    subtitulo: 'Sistema de Gestión de Inventario',
    bienvenida_titulo: '¡Bienvenido a Inventarios-app!',
    bienvenida_subtitulo: 'Sistema de gestión de inventario para comidas rápidas',
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
    secundario: '#6366f1',
    exito: '#10b981',
    peligro: '#ef4444',
    advertencia: '#f59e0b',
    informacion: '#3b82f6',
  },
  informacion: {},
};

export const useCompanyConfig = () => {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      // Agregar timestamp para evitar caché del navegador
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/config?t=${timestamp}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setConfig(DEFAULT_CONFIG);
          setError(null);
        } else {
          throw new Error('Error al obtener la configuración');
        }
      } else {
        const data = await response.json();
        setConfig(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching company config:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Función para refetch manualmente (útil después de guardar cambios)
  const refetch = async () => {
    await fetchConfig();
  };

  return { config, loading, error, refetch };
};
