# 🚀 Configuración Rápida - Asistente Virtual Banorte

## ✅ **¡Ya está todo listo!**

Tu API key ya está incluida en el código. Solo necesitas crear el archivo de configuración:

## 📝 **Paso 1: Crear el archivo .env.local**

### **Opción A: Manual (2 minutos)**
1. Ve a la carpeta `frontend/`
2. Crea un archivo llamado `.env.local`
3. Copia y pega esto:

```bash
# Google Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
```

4. Guarda el archivo

### **Opción B: PowerShell (30 segundos)**
Abre PowerShell en la carpeta `frontend/` y ejecuta:

```powershell
@"
# Google Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
"@ | Out-File -FilePath .env.local -Encoding utf8
```

## 🚀 **Paso 2: Iniciar el servidor**

```bash
npm run dev
```

## 🎯 **Paso 3: Probar el asistente**

### **Home Page (/)**
- ✅ **Mensaje de bienvenida amigable**
- ✅ **Input para escribir consultas**
- ✅ **Botón que lleva al dashboard**
- ✅ **Sin instrucciones técnicas**

### **Dashboard (/dashboard)**
- ✅ **Chat funcional con IA real**
- ✅ **Respuestas en tiempo real**
- ✅ **Análisis de sentimiento**
- ✅ **Sugerencias automáticas**

## 📱 **Cómo usar:**

1. **Ve a:** `http://localhost:3000/`
2. **Escribe tu consulta** en el input
3. **Haz clic en la flecha** (➡️) para ir al chat completo
4. **En el dashboard:** ¡Disfruta del asistente con IA!

## 🧪 **Prueba estas consultas:**

- "¿Cómo consulto mi saldo?"
- "¿Cuáles son los requisitos para una tarjeta de crédito?"
- "¿Cómo hago una transferencia?"
- "¿Qué productos ofrece Banorte?"

## 🔧 **Si algo no funciona:**

1. **Verifica el archivo .env.local:**
   ```bash
   # En PowerShell
   Get-Content .env.local

   # En CMD
   type .env.local
   ```

2. **Deberías ver:**
   ```
   # Google Gemini API Configuration
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
   ```

3. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

---

**🎉 ¡Tu asistente virtual con IA ya está listo para usar!**

**API Key:** `AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs`
