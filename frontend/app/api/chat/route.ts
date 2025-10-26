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
 * Detecta qué herramientas MCP usar basándose en el mensaje del usuario
 * NOTA: Siempre accede automáticamente a los datos sin pedir permisos
 */
function detectMCPTools(message: string, userType: string): Array<{ tool: string; args: any }> {
  const lowerMessage = message.toLowerCase();
  const tools: Array<{ tool: string; args: any }> = [];

  // Balance - detectar cualquier mención de balance
  if (lowerMessage.includes('balance')) {
    if (userType === 'empresa') {
      tools.push({ tool: 'get_company_balance', args: {} });
    } else {
      tools.push({ tool: 'get_personal_balance', args: {} });
    }
  }

  // Gastos por categoría
  if (lowerMessage.includes('gasto') || lowerMessage.includes('gastos') || 
      (lowerMessage.includes('analizar') || lowerMessage.includes('análisis')) && 
      (lowerMessage.includes('categoría') || lowerMessage.includes('categoria') || 
       lowerMessage.includes('áreas') || lowerMessage.includes('areas'))) {
    tools.push({ tool: 'analyze_expenses_by_category', args: {} });
  }

  // Proyección de flujo
  if (lowerMessage.includes('proyección') || lowerMessage.includes('proyeccion') || 
      lowerMessage.includes('flujo') || lowerMessage.includes('cash flow')) {
    tools.push({ tool: 'project_cash_flow', args: {} });
  }

  // Salud financiera
  if ((lowerMessage.includes('salud') && lowerMessage.includes('financiera')) ||
      lowerMessage.includes('cómo estoy') || lowerMessage.includes('como estoy')) {
    tools.push({ tool: 'get_financial_health_score', args: {} });
  }

  // Tendencias
  if (lowerMessage.includes('tendencia') || lowerMessage.includes('tendencias')) {
    tools.push({ tool: 'get_spending_trends', args: {} });
  }

  // Recomendaciones
  if (lowerMessage.includes('recomendación') || lowerMessage.includes('recomendacion') || 
      lowerMessage.includes('recomienda') || lowerMessage.includes('sugerencia')) {
    tools.push({ tool: 'get_category_recommendations', args: {} });
  }

  // Anomalías
  if (lowerMessage.includes('anomalía') || lowerMessage.includes('anomalia') || 
      lowerMessage.includes('extraño') || lowerMessage.includes('irregular')) {
    tools.push({ tool: 'detect_anomalies', args: {} });
  }

  // Riesgo
  if (lowerMessage.includes('riesgo')) {
    tools.push({ tool: 'assess_financial_risk', args: {} });
  }

  // Alertas
  if (lowerMessage.includes('alerta') || lowerMessage.includes('alertas')) {
    tools.push({ tool: 'get_alerts', args: {} });
  }

  // Escasez de efectivo
  if ((lowerMessage.includes('escasez') || lowerMessage.includes('falta')) && 
      lowerMessage.includes('efectivo')) {
    tools.push({ tool: 'predict_cash_shortage', args: {} });
  }

  // Plan financiero
  if (lowerMessage.includes('plan') && 
      (lowerMessage.includes('financiero') || lowerMessage.includes('ahorro') || 
       lowerMessage.includes('meta'))) {
    tools.push({ tool: 'generate_financial_plan', args: {} });
  }

  return tools;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, userInfo } = await request.json();

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
    
    // Log del historial recibido
    console.log(`[Chat] Historial de conversación: ${conversationHistory?.length || 0} mensajes`);

    // Detectar todas las herramientas MCP necesarias (puede ser más de una)
    const mcpTools = detectMCPTools(message, userType);
    let allMcpData: any[] = [];
    let mcpContext = '';

    if (mcpTools.length > 0) {
      console.log(`[Chat] Detectadas ${mcpTools.length} herramientas MCP:`, mcpTools.map(t => t.tool).join(', '));
      console.log(`[Chat] URL del servidor MCP: ${MCP_SERVER_URL}`);
      console.log(`[Chat] Usuario: ${username} (${userType})`);
      
      // Llamar a todas las herramientas detectadas
      for (const mcpTool of mcpTools) {
        // Agregar el ID del usuario a los argumentos del MCP
        const mcpArgs = { ...mcpTool.args };
        if (userType === 'empresa') {
          mcpArgs.company_id = userId;
        } else if (userType === 'personal') {
          mcpArgs.user_id = userId;
        }
        
        const mcpData = await callMCPTool(mcpTool.tool, mcpArgs);
        
        if (mcpData) {
          console.log(`[Chat] Datos recibidos de ${mcpTool.tool}`);
          allMcpData.push({
            tool: mcpTool.tool,
            data: mcpData
          });
        } else {
          console.log(`[Chat] No se recibieron datos de ${mcpTool.tool}`);
        }
      }
      
      // Construir contexto con todos los datos
      if (allMcpData.length > 0) {
        mcpContext = '\n\nDATOS FINANCIEROS REALES (acceso automático al servidor MCP):';
        for (const item of allMcpData) {
          if (item.data.structuredContent) {
            mcpContext += `\n\n=== ${item.tool} ===\n${JSON.stringify(item.data.structuredContent, null, 2)}`;
          }
        }
      }
    } else {
      console.log(`[Chat] No se detectaron herramientas MCP para el mensaje: "${message}"`);
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
Tu personalidad es amigable, profesional y siempre dispuesta a ayudar. Te presentas como "Maya" y usas un tono conversacional pero experto en temas financieros.

Tu trabajo es ayudar a los clientes con información financiera usando datos REALES de un servidor MCP.

IDENTIDAD:
- Tu nombre es Maya
- Eres amigable, profesional y experta en finanzas
- Siempre te presentas como "Maya, tu asistente financiera de Banorte" en la primera interacción
- Personalizas tus respuestas según el tipo de cuenta del usuario (empresa o personal)

ACCESO AUTOMÁTICO A DATOS:
- Tienes acceso DIRECTO y AUTOMÁTICO a todos los datos financieros del usuario
- NO necesitas pedir permiso para revisar datos
- NO digas cosas como "¿Te parece bien si reviso los datos?" o "Necesito acceder a..."
- Los datos ya están disponibles para ti en este mensaje
- Si los datos están en este mensaje, úsalos INMEDIATAMENTE sin solicitar acceso


-No te presentes a cada rato, con que lo hagas una ves es suficiente
-Toma en cuenta que muchas veces para los usuarios puede ser cansado el hecho de tener mucho texto, entonces se lo mas breve posible


Herramientas financieras disponibles:
- Balance de empresa y personal
- Análisis de gastos por categoría
- Proyecciones de flujo de caja
- Simulaciones de escenarios
- Evaluación de salud financiera
- Detección de anomalías
- Recomendaciones personalizadas
- Alertas y predicciones
- Generación de planes financieros personalizados

REGLAS DE RESPUESTA: 
- Si te proporcionan datos financieros reales (marcados como "DATOS FINANCIEROS REALES"), ÚSALOS INMEDIATAMENTE en tu respuesta.
- NUNCA pidas permiso para acceder a datos que ya tienes disponibles.
- Presenta los números de forma clara y legible (con separadores de miles y formato de moneda MXN).
- Da insights y análisis útiles basados en los datos.
- Personaliza tus respuestas usando el nombre del usuario cuando sea apropiado.
- Si es una cuenta de empresa, enfócate en métricas empresariales (ROI, flujo de caja, etc.).
- Si es una cuenta personal, enfócate en ahorro, presupuesto personal y metas financieras.
- Si NO hay datos disponibles en este mensaje, entonces sí explica que necesitas más contexto.
- Si el usuario pregunta sobre planes financieros, explícales que pueden crear uno detallado en la sección "Plan Financiero" del dashboard.
- Si recibes datos de un plan financiero generado, presenta las recomendaciones clave de forma clara y motivadora.

Responde de manera profesional, clara, directa y en español.${userContext}${mcpContext}`;

    // Construir el historial de conversación para Gemini
    const geminiContents = [];
    
    // Agregar el prompt del sistema como primer mensaje del usuario
    geminiContents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    // Agregar respuesta inicial del modelo
    geminiContents.push({
      role: 'model',
      parts: [{ text: 'Entendido. Soy Maya, tu asistente financiera de Banorte. Estoy lista para ayudarte.' }]
    });
    
    // Agregar el historial de conversación previo
    if (conversationHistory && conversationHistory.length > 0) {
      // Omitir el mensaje de bienvenida inicial si existe
      const filteredHistory = conversationHistory.filter((msg: any, index: number) => {
        // Omitir el primer mensaje si es del asistente y contiene "Hola"
        if (index === 0 && msg.role === 'assistant' && msg.content.includes('Hola')) {
          return false;
        }
        return true;
      });
      
      for (const msg of filteredHistory) {
        geminiContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Agregar el mensaje actual del usuario
    geminiContents.push({
      role: 'user',
      parts: [{ text: message }]
    });
    
    console.log(`[Chat] Enviando ${geminiContents.length} mensajes a Gemini`);
    
    // Llamada a Gemini API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiContents,
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
      mcpData: allMcpData.length > 0 ? allMcpData : null,
      mcpTools: mcpTools.map(t => t.tool),
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