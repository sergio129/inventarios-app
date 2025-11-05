import { useEffect, useState } from 'react';

export interface CompanyConfig {
  _id: string;
  nombreEmpresa: string;
  logo?: string;
  labels: {
    nombreApp: string;
    subtitulo: string;
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

export const useCompanyConfig = () => {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/config');
        
        if (!response.ok) {
          // Si no hay configuración, usar valores por defecto
          if (response.status === 404) {
            setConfig({
              _id: '',
              nombreEmpresa: 'inventarios-app',
              labels: {
                nombreApp: 'inventarios-app',
                subtitulo: 'Sistema de Gestión de Inventario',
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
                boton_crear: 'Crear'
              },
              colores: {
                primario: '#3b82f6',
                secundario: '#6366f1',
                exito: '#10b981',
                peligro: '#ef4444',
                advertencia: '#f59e0b',
                informacion: '#3b82f6'
              },
              informacion: {}
            } as CompanyConfig);
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
        // Mantener valores por defecto en caso de error
        setConfig({
          _id: '',
          nombreEmpresa: 'inventarios-app',
          labels: {
            nombreApp: 'inventarios-app',
            subtitulo: 'Sistema de Gestión de Inventario',
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
            boton_crear: 'Crear'
          },
          colores: {
            primario: '#3b82f6',
            secundario: '#6366f1',
            exito: '#10b981',
            peligro: '#ef4444',
            advertencia: '#f59e0b',
            informacion: '#3b82f6'
          },
          informacion: {}
        } as CompanyConfig);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
};
