import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8080';

let mcpSessionId: string | null = null;
let mcpRequestId = 0;

/**
 * Llama al servidor MCP para obtener datos financieros
 */
async function callMCPTool(toolName: string, args: Record<string, any> = {}) {
  try {
    mcpRequestId++;

    // Inicializar sesión si no existe
    if (!mcpSessionId) {
      const initPayload = {
        jsonrpc: '2.0',
        method: 'initialize',
        id: mcpRequestId,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'chat-api',
            version: '1.0.0'
          }
        }
      };

      const initResponse = await fetch(`${MCP_SERVER_URL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify(initPayload)
      });

      if (initResponse.ok) {
        mcpSessionId = initResponse.headers.get('mcp-session-id');
      }
    }

    // Llamar a la herramienta
    const payload = {
      jsonrpc: '2.0',
      method: 'tools/call',
      id: ++mcpRequestId,
      params: {
        name: toolName,
        arguments: args
      }
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };

    if (mcpSessionId) {
      headers['mcp-session-id'] = mcpSessionId;
    }

    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error MCP: ${response.status}`);
    }

    const text = await response.text();
    let data;

    // Parsear SSE o JSON
    if (text.startsWith('event: message')) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          data = JSON.parse(line.substring(6));
          break;
        }
      }
    } else {
      data = JSON.parse(text);
    }

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  } catch (error) {
    console.error(`Error al llamar herramienta MCP ${toolName}:`, error);
    return null;
  }
}

/**
 * Detecta qué herramienta MCP usar basándose en el mensaje del usuario
 */
function detectMCPTool(message: string): { tool: string; args: any } | null {
  const lowerMessage = message.toLowerCase();

  // Balance de empresa
  if (lowerMessage.includes('balance') && (lowerMessage.includes('empresa') || lowerMessage.includes('compañía') || lowerMessage.includes('negocio'))) {
    return { tool: 'get_company_balance', args: {} };
  }

  // Balance personal
  if (lowerMessage.includes('balance') && (lowerMessage.includes('personal') || lowerMessage.includes('mío') || lowerMessage.includes('mi'))) {
    return { tool: 'get_personal_balance', args: {} };
  }

  // Gastos por categoría - MEJORADO
  if (lowerMessage.includes('gasto') || lowerMessage.includes('analizar') && (lowerMessage.includes('categoría') || lowerMessage.includes('categoria') || lowerMessage.includes('áreas') || lowerMessage.includes('areas') || lowerMessage.includes('oportunidad'))) {
    return { tool: 'analyze_expenses_by_category', args: {} };
  }

  // Proyección de flujo
  if (lowerMessage.includes('proyección') || lowerMessage.includes('proyeccion') || lowerMessage.includes('flujo')) {
    return { tool: 'project_cash_flow', args: {} };
  }

  // Salud financiera
  if (lowerMessage.includes('salud') && lowerMessage.includes('financiera')) {
    return { tool: 'get_financial_health_score', args: {} };
  }

  // Tendencias
  if (lowerMessage.includes('tendencia') || lowerMessage.includes('tendencias')) {
    return { tool: 'get_spending_trends', args: {} };
  }

  // Recomendaciones
  if (lowerMessage.includes('recomendación') || lowerMessage.includes('recomendacion') || lowerMessage.includes('recomienda')) {
    return { tool: 'get_category_recommendations', args: {} };
  }

  // Anomalías
  if (lowerMessage.includes('anomalía') || lowerMessage.includes('anomalia') || lowerMessage.includes('extraño')) {
    return { tool: 'detect_anomalies', args: {} };
  }

  // Riesgo
  if (lowerMessage.includes('riesgo')) {
    return { tool: 'assess_financial_risk', args: {} };
  }

  // Alertas
  if (lowerMessage.includes('alerta') || lowerMessage.includes('alertas')) {
    return { tool: 'get_alerts', args: {} };
  }

  // Escasez de efectivo
  if (lowerMessage.includes('escasez') || lowerMessage.includes('falta') && lowerMessage.includes('efectivo')) {
    return { tool: 'predict_cash_shortage', args: {} };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Extraer información del usuario
    const username = userInfo?.username || 'Usuario';
    const userType = userInfo?.type || 'desconocido';
    const userId = userInfo?.userId || '';

    // Detectar si necesitamos llamar al MCP
    const mcpTool = detectMCPTool(message);
    let mcpData = null;
    let mcpContext = '';

    if (mcpTool) {
      console.log(`[Chat] Detectada herramienta MCP: ${mcpTool.tool}`);
      console.log(`[Chat] URL del servidor MCP: ${MCP_SERVER_URL}`);
      console.log(`[Chat] Usuario: ${username} (${userType})`);
      
      // Agregar el ID del usuario a los argumentos del MCP
      const mcpArgs = { ...mcpTool.args };
      if (userType === 'empresa') {
        mcpArgs.company_id = userId;
      } else if (userType === 'personal') {
        mcpArgs.user_id = userId;
      }
      
      mcpData = await callMCPTool(mcpTool.tool, mcpArgs);
      
      if (mcpData) {
        console.log(`[Chat] Datos MCP recibidos:`, mcpData);
        if (mcpData.structuredContent) {
          mcpContext = `\n\nDATOS FINANCIEROS REALES (del servidor MCP):\n${JSON.stringify(mcpData.structuredContent, null, 2)}`;
        }
      } else {
        console.log(`[Chat] No se recibieron datos del MCP`);
      }
    } else {
      console.log(`[Chat] No se detectó herramienta MCP para el mensaje: "${message}"`);
    }

    // Construir contexto del usuario
    const userContext = userType === 'empresa' 
      ? `\n\nCONTEXTO DEL USUARIO:
- Nombre: ${username}
- Tipo de cuenta: Empresa
- ID de empresa: ${userId}
- Estás ayudando con finanzas empresariales`
      : `\n\nCONTEXTO DEL USUARIO:
- Nombre: ${username}
- Tipo de cuenta: Personal
- ID de usuario: ${userId}
- Estás ayudando con finanzas personales`;

    // Contexto bancario para el asistente
    const systemPrompt = `Eres Maya, la asistente virtual financiera de Banorte, un banco mexicano. 
Tu trabajo es ayudar a los clientes con información financiera usando datos REALES de un servidor MCP.

IDENTIDAD:
- Tu nombre es Maya
- Eres amigable, profesional y experta en finanzas
- Siempre te presentas como "Maya, tu asistente financiera de Banorte" en la primera interacción
- Personalizas tus respuestas según el tipo de cuenta del usuario (empresa o personal)

Tienes acceso a las siguientes herramientas financieras:
- Balance de empresa y personal
- Análisis de gastos por categoría
- Proyecciones de flujo de caja
- Simulaciones de escenarios
- Evaluación de salud financiera
- Detección de anomalías
- Recomendaciones personalizadas
- Alertas y predicciones

IMPORTANTE: 
- Si te proporcionan datos financieros reales (marcados como "DATOS FINANCIEROS REALES"), ÚSALOS en tu respuesta.
- Presenta los números de forma clara y legible (con separadores de miles y formato de moneda MXN).
- Da insights y análisis útiles basados en los datos.
- Personaliza tus respuestas usando el nombre del usuario cuando sea apropiado.
- Si es una cuenta de empresa, enfócate en métricas empresariales (ROI, flujo de caja, etc.).
- Si es una cuenta personal, enfócate en ahorro, presupuesto personal y metas financieras.
- Si no hay datos disponibles, explica qué información necesitas.

Responde de manera profesional, clara y en español.${userContext}${mcpContext}`;

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
          maxOutputTokens: 2048,
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
      mcpData: mcpData?.structuredContent || null,
      mcpTool: mcpTool?.tool || null,
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