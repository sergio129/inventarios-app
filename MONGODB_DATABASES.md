# Configuración de Bases de Datos MongoDB para inventarios-app

## 📊 Estructura de Bases de Datos

El proyecto usa **dos bases de datos separadas** en el mismo cluster MongoDB:

| Ambiente | Base de Datos | Propósito | URI |
|----------|--------------|----------|-----|
| **Local (Desarrollo)** | `inventarios-local` | Testing, desarrollo, pruebas sin afectar datos reales | `.../inventarios-local?...` |
| **Producción (Vercel)** | `inventarios` | Datos reales, en vivo | `.../inventarios?...` |

## 🔧 Configuración

### En Desarrollo Local (.env.local)

```bash
MONGODB_URI=mongodb+srv://SaludDirecta:2dK1EIjye943WsZ7@saluddirecta.9fqxyrb.mongodb.net/inventarios-local?retryWrites=true&w=majority&appName=SaludDirecta
```

✅ **Ventajas:**
- Puedes hacer pruebas sin afectar datos de producción
- Fácil de identificar cuándo estás trabajando en local
- Puedes borrar/resetear datos sin consecuencias
- Ambiente completamente aislado

### En Producción (Vercel - .env.example como referencia)

```bash
MONGODB_URI=mongodb+srv://SaludDirecta:2dK1EIjye943WsZ7@saluddirecta.9fqxyrb.mongodb.net/inventarios?retryWrites=true&w=majority&appName=SaludDirecta
```

✅ **Características:**
- Base de datos separada para datos reales
- Usuarios, productos, ventas de producción se guardan aquí
- No se mezcla con datos de desarrollo
- Seguro para operaciones en vivo

## 📍 Cómo Identificar en cuál BD estás

### En tu aplicación local:
1. Abre la consola del navegador (F12)
2. Verás logs indicando que estás en `inventarios-local`
3. Los datos se guardan en esa base de datos

### En Vercel (Producción):
1. Todos los datos se guardan en la BD `inventarios`
2. Puedes verificar en MongoDB Atlas viendo cuál base de datos tiene más datos

## 🔄 Migrar Datos (si es necesario)

Si necesitas copiar datos de `inventarios-local` a `inventarios`:

### Opción 1: Usando MongoDB Atlas UI
1. Ve a https://account.mongodb.com
2. Selecciona el cluster `saluddirecta`
3. Usa la herramienta de exportación para exportar desde `inventarios-local`
4. Importa en `inventarios`

### Opción 2: Usando mongodump y mongorestore
```bash
# Exportar desde inventarios-local
mongodump --uri "mongodb+srv://SaludDirecta:PASSWORD@saluddirecta.9fqxyrb.mongodb.net/inventarios-local"

# Importar a inventarios
mongorestore --uri "mongodb+srv://SaludDirecta:PASSWORD@saluddirecta.9fqxyrb.mongodb.net/inventarios" dump/inventarios-local
```

## ⚙️ Configurar en Vercel

Para que Vercel use la base de datos `inventarios`:

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto `inventarios-app`
3. Ve a **Settings > Environment Variables**
4. **Busca o crea** la variable `MONGODB_URI`:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://SaludDirecta:2dK1EIjye943WsZ7@saluddirecta.9fqxyrb.mongodb.net/inventarios?retryWrites=true&w=majority&appName=SaludDirecta`
   - Environments: Production, Preview, Development
5. Haz clic en **Save**
6. Vercel redeploy automáticamente ✅

## 📋 Checklist

- [x] Base de datos `inventarios-local` configurada para local
- [x] Base de datos `inventarios` configurada para producción
- [x] `.env.local` apunta a `inventarios-local`
- [ ] Vercel configurado con `inventarios`
- [ ] Datos migrados (si es necesario)

## 🚀 Flujo de Trabajo

```
┌─────────────────┐
│  Tu Máquina     │
│ (Local Dev)     │
│                 │
│ BD: inventarios │
│ -local          │
└────────┬────────┘
         │
         ▼
    Push a GitHub
         │
         ▼
┌─────────────────┐
│    Vercel       │
│  (Producción)   │
│                 │
│ BD: inventarios │
└─────────────────┘
```

## 🔐 Seguridad

⚠️ **IMPORTANTE**: 
- Nunca hagas push del `.env.local` a GitHub (está en `.gitignore`)
- La credencial de MongoDB está en estas variables - mantén segura
- Los archivos `.env` con credenciales NUNCA deben estar en control de versión

---

**Última actualización**: November 2, 2025
**Estado**: ✅ Configuración completada
