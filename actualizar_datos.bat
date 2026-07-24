@echo off

echo =========================================================
echo       ACTUALIZADOR DE DATOS - DASHBOARD ONBOARDING
echo =========================================================
echo.
echo [1/2] Sincronizando datos del primer Dashboard (data.js)...
powershell -NoProfile -ExecutionPolicy Bypass -File .\actualizar_datos.ps1
echo.
echo [2/2] Sincronizando datos del segundo Dashboard (data2.js)...
powershell -NoProfile -ExecutionPolicy Bypass -File .\actualizar_datos2.ps1
echo.
echo =========================================================
echo Sincronizacion completada. Presiona cualquier tecla para cerrar.
echo =========================================================
pause > nul
