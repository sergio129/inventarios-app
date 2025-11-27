@echo off
title Servidor de Impresion Termica - POS-5890U-L
color 0A

echo.
echo ========================================
echo   SERVIDOR DE IMPRESION TERMICA
echo   POS-5890U-L
echo ========================================
echo.
echo Iniciando servidor en puerto 3001...
echo.

cd /d "%~dp0"
node print-server.js

pause
