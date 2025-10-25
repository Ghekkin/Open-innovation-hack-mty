# Script para iniciar el servidor MCP Financiero
# Uso: .\start_server.ps1

Write-Host "=== Iniciando Servidor MCP Financiero ===" -ForegroundColor Green

# Activar entorno virtual
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Configurar encoding
$env:PYTHONIOENCODING = "utf-8"

# Configurar PYTHONPATH
$env:PYTHONPATH = "$PSScriptRoot\src"

# Mostrar información
Write-Host ""
Write-Host "Servidor MCP iniciando..." -ForegroundColor Cyan
Write-Host "PYTHONPATH: $env:PYTHONPATH" -ForegroundColor Gray
Write-Host ""

# Ejecutar servidor
python run_server.py

