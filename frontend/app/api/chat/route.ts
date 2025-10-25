import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = 'AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Contexto bancario para el asistente
    const systemPrompt = `Eres un asistente virtual de Banorte, un banco mexicano. 
Tu trabajo es ayudar a los clientes con información sobre:
- Consultas de saldo y movimientos
- Información de productos bancarios (tarjetas, créditos, inversiones)
- Ayuda con transferencias y pagos
- Información de clientes y cuentas

Responde de manera profesional, clara y en español. Si te preguntan por información de un cliente específico, 
puedes inventar datos realistas de ejemplo (nombre, saldo, últimos movimientos, etc.) para demostrar la funcionalidad.`;

    // Llamada a Gemini API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUsuario: ${message}\n\nAsistente:`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Error de Gemini:', errorData);
      return NextResponse.json(
        { 
          error: 'Error al comunicarse con Gemini',
          details: errorData 
        },
        { status: geminiResponse.status }
      );
    }

    const data = await geminiResponse.json();
    
    // Extraer la respuesta de Gemini
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una respuesta';

    // Retornar tanto la respuesta interpretada como el JSON completo
    return NextResponse.json({
      success: true,
      response: aiResponse,
      rawJson: data, // JSON completo de la API
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en chat:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        response: 'Lo siento, hubo un error al procesar tu mensaje.'
      },
      { status: 500 }
    );
  }
}