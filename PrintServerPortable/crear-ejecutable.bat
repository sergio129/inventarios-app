@echo off
title Crear Ejecutable Standalone del Servidor de Impresion
color 0B

echo ========================================
echo   CREAR EJECUTABLE .EXE
echo   (No requiere instalar Node.js)
echo ========================================
echo.

REM Ir al directorio donde esta el .bat
cd /d "%~dp0"

echo Directorio actual: %CD%
echo.

echo Verificando dependencias...
where pkg >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [!] 'pkg' no esta instalado
    echo [+] Instalando pkg globalmente...
    call npm install -g pkg
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo instalar pkg
        pause
        exit /b 1
    )
)

echo.
echo [OK] pkg esta disponible
echo.

REM Verificar que print-server.js existe
if not exist "print-server.js" (
    echo [ERROR] No se encuentra print-server.js en este directorio
    echo Asegurate de ejecutar este script desde la carpeta PrintServerPortable
    pause
    exit /b 1
)

echo Empaquetando servidor...
echo.

call pkg print-server.js --targets node18-win-x64 --output print-server-win.exe

REM Verificar si el archivo se creo
if exist "print-server-win.exe" (
    echo.
    echo ========================================
    echo   EXITO!
    echo ========================================
    echo.
    echo Ejecutable creado: print-server-win.exe
    echo Ubicacion: %CD%\print-server-win.exe
    echo Tamano: ~50 MB (incluye Node.js embebido)
    echo.
    echo Para distribuir:
    echo   1. Copia print-server-win.exe a cualquier PC Windows
    echo   2. Doble click para ejecutar
    echo   3. NO necesita instalar Node.js
    echo.
    echo Abriendo carpeta...
    explorer "%CD%"
) else (
    echo.
    echo [ERROR] No se pudo crear el ejecutable
    echo Revisa los errores anteriores
    echo.
)

pause
