# Configuración de Variables de Entorno en Vercel

## ⚠️ Problema encontrado
El error 500 en `/api/products` ocurre porque `NEXTAUTH_URL` no está configurada correctamente en Vercel.

## Pasos para configurar en Vercel

### 1. **Acceder a Vercel Dashboard**
   - Ve a https://vercel.com/dashboard
   - Selecciona tu proyecto `inventarios-app`

### 2. **Ir a Settings > Environment Variables**
   - Click en **Settings**
   - Selecciona **Environment Variables**

### 3. **Agregar/Actualizar Variables**

Necesitas configurar estas variables:

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXTAUTH_SECRET` | `tu-secret-muy-seguro-aqui` | Genera un nuevo secret: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://inventarios-app.vercel.app` | Reemplaza con tu URL en Vercel |
| `MONGODB_URI` | `mongodb+srv://SaludDirecta:2dK1EIjye943WsZ7@saluddirecta.9fqxyrb.mongodb.net/?retryWrites=true&w=majority&appName=SaludDirecta` | Tu conexión a MongoDB (sin cambios) |

### 4. **Pasos específicos para cada variable**

#### Para `NEXTAUTH_URL`:
```
Name: NEXTAUTH_URL
Value: https://inventarios-app.vercel.app
Select Environments: Production, Preview, Development
```

#### Para `NEXTAUTH_SECRET`:
```
Name: NEXTAUTH_SECRET
Value: [tu-secret-generado]
Select Environments: Production, Preview, Development
```

#### Para `MONGODB_URI`:
```
Name: MONGODB_URI
Value: [tu-uri-de-mongodb]
Select Environments: Production, Preview, Development
```

### 5. **Guardar y Redeploy**
   - Click en **Save** para cada variable
   - Vercel automáticamente redeploy el proyecto
   - O ve a **Deployments** y haz click en los 3 puntos > **Redeploy**

### 6. **Verificar que funcionó**
   - Espera a que el deployment termine
   - Intenta acceder a `https://inventarios-app.vercel.app/api/products`
   - Deberías recibir JSON, no un error 500

## 🔧 Troubleshooting

### Si aún tienes error 500:
1. **Verifica el log en Vercel**: Settings > Function Logs
2. **Revisa la conexión a MongoDB**: asegúrate que el cluster de MongoDB permite conexiones desde Vercel
3. **Comprueba NEXTAUTH_URL**: debe ser exactamente `https://inventarios-app.vercel.app` sin slash al final

### Para agregar IP de Vercel a MongoDB:
1. Ve a MongoDB Atlas: https://account.mongodb.com
2. Network Access > Add IP Address
3. Agregar `0.0.0.0/0` (permite todo, para desarrollo; usa rangos específicos en producción)

## 📝 Variables de entorno locales (.env.local)

Para desarrollo local, crea `.env.local` en la raíz del proyecto:

```bash
NEXTAUTH_SECRET=tu-secret-local
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://SaludDirecta:2dK1EIjye943WsZ7@saluddirecta.9fqxyrb.mongodb.net/?retryWrites=true&w=majority&appName=SaludDirecta
```

## ✅ Checklist final

- [ ] Variables de entorno configuradas en Vercel
- [ ] Proyecto redeploy completado
- [ ] `/api/products` devuelve JSON exitosamente
- [ ] Login funciona correctamente
- [ ] Carrito de compras funciona
