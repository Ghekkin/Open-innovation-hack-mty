# Script para hacer push de los archivos de configuracion del frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Push de Configuracion Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "frontend/Dockerfile")) {
    Write-Host "ERROR: No se encuentra frontend/Dockerfile" -ForegroundColor Red
    Write-Host "Asegurate de estar en el directorio raiz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "Archivos encontrados" -ForegroundColor Green
Write-Host ""

# Mostrar archivos que se van a agregar
Write-Host "Archivos a agregar:" -ForegroundColor Yellow
Write-Host "   - frontend/Dockerfile" -ForegroundColor White
Write-Host "   - frontend/.dockerignore" -ForegroundColor White
Write-Host "   - frontend/next.config.ts (actualizado)" -ForegroundColor White
Write-Host "   - CONFIGURACION_COOLIFY.md (actualizado)" -ForegroundColor White
Write-Host "   - SOLUCION_DEPLOYMENT_FRONTEND.md (nuevo)" -ForegroundColor White
Write-Host "   - CONFIGURACION_COOLIFY_FRONTEND.md (nuevo)" -ForegroundColor White
Write-Host "   - RESUMEN_SOLUCION.md (nuevo)" -ForegroundColor White
Write-Host ""

# Agregar archivos
Write-Host "Agregando archivos..." -ForegroundColor Cyan
git add frontend/Dockerfile
git add frontend/.dockerignore
git add frontend/next.config.ts
git add CONFIGURACION_COOLIFY.md
git add SOLUCION_DEPLOYMENT_FRONTEND.md
git add CONFIGURACION_COOLIFY_FRONTEND.md
git add RESUMEN_SOLUCION.md
git add push_frontend_fix.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR al agregar archivos" -ForegroundColor Red
    exit 1
}

Write-Host "Archivos agregados" -ForegroundColor Green
Write-Host ""

# Hacer commit
Write-Host "Haciendo commit..." -ForegroundColor Cyan
git commit -m "fix: Agregar Dockerfile y configuracion para deployment en Coolify"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR al hacer commit" -ForegroundColor Red
    Write-Host "(Puede ser que no haya cambios para commitear)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Commit realizado" -ForegroundColor Green
Write-Host ""

# Push
Write-Host "Haciendo push a origin/main..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR al hacer push" -ForegroundColor Red
    exit 1
}

Write-Host "Push completado exitosamente" -ForegroundColor Green
Write-Host ""

# Siguiente paso
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ARCHIVOS SUBIDOS EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a Coolify -> Tu Aplicacion Frontend -> Configuration -> General" -ForegroundColor White
Write-Host ""
Write-Host "2. Configura:" -ForegroundColor White
Write-Host "   Base Directory: frontend" -ForegroundColor Cyan
Write-Host "   Build Pack: dockerfile" -ForegroundColor Cyan
Write-Host "   Dockerfile Location: Dockerfile" -ForegroundColor Cyan
Write-Host "   Port: 3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Ve a Environment Variables y agrega:" -ForegroundColor White
Write-Host "   MCP_SERVER_URL=https://tu-backend-url.com" -ForegroundColor Cyan
Write-Host "   NODE_ENV=production" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Click en Redeploy" -ForegroundColor White
Write-Host ""
Write-Host "Para mas detalles, revisa:" -ForegroundColor Yellow
Write-Host "   - CONFIGURACION_COOLIFY_FRONTEND.md (guia rapida)" -ForegroundColor White
Write-Host "   - SOLUCION_DEPLOYMENT_FRONTEND.md (troubleshooting)" -ForegroundColor White
Write-Host ""
