@echo off
echo ========================================
echo   EMPAQUETAR SERVIDOR DE IMPRESION
echo ========================================
echo.

set "DEST=PrintServerPortable"

echo Creando carpeta %DEST%...
if exist %DEST% rmdir /s /q %DEST%
mkdir %DEST%

echo.
echo Copiando archivos...
copy print-server.js %DEST%\
copy start-print-server.bat %DEST%\
copy start-print-server-hidden.vbs %DEST%\
copy PRINT_SERVER_README.md %DEST%\README.md
copy INSTALACION_TAREA_PROGRAMADA.md %DEST%\

echo.
echo Instalando dependencias...
cd %DEST%
call npm init -y
call npm install express cors --save

echo.
echo ========================================
echo   LISTO!
echo ========================================
echo.
echo Carpeta creada: %DEST%
echo.
echo Puedes copiar esta carpeta completa a:
echo   - C:\PrintServer
echo   - D:\Impresora
echo   - Cualquier ubicacion
echo.
echo Y ejecutar: start-print-server.bat
echo.
pause
