# 🔑 Configuración de API Key - Google Gemini

## ✅ Tu API Key
```
AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
```

## 📝 Pasos para Configurar

### Opción 1: Crear archivo manualmente (Recomendado)

1. **Ve a la carpeta:** `frontend/`

2. **Crea un archivo nuevo** llamado `.env.local`

3. **Copia y pega este contenido:**

```bash
# Google Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
```

4. **Guarda el archivo**

5. **Reinicia el servidor:**
```bash
npm run dev
```

### Opción 2: Usar PowerShell

Ejecuta este comando en PowerShell desde la carpeta `frontend/`:

```powershell
@"
# Google Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
"@ | Out-File -FilePath .env.local -Encoding utf8
```

### Opción 3: Usar CMD

Ejecuta este comando en CMD desde la carpeta `frontend/`:

```cmd
(
echo # Google Gemini API Configuration
echo NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
) > .env.local
```

## ✅ Verificación

Después de crear el archivo, verifica que existe:

```bash
# En PowerShell
Get-Content .env.local

# En CMD
type .env.local
```

Deberías ver:
```
# Google Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
```

## 🚀 Uso en la Aplicación

### Home Page (/)
- **Vista sin funcionalidad** - Solo muestra el asistente virtual
- **Botón deshabilitado** - "Esta funcionalidad estará disponible próximamente"

### Dashboard (/dashboard)
- **Vista con funcionalidad completa** - Chat funcional con IA
- **Respuestas en tiempo real** - Powered by Google Gemini
- **Análisis de sentimiento** - Detecta emociones del usuario
- **Sugerencias inteligentes** - Preguntas relacionadas automáticas

## 📂 Archivos Configurados

### Variables de Entorno
- ✅ `NEXT_PUBLIC_GEMINI_API_KEY` - Variable pública para Next.js

### Archivos que usan la API Key
1. **`src/services/geminiService.ts`**
   - Servicio principal de Gemini
   - Usa: `process.env.NEXT_PUBLIC_GEMINI_API_KEY`

2. **`app/dashboard/page.tsx`**
   - Dashboard con funcionalidad completa
   - Verifica la API key antes de mostrar el chat

3. **`app/page.tsx`**
   - Home sin funcionalidad (solo vista)
   - No requiere API key para mostrarse

## 🔧 Troubleshooting

### Error: "API Key no configurada"
1. Verifica que el archivo `.env.local` existe en `frontend/`
2. Verifica que la variable se llama `NEXT_PUBLIC_GEMINI_API_KEY`
3. Reinicia el servidor de desarrollo

### Error: "Export GoogleGenerativeAI doesn't exist"
✅ **Ya corregido** - Ahora usa `GoogleGenAI` (sin "erative")

### Error: "Property 'response' does not exist"
✅ **Ya corregido** - Ahora usa `result.text` directamente

## 🎯 Estado Actual

✅ **API Key configurada:** AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
✅ **Imports corregidos:** `GoogleGenAI` from `@google/genai`
✅ **Modelo correcto:** `gemini-2.0-flash-001`
✅ **Respuestas correctas:** `result.text`
✅ **Home sin funcionalidad:** Solo vista
✅ **Dashboard funcional:** Chat completo con IA

---

**¡Todo listo para usar!** 🎉
