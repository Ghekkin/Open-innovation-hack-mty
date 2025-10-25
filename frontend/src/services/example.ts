// Ejemplo de uso del servicio Gemini
import { geminiService } from './geminiService';

/**
 * Ejemplo básico de uso
 */
export async function exampleUsage() {
  try {
    // 1. Consulta bancaria básica
    const response1 = await geminiService.generateBankingResponse(
      "¿Cómo puedo consultar mi saldo?"
    );
    console.log("Respuesta bancaria:", response1);

    // 2. Análisis de sentimiento
    const sentiment = await geminiService.analyzeSentiment(
      "Estoy muy contento con el servicio"
    );
    console.log("Sentimiento:", sentiment); // "positive"

    // 3. Generar sugerencias
    const suggestions = await geminiService.generateSuggestions(
      "¿Cómo abro una cuenta?"
    );
    console.log("Sugerencias:", suggestions);

  } catch (error) {
    console.error("Error en ejemplo:", error);
  }
}

/**
 * Ejemplo para usar en React components
 */
export const useGeminiExample = () => {
  const askGemini = async (question: string) => {
    try {
      const response = await geminiService.generateBankingResponse(question);
      return response;
    } catch (error) {
      console.error("Error:", error);
      return "Lo siento, no pude procesar tu consulta.";
    }
  };

  return { askGemini };
};
