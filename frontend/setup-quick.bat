@echo off
echo 🚀 Configurando API Key de Google Gemini...
echo =====================================
echo.

set "API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs"

echo # Google Gemini API Configuration > .env.local
echo NEXT_PUBLIC_GEMINI_API_KEY=%API_KEY% >> .env.local

if exist .env.local (
    echo ✅ Archivo .env.local creado exitosamente!
    echo 📍 Ubicación: %cd%\.env.local
    echo.
    echo 🔄 Pasos siguientes:
    echo    1. Reinicia el servidor de desarrollo: npm run dev
    echo    2. Ve a http://localhost:3000/ para usar el asistente
    echo.
    echo 🎉 ¡Tu asistente virtual con IA ya está listo!
    echo.
    echo 📝 Tu API Key: %API_KEY%
) else (
    echo ❌ Error al crear el archivo .env.local
    echo.
    echo 💡 Alternativa manual:
    echo    1. Crea el archivo .env.local en esta carpeta
    echo    2. Agrega esta línea:
    echo       NEXT_PUBLIC_GEMINI_API_KEY=%API_KEY%
    echo    3. Reinicia el servidor
)

echo.
echo 📖 Lee el README_SETUP.md para más detalles
echo.
pause
