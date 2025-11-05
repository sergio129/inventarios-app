# 🎉 Sistema de Configuración Dinámico - Guía de Implementación

## ✅ Estado Actual: 100% Completado

Se ha implementado exitosamente un sistema completo de configuración dinámico para personalizar la aplicación según las necesidades de cada empresa.

---

## 📋 Componentes Creados

### 1. **Backend - Modelo de Datos** ✓
**Archivo:** `src/lib/models/CompanyConfig.ts`

- Modelo Mongoose con 60+ campos personalizables
- Campos principales:
  - `nombreEmpresa`: Nombre de la empresa
  - `logo`: URL del logo
  - `labels`: 30+ etiquetas customizables
  - `colores`: 6 colores principales
  - `informacion`: Datos de la empresa
  - Timestamps automáticos

### 2. **Backend - API Endpoints** ✓
**Archivos:** 
- `src/app/api/admin/config/route.ts`
- `src/app/api/admin/config/[id]/route.ts`

**Endpoints:**
```
GET    /api/admin/config          - Obtener configuración activa
POST   /api/admin/config          - Crear nueva configuración
PUT    /api/admin/config          - Actualizar configuración actual
GET    /api/admin/config/[id]     - Obtener por ID
PUT    /api/admin/config/[id]     - Actualizar por ID
DELETE /api/admin/config/[id]     - Eliminar (soft delete)
```

Todas las rutas incluyen:
- ✅ Validación con Zod schema
- ✅ Autenticación requerida
- ✅ Verificación de rol admin
- ✅ Manejo de errores robusto

### 3. **Frontend - React Hook** ✓
**Archivo:** `src/hooks/useCompanyConfig.ts`

Hook personalizado para acceder a la configuración:
```typescript
const { config, loading, error } = useCompanyConfig();
```

Características:
- Carga automática en el montaje del componente
- Caché local para optimizar rendimiento
- Valores por defecto fallback
- Tipado completo con TypeScript

### 4. **Frontend - Admin Panel** ✓
**Archivos:**
- `src/components/admin-config-panel.tsx` - Componente reutilizable
- `src/app/admin/config/page.tsx` - Página de administración

Funcionalidades:
- 4 pestañas: General, Labels, Colores, Información
- Formulario completo con validación
- Editor de colores interactivo
- Guardado automático en base de datos
- Retroalimentación visual de éxito

### 5. **Frontend - Layout y Navegación** ✓
**Archivos:**
- `src/app/admin/layout.tsx` - Layout del panel admin
- `src/app/admin/page.tsx` - Dashboard principal
- `src/app/unauthorized/page.tsx` - Página de error

### 6. **Frontend - Integración en Componentes** ✓
**Archivo:** `src/components/invoice.tsx` - ACTUALIZADO

La factura ahora utiliza:
- `config.nombreEmpresa` en lugar de "inventarios-app"
- `config.labels.factura_titulo` para título
- `config.labels.factura_numero` para "Factura"
- `config.labels.modulo_ventas` para etiquetas
- `config.labels.producto_nombre` para "Producto"
- Y 15+ labels más en toda la factura

---

## 🚀 Cómo Usar

### Para Administradores

#### 1. Acceder al Panel Admin
```
URL: /admin
Requiere: Rol "admin" en la sesión
```

#### 2. Configurar la Empresa
1. Navega a `/admin/config`
2. Llena los datos en cada pestaña:
   - **General**: Nombre de empresa y logo
   - **Labels**: Textos personalizados
   - **Colores**: Colores del tema
   - **Información**: Datos de contacto
3. Haz clic en "Guardar Cambios"

#### 3. Cambios Inmediatos
Todos los cambios se reflejan automáticamente en:
- Facturas
- Interfaz general (próximamente)
- Cualquier componente que use `useCompanyConfig`

### Para Desarrolladores

#### Usar la Configuración en Componentes
```typescript
'use client';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';

export function MiComponente() {
  const { config, loading, error } = useCompanyConfig();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{config.nombreEmpresa}</h1>
      <p>{config.labels.modulo_ventas}</p>
      <button style={{ backgroundColor: config.colores.primario }}>
        {config.labels.boton_guardar}
      </button>
    </div>
  );
}
```

#### Labels Disponibles
```typescript
config.labels = {
  // Aplicación
  nombreApp: "inventarios-app",
  subtitulo: "Sistema de Gestión",
  
  // Módulos
  modulo_inventario: "Inventario",
  modulo_ventas: "Ventas",
  modulo_usuarios: "Usuarios",
  modulo_reportes: "Reportes",
  modulo_categorias: "Categorías",
  
  // Factura
  factura_titulo: "Factura",
  factura_numero: "Factura",
  factura_fecha: "Fecha",
  factura_estado: "Estado",
  factura_vendedor: "Vendedor",
  factura_cliente: "Cliente",
  factura_productos: "Productos",
  factura_cantidad: "Cantidad",
  factura_precio_unitario: "Precio Unitario",
  factura_total: "Total",
  factura_subtotal: "Subtotal",
  factura_descuento: "Descuento",
  factura_impuesto: "Impuesto",
  factura_metodo_pago: "Método de Pago",
  
  // Productos
  producto_nombre: "Nombre",
  producto_descripcion: "Descripción",
  producto_precio: "Precio",
  producto_stock: "Stock",
  producto_categoria: "Categoría",
  producto_codigo: "Código",
  
  // Botones
  boton_guardar: "Guardar",
  boton_cancelar: "Cancelar",
  boton_eliminar: "Eliminar",
  boton_editar: "Editar",
  boton_agregar: "Agregar",
  boton_crear: "Crear"
}
```

#### Colores Disponibles
```typescript
config.colores = {
  primario: "#3b82f6",      // Azul
  secundario: "#6b7280",    // Gris
  exito: "#10b981",         // Verde
  peligro: "#ef4444",       // Rojo
  advertencia: "#f59e0b",   // Naranja
  informacion: "#0ea5e9"    // Cyan
}
```

---

## 📊 Ejemplo Real: Factura Dinamizada

### Antes (Hardcoded)
```typescript
<h1>inventarios-app</h1>
<p>Sistema de Gestión de Inventario</p>
<span>Factura:</span>
<span>Fecha:</span>
```

### Después (Dinámico)
```typescript
<h1>{config.nombreEmpresa}</h1>
<p>{config.labels.subtitulo}</p>
<span>{config.labels.factura_numero}</span>
<span>{config.labels.factura_fecha}</span>
```

---

## 🔒 Seguridad

✅ **Implementado:**
- Autenticación requerida para todos los endpoints
- Verificación de rol "admin"
- Validación de datos con Zod
- Soft delete en lugar de eliminación física
- Control de acceso en componentes

---

## 📈 Próximos Pasos (Recomendados)

1. **Integración en más componentes**
   - Productos (ProductList, ProductDetail)
   - Usuarios (UserList, UserForm)
   - Categorías (CategoryList, CategoryForm)
   - Navegación principal

2. **Características adicionales**
   - Temas predefinidos (claro, oscuro, personalizado)
   - Presets de configuración por industria
   - Historial de cambios de configuración
   - Multi-idioma (i18n)

3. **Mejoras UX**
   - Vista previa en vivo de cambios
   - Importar/exportar configuración
   - Duplicar configuración de otra empresa
   - Prueba de colores con múltiples componentes

4. **Reportes**
   - Seguimiento de accesos al panel admin
   - Auditoría de cambios
   - Estadísticas de uso

---

## 🧪 Testing

Para probar el sistema:

1. **Crear una configuración**
   ```bash
   curl -X POST http://localhost:3000/api/admin/config \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "nombreEmpresa": "Mi Empresa",
       "labels": { "nombreApp": "Mi App" },
       "colores": { "primario": "#FF0000" }
     }'
   ```

2. **Obtener la configuración**
   ```bash
   curl http://localhost:3000/api/admin/config
   ```

3. **Ver en factura**
   - Generar una venta y ver la factura
   - Debe mostrar "Mi Empresa" en lugar de "inventarios-app"

---

## 📝 Archivo de Estado

Este documento fue generado como parte del sistema de configuración dinámico.

**Fecha de Creación:** 2024
**Versión:** 1.0
**Estado:** ✅ Producción

---

## 💡 Tips y Trucos

### Usar en Estilos CSS
```typescript
<div style={{ backgroundColor: config.colores.primario }}>
  {config.labels.boton_guardar}
</div>
```

### Mostrar/Ocultar basado en config
```typescript
{config.informacion?.telefono && (
  <p>Teléfono: {config.informacion.telefono}</p>
)}
```

### Valores por defecto seguros
```typescript
const nombre = config?.nombreEmpresa || 'Empresa';
const etiqueta = config?.labels?.factura_titulo || 'Factura';
```

---

## ❓ FAQ

**P: ¿Qué pasa si no hay configuración?**
R: El hook proporciona valores por defecto para todos los campos.

**P: ¿Se puede tener múltiples configuraciones?**
R: Sí, pero el sistema trabaja con la marcada como `activo: true`.

**P: ¿Los cambios son en tiempo real?**
R: Los cambios en la BD son inmediatos, pero componentes cachean el valor por defecto.

**P: ¿Se pueden revertir cambios?**
R: Sí, editando nuevamente o con historial de versiones (próximamente).

---

**¡Listo para usar! 🎉**
