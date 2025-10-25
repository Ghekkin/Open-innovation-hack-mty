@echo off
echo 🚀 Configurando API Key de Google Gemini...
echo =====================================
echo.

set "API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs"

echo # Google Gemini API Configuration > .env.local
echo # Tu API key de Gemini ya está configurada >> .env.local
echo GEMINI_API_KEY=%API_KEY% >> .env.local
echo. >> .env.local
echo # ¡Tu API key está configurada y lista para usar! >> .env.local
echo # El asistente virtual con IA ya debería funcionar >> .env.local

if exist .env.local (
    echo ✅ Archivo .env.local creado exitosamente!
    echo 📍 Ubicación: %cd%\.env.local
    echo.
    echo 🔄 Pasos siguientes:
    echo    1. Reinicia el servidor de desarrollo: npm run dev
    echo    2. Ve a /dashboard para usar el asistente virtual
    echo.
    echo 🎉 ¡Tu asistente virtual con IA ya está listo!
    echo.
    echo 📝 Tu API Key: %API_KEY%
) else (
    echo ❌ Error al crear el archivo .env.local
    echo.
    echo 💡 Alternativa manual:
    echo    1. Crea el archivo .env.local en la raíz del proyecto
    echo    2. Agrega estas líneas:
    echo       # Google Gemini API Configuration
    echo       # Tu API key de Gemini ya está configurada
    echo       GEMINI_API_KEY=%API_KEY%
    echo    3. Reinicia el servidor
)

echo.
pause
