@echo off
REM Script para iniciar el servidor MCP Financiero
REM Uso: start_server.bat

echo === Iniciando Servidor MCP Financiero ===
echo.

REM Activar entorno virtual
echo Activando entorno virtual...
call venv\Scripts\activate.bat

REM Configurar encoding
set PYTHONIOENCODING=utf-8

REM Configurar PYTHONPATH
set PYTHONPATH=%~dp0src

REM Mostrar información
echo.
echo Servidor MCP iniciando...
echo PYTHONPATH: %PYTHONPATH%
echo.

REM Ejecutar servidor
python run_server.py

pause

