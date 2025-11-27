# 🖨️ Servidor Local de Impresión Térmica

## ¿Por qué necesito esto?

Cuando usas la aplicación desde **Vercel** (https://inventarios-app.vercel.app), el servidor está en la nube de Amazon en Linux. **No tiene acceso a tu impresora USB local**.

Este servidor pequeño corre en tu PC de la tienda y recibe comandos de impresión desde Vercel, enviándolos directamente a tu impresora POS-5890U-L.

## 📋 Instalación

### 1. Instalar dependencias

```powershell
# En la carpeta del proyecto
cd E:\Proyectos\SaludDirecta

# Instalar dependencias del servidor de impresión
npm install express cors --save
```

### 2. Iniciar el servidor

```powershell
# Opción 1: Iniciar manualmente
node print-server.js

# Opción 2: Con reinicio automático (desarrollo)
npm install -g nodemon
nodemon print-server.js
```

Verás esto:
```
🖨️  Servidor de impresión térmica iniciado
📡 Escuchando en http://localhost:3001
💻 Plataforma: win32
✅ Listo para recibir trabajos de impresión desde Vercel
```

### 3. Configurar en la aplicación web

1. Ve a https://inventarios-app.vercel.app/printer-settings
2. En "Servidor Local de Impresión" ingresa: `http://localhost:3001`
3. Guarda la configuración

## 🚀 Cómo funciona

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Navegador → Vercel (Linux)                                │
│                   ↓                                         │
│              Genera recibo                                  │
│                   ↓                                         │
│       Envía a http://localhost:3001                        │
│                   ↓                                         │
│        Tu PC (Servidor Local)                              │
│                   ↓                                         │
│           Impresora POS-5890U-L                            │
│                   ↓                                         │
│               🧾 Recibo impreso                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuración Automática en Windows

### Crear servicio de Windows (opcional)

Para que el servidor inicie automáticamente al encender el PC:

```powershell
# Instalar NSSM (Non-Sucking Service Manager)
# Descarga desde: https://nssm.cc/download

# Crear servicio
nssm install ThermalPrintServer "C:\Program Files\nodejs\node.exe" "E:\Proyectos\SaludDirecta\print-server.js"

# Configurar directorio de trabajo
nssm set ThermalPrintServer AppDirectory "E:\Proyectos\SaludDirecta"

# Iniciar servicio
nssm start ThermalPrintServer
```

### Iniciar al inicio de sesión (más simple)

1. Presiona `Win + R`
2. Escribe `shell:startup` y presiona Enter
3. Crea un archivo `start-printer.bat` con:

```batch
@echo off
cd E:\Proyectos\SaludDirecta
start /min node print-server.js
```

## 🧪 Probar el servidor

### Test manual

```powershell
# Verificar que está corriendo
curl http://localhost:3001/health

# Debería responder:
# {"status":"online","platform":"win32","printer":"POS-5890U-L"}
```

### Test de impresión

```powershell
# Crear archivo de prueba
echo "PRUEBA DE IMPRESION" > test.txt

# Enviar a imprimir
Invoke-WebRequest -Uri "http://localhost:3001/print" `
  -Method POST `
  -ContentType "text/plain" `
  -Body (Get-Content test.txt -Raw)
```

## ❓ Solución de Problemas

### El servidor no inicia

```powershell
# Verificar que Node.js está instalado
node --version

# Verificar puerto 3001 disponible
netstat -ano | findstr :3001

# Si el puerto está ocupado, cambiar en print-server.js:
# const PORT = 3002;
```

### No imprime

1. Verificar que la impresora está encendida (LED verde)
2. Verificar que es la impresora predeterminada:
   ```powershell
   Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE"
   ```
3. Ver logs del servidor en la consola

### Error de CORS desde Vercel

El servidor ya está configurado para aceptar requests desde:
- `http://localhost:3000` (desarrollo local)
- `https://inventarios-app.vercel.app` (producción)

Si usas otro dominio, agrégalo en `print-server.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://inventarios-app.vercel.app',
    'https://tu-otro-dominio.com'  // Agregar aquí
  ],
  credentials: true
}));
```

## 🔒 Seguridad

**IMPORTANTE**: Este servidor solo debe escuchar en `localhost`, nunca exponerlo a internet.

- ✅ `http://localhost:3001` - SEGURO
- ❌ `http://0.0.0.0:3001` - INSEGURO
- ❌ Abrir puerto 3001 en router - INSEGURO

## 📝 Logs

El servidor muestra en consola:
- ✅ Impresiones exitosas
- ❌ Errores de impresión
- 📊 Tamaño de cada trabajo

## 💡 Tips

1. **Mantén el servidor corriendo** mientras usas la aplicación web
2. **Minimiza la ventana** de PowerShell, no la cierres
3. **Revisa los logs** si algo no imprime
4. **Reinicia el servidor** si cambias de impresora

## 🆘 Soporte

Si algo no funciona:

1. Verifica los logs del servidor
2. Prueba con `curl http://localhost:3001/health`
3. Revisa que la impresora esté online en Windows
4. Intenta reiniciar el servicio
