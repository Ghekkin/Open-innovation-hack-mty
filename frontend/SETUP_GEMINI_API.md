# 🚀 Configuración Rápida de Gemini API

¡Ya tienes tu API key! Aquí están las opciones más rápidas para configurarla:

## ⚡ **Opción 1: Script Automático (Windows)**

**Ejecuta este comando en PowerShell:**
```powershell
node create-env.js
```

**O ejecuta el archivo .bat:**
```cmd
setup-env.bat
```

## ⚡ **Opción 2: Manual (Más Rápido)**

1. **Crea el archivo** `.env.local` en la carpeta `frontend/`

2. **Copia y pega este contenido:**
```bash
# Google Gemini API Configuration
# Tu API key de Gemini ya está configurada
GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs

# ¡Tu API key está configurada y lista para usar!
# El asistente virtual con IA ya debería funcionar
```

3. **Guarda el archivo** y reinicia el servidor:
```bash
npm run dev
```

4. **Ve a** `http://localhost:3000/dashboard` para usar el asistente

## ✅ **Verificación**

Una vez configurado, deberías ver:
- ✅ En la consola: "Google Gemini API Key configurada correctamente"
- ✅ En el dashboard: El asistente virtual funcional (sin la pantalla de configuración)
- ✅ Chat en tiempo real con respuestas de IA

## 🧪 **Probar el Asistente**

Escribe consultas como:
- "¿Cómo consulto mi saldo?"
- "¿Cuáles son los requisitos para una tarjeta de crédito?"
- "¿Cómo hago una transferencia?"

## 🔧 **Si hay problemas:**

1. **Verifica que el archivo se creó correctamente:**
   ```bash
   ls -la .env.local
   ```

2. **Revisa el contenido del archivo:**
   ```bash
   cat .env.local
   ```

3. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

---

**¡Tu API key:** `AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs`

**🎉 ¡Listo para usar el asistente virtual con IA!**
