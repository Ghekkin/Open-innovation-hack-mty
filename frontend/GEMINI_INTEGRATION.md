# 🚀 Integración de Google Gemini API

Este proyecto está configurado para usar **Google Gemini** como asistente virtual inteligente para consultas bancarias.

## 📋 Requisitos

1. **API Key de Google Gemini**: Obtén tu clave API en [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Configuración de variables de entorno**

## ⚙️ Configuración

### 1. Variables de Entorno

#### **Opción A: Script Automático (Recomendado)**

Ejecuta el script de configuración:

```bash
node setup-gemini.js
```

Sigue las instrucciones y ingresa tu API key cuando se te solicite.

#### **Opción B: Manual**

1. Crea el archivo `.env.local` en la raíz del proyecto frontend:

```bash
# Google Gemini API Configuration
# Tu API key ya está configurada
GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
```

**Tu API key ya está incluida arriba. Solo copia y pega el código completo.**

2. **Ejemplo real (tu clave):**
```bash
GEMINI_API_KEY=AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs
```

### 2. Instalación

Las dependencias ya están instaladas:
- ✅ `@google/genai` - SDK oficial de Google Gemini
- ✅ Material-UI - Componentes de interfaz
- ✅ TypeScript - Tipos seguros

## 🏗️ Arquitectura

```
src/
├── services/
│   └── geminiService.ts    # Servicio principal de Gemini
└── types/
    └── chat.ts             # Tipos TypeScript para el chat
```

### Servicios Disponibles

#### `GeminiService`
Clase principal para interactuar con Gemini API:

```typescript
import { geminiService } from '@/services/geminiService';

// Generar respuesta bancaria
const response = await geminiService.generateBankingResponse("¿Cómo consulto mi saldo?");

// Analizar sentimiento
const sentiment = await geminiService.analyzeSentiment("Me siento frustrado");

// Generar sugerencias
const suggestions = await geminiService.generateSuggestions("consulta de saldo");
```

## 🔧 API de Google GenAI

El servicio usa la nueva API de `@google/genai` v1.27.0:

```typescript
import { GoogleGenAI } from '@google/genai';

// Configuración
const genAI = new GoogleGenAI({ apiKey: 'your-api-key' });

// Generar contenido
const result = await genAI.models.generateContent({
  model: 'gemini-2.0-flash-001',
  contents: 'Tu consulta aquí'
});

// Obtener respuesta
const response = result.text;
```

## 🎯 Funcionalidades Implementadas

### ✅ **Chat en Tiempo Real**
- Interfaz tipo WhatsApp con avatares
- Mensajes del usuario (derecha, fondo rojo)
- Respuestas del asistente (izquierda, fondo gris)
- Timestamps en todos los mensajes

### ✅ **Análisis de Sentimiento**
- Detecta si el usuario está positivo, negativo o neutral
- Se ejecuta automáticamente con cada mensaje

### ✅ **Sugerencias Inteligentes**
- Genera preguntas relacionadas automáticamente
- Se muestran como chips clickeables
- Basadas en la consulta del usuario

### ✅ **Contexto Bancario**
- Configurado específicamente para Banorte
- Contexto especializado en productos bancarios
- Respuestas profesionales en español

## 🚀 Cómo Usar

### 1. **Configurar API Key**
```bash
# En frontend/.env.local
GEMINI_API_KEY=AIzaSyC...
```

### 2. **Ejecutar el Proyecto**
```bash
npm run dev
```

### 3. **Probar el Chat**
- Ve a `/dashboard`
- Escribe consultas como:
  - "¿Cómo consulto mi saldo?"
  - "¿Cuáles son los requisitos para una tarjeta de crédito?"
  - "¿Cómo hago una transferencia?"

## 🔧 Personalización

### Modificar el Contexto Bancario

Edita `src/services/geminiService.ts`:

```typescript
const bankingContext = `
Eres un asistente virtual especializado en servicios bancarios de [TU BANCO].
Responde de manera profesional, clara y en [IDIOMA].
...
`;
```

### Agregar Nuevos Tipos de Respuestas

```typescript
// En src/services/geminiService.ts
async generateCustomResponse(type: string, query: string): Promise<string> {
  // Implementa respuestas personalizadas
}
```

## 📊 Modelos Disponibles

- **gemini-pro**: Modelo principal para chat (recomendado)
- **gemini-pro-vision**: Para análisis de imágenes
- **gemini-1.5-flash**: Modelo rápido y eficiente

## 🐛 Solución de Problemas

### Error: "API key not found"
- Verifica que la API key esté en `.env.local`
- Reinicia el servidor de desarrollo
- Revisa la consola para errores específicos

### Error: "CORS issues"
- Asegúrate de que la API key sea válida
- Verifica que no haya restricciones en la API key

### Error: "Rate limit exceeded"
- Google Gemini tiene límites de uso
- Considera implementar cache para respuestas frecuentes

## 🔐 Seguridad

- ✅ API key en variables de entorno (no expuesta en el código)
- ✅ Validación de entrada del usuario
- ✅ Manejo de errores robusto
- ✅ Logs de errores sin información sensible

## 📈 Próximas Mejoras

- [ ] Implementar historial de conversaciones persistente
- [ ] Agregar soporte para archivos adjuntos
- [ ] Integrar con base de datos de usuarios
- [ ] Añadir respuestas de voz
- [ ] Implementar métricas de uso

## 📚 Recursos Adicionales

- [Documentación oficial de Gemini API](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Ejemplos de Material-UI](https://mui.com/material-ui/)

---

**¡Tu asistente virtual con IA ya está listo para usar!** 🎉
