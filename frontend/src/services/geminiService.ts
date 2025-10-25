import { GoogleGenAI } from '@google/genai';

// Configuración de Gemini
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const genAI = new GoogleGenAI({ apiKey: API_KEY || 'dummy_key_for_initialization' });

export class GeminiService {
  private genAI;

  constructor() {
    this.genAI = genAI;
  }

  /**
   * Envía un mensaje a Gemini y obtiene una respuesta
   * @param prompt - El mensaje del usuario
   * @param context - Contexto adicional (opcional)
   * @returns Promise con la respuesta de Gemini
   */
  async generateResponse(prompt: string, context?: string): Promise<string> {
    // Verificar API key
    if (!API_KEY || API_KEY === 'your_api_key_here' || API_KEY === 'dummy_key_for_initialization') {
      throw new Error('API Key de Gemini no configurada. Por favor configura NEXT_PUBLIC_GEMINI_API_KEY en el archivo .env.local');
    }

    try {
      const fullPrompt = context
        ? `${context}\n\nUsuario: ${prompt}\n\nAsistente:`
        : `Eres un asistente virtual de Banorte, un banco mexicano. Responde de manera profesional, útil y en español.\n\nUsuario: ${prompt}\n\nAsistente:`;

      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: fullPrompt
      });

      return result.text;
    } catch (error) {
      console.error('Error al generar respuesta con Gemini:', error);

      // Manejo específico de errores de API key
      if (error instanceof Error && error.message.includes('API_KEY')) {
        throw new Error('API Key de Gemini inválida o expirada. Por favor verifica tu configuración.');
      }

      throw new Error('No se pudo generar una respuesta. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Genera una respuesta para preguntas bancarias específicas
   */
  async generateBankingResponse(query: string): Promise<string> {
    const bankingContext = `
Eres un asistente virtual especializado en servicios bancarios de Banorte.
Responde de manera profesional, clara y en español.
Proporciona información precisa sobre productos y servicios bancarios.
Si no estás seguro de una respuesta, indica que el usuario debe contactar a un asesor.

Productos y servicios de Banorte:
- Cuentas de ahorro y cheques
- Tarjetas de crédito y débito
- Créditos personales, hipotecarios y automotrices
- Inversiones y fondos de inversión
- Seguros
- Servicios digitales (app, banca en línea)
- Transferencias y pagos
`;

    return this.generateResponse(query, bankingContext);
  }

  /**
   * Analiza el sentimiento de una consulta
   */
  async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    try {
      const prompt = `Analiza el sentimiento del siguiente texto y responde solo con: "positive", "negative" o "neutral".

Texto: "${text}"`;

      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt
      });

      const sentiment = result.text.toLowerCase().trim();

      if (sentiment.includes('positive')) return 'positive';
      if (sentiment.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Error analizando sentimiento:', error);
      return 'neutral';
    }
  }

  /**
   * Genera sugerencias basadas en la consulta del usuario
   */
  async generateSuggestions(query: string): Promise<string[]> {
    try {
      const prompt = `Basándote en la consulta del usuario, genera 3 sugerencias de preguntas relacionadas que podrían ser útiles. Responde solo con las 3 preguntas separadas por punto y coma (;), sin numeración ni texto adicional.

Consulta del usuario: "${query}"

Sugerencias:`;

      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt
      });

      const suggestions = result.text.split(';').map(s => s.trim());

      return suggestions.slice(0, 3);
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      return [];
    }
  }
}

// Instancia singleton para usar en toda la aplicación
export const geminiService = new GeminiService();
