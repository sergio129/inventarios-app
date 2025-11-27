# 🔧 Configurar Tarea Programada para Servidor de Impresión

## Opción 1: Tarea Programada de Windows (Recomendado)

### Método Automático (Script PowerShell)

1. **Ejecuta este comando en PowerShell como Administrador:**

```powershell
# Crear tarea programada
$action = New-ScheduledTaskAction -Execute "E:\Proyectos\SaludDirecta\start-print-server-hidden.vbs"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings

Register-ScheduledTask -TaskName "ServidorImpresionTermica" -InputObject $task -Force
```

2. **Verificar que se creó:**
```powershell
Get-ScheduledTask -TaskName "ServidorImpresionTermica"
```

3. **Probar manualmente:**
```powershell
Start-ScheduledTask -TaskName "ServidorImpresionTermica"
```

---

### Método Manual (Interfaz Gráfica)

1. **Abrir Programador de Tareas:**
   - Presiona `Win + R`
   - Escribe: `taskschd.msc`
   - Presiona Enter

2. **Crear Tarea Básica:**
   - Click derecho en "Biblioteca del Programador de tareas"
   - Selecciona "Crear tarea..." (NO "Crear tarea básica")

3. **Pestaña "General":**
   - **Nombre:** `Servidor Impresión Térmica`
   - **Descripción:** `Inicia el servidor local para impresión térmica POS-5890U-L`
   - ✅ Marcar: "Ejecutar con los privilegios más altos"
   - ✅ Marcar: "Ejecutar tanto si el usuario inició sesión como si no"

4. **Pestaña "Desencadenadores":**
   - Click en "Nuevo..."
   - Selecciona: "Al iniciar sesión"
   - Usuario: "Tu usuario actual"
   - ✅ Marcar: "Habilitado"
   - Click "Aceptar"

5. **Pestaña "Acciones":**
   - Click en "Nuevo..."
   - **Acción:** Iniciar un programa
   - **Programa:** `wscript.exe`
   - **Argumentos:** `"E:\Proyectos\SaludDirecta\start-print-server-hidden.vbs"`
   - Click "Aceptar"

6. **Pestaña "Condiciones":**
   - ❌ Desmarcar: "Iniciar la tarea solo si el equipo está conectado a la corriente alterna"
   - ✅ Marcar: "Activar la tarea si se detiene"

7. **Pestaña "Configuración":**
   - ✅ Marcar: "Permitir que la tarea se ejecute a petición"
   - ✅ Marcar: "Ejecutar la tarea lo antes posible después de perder un inicio programado"
   - Si la tarea no se detiene al solicitarlo: "Detener la tarea existente"

8. **Guardar:**
   - Click en "Aceptar"
   - Si pide contraseña, ingresa tu contraseña de Windows

---

## Opción 2: Carpeta de Inicio (Más Simple)

### Con ventana visible:

1. Presiona `Win + R`
2. Escribe: `shell:startup`
3. Presiona Enter
4. Copia el archivo `start-print-server.bat` a esta carpeta

### Sin ventana (oculto):

1. Presiona `Win + R`
2. Escribe: `shell:startup`
3. Presiona Enter
4. Copia el archivo `start-print-server-hidden.vbs` a esta carpeta

---

## 🧪 Probar la Configuración

### Verificar que el servidor está corriendo:

```powershell
# Ver procesos de node
Get-Process -Name node -ErrorAction SilentlyContinue

# Verificar puerto 3001
netstat -ano | findstr :3001

# Probar conexión
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

### Reiniciar el servidor:

```powershell
# Detener
Stop-Process -Name node -Force

# Iniciar tarea
Start-ScheduledTask -TaskName "ServidorImpresionTermica"
```

---

## 📝 Logs y Monitoreo

### Ver si está corriendo:

```powershell
# PowerShell
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# CMD
tasklist | findstr node.exe
```

### Detener el servidor:

```powershell
# PowerShell
Stop-Process -Name node -Force

# CMD
taskkill /F /IM node.exe
```

---

## 🔧 Solución de Problemas

### La tarea no inicia al encender:

1. Abre Programador de tareas
2. Busca "Servidor Impresión Térmica"
3. Click derecho → "Ejecutar"
4. Revisa el historial en la pestaña "Historial"

### El servidor se detiene solo:

Modifica `start-print-server.bat` y quita la línea `pause` al final

### Quiero ver los logs:

Modifica `start-print-server.bat`:
```batch
@echo off
cd /d "%~dp0"
node print-server.js >> print-server.log 2>&1
```

Esto guardará los logs en `print-server.log`

---

## 🗑️ Desinstalar

### Eliminar tarea programada:

```powershell
Unregister-ScheduledTask -TaskName "ServidorImpresionTermica" -Confirm:$false
```

### Eliminar de carpeta de inicio:

1. `Win + R` → `shell:startup`
2. Elimina `start-print-server-hidden.vbs`

---

## ✅ Verificación Final

Después de configurar, **reinicia tu PC** y verifica:

1. El servidor inicia automáticamente
2. Está escuchando en puerto 3001
3. Puedes imprimir desde Vercel

```powershell
# Verificar
Invoke-RestMethod http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "online",
  "platform": "win32",
  "printer": "POS-5890U-L"
}
```

🎉 ¡Todo listo! El servidor arrancará automáticamente cada vez que inicies sesión.
