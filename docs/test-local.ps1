# Script para probar la documentación localmente antes de desplegar
# Uso: .\test-local.ps1

Write-Host "🚀 Iniciando prueba local de documentación..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esté corriendo
Write-Host "📋 Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker está corriendo" -ForegroundColor Green
Write-Host ""

# Verificar archivos necesarios
Write-Host "📋 Verificando archivos necesarios..." -ForegroundColor Yellow
$requiredFiles = @(
    "Dockerfile",
    "nginx.conf",
    "documentation.html",
    "image_1.png",
    "image_2.png",
    "image_3.png"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file no encontrado" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ Faltan archivos necesarios. Verifica la estructura del proyecto." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Limpiar contenedores previos si existen
Write-Host "🧹 Limpiando contenedores previos..." -ForegroundColor Yellow
docker stop mcp-docs-test 2>$null
docker rm mcp-docs-test 2>$null
docker rmi mcp-docs-test 2>$null
Write-Host "✅ Limpieza completada" -ForegroundColor Green
Write-Host ""

# Construir imagen
Write-Host "🔨 Construyendo imagen Docker..." -ForegroundColor Yellow
docker build -t mcp-docs-test .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Imagen construida exitosamente" -ForegroundColor Green
Write-Host ""

# Ejecutar contenedor
Write-Host "🚀 Iniciando contenedor..." -ForegroundColor Yellow
docker run -d -p 8080:80 --name mcp-docs-test mcp-docs-test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar el contenedor" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contenedor iniciado" -ForegroundColor Green
Write-Host ""

# Esperar a que el servidor esté listo
Write-Host "⏳ Esperando a que el servidor esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Verificar que el servidor responde
Write-Host "🔍 Verificando que el servidor responde..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/documentation.html" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor respondiendo correctamente (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Servidor respondió con código: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al conectar con el servidor: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Logs del contenedor:" -ForegroundColor Yellow
    docker logs mcp-docs-test
    exit 1
}
Write-Host ""

# Mostrar información
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ ¡Documentación corriendo exitosamente!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs de acceso:" -ForegroundColor Yellow
Write-Host "   http://localhost:8080/" -ForegroundColor White
Write-Host "   http://localhost:8080/documentation.html" -ForegroundColor White
Write-Host ""
Write-Host "📋 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   Ver logs:     docker logs mcp-docs-test" -ForegroundColor White
Write-Host "   Detener:      docker stop mcp-docs-test" -ForegroundColor White
Write-Host "   Reiniciar:    docker restart mcp-docs-test" -ForegroundColor White
Write-Host ""
Write-Host "🧹 Para limpiar después de probar:" -ForegroundColor Yellow
Write-Host "   docker stop mcp-docs-test" -ForegroundColor White
Write-Host "   docker rm mcp-docs-test" -ForegroundColor White
Write-Host "   docker rmi mcp-docs-test" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Abrir en navegador
Write-Host ""
$openBrowser = Read-Host "¿Abrir en el navegador? (S/n)"
if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
    Start-Process "http://localhost:8080/documentation.html"
    Write-Host "✅ Navegador abierto" -ForegroundColor Green
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

