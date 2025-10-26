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
      const errorText = await response.text();
      console.error(`[MCP Error ${response.status}] ${toolName}:`, errorText);
      console.error(`[MCP Error] Payload enviado:`, JSON.stringify(payload, null, 2));
      throw new Error(`Error MCP: ${response.status} - ${errorText}`);
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
      console.error(`[MCP Tool Error] ${toolName}:`, data.error);
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

  // SIMULACIONES WHAT-IF - ¡LO MÁS IMPORTANTE!
  // Detectar preguntas de simulación: "qué pasa si", "puedo contratar", "si aumento", "si suben"
  if (lowerMessage.includes('qué pasa si') || lowerMessage.includes('que pasa si') ||
      lowerMessage.includes('what if') || lowerMessage.includes('si aumento') ||
      lowerMessage.includes('si suben') || lowerMessage.includes('si bajan') ||
      lowerMessage.includes('si reduzco') || lowerMessage.includes('si aumentan') ||
      (lowerMessage.includes('puedo contratar') || lowerMessage.includes('puedo contratar')) ||
      (lowerMessage.includes('contratar') && (lowerMessage.includes('alguien') || lowerMessage.includes('nuevo') || lowerMessage.includes('empleado'))) ||
      (lowerMessage.includes('simula') || lowerMessage.includes('simular'))) {
    
    // Para simulaciones de gastos, incluir análisis de categorías automáticamente
    if (lowerMessage.includes('gasto') || lowerMessage.includes('suben') || lowerMessage.includes('aumentan')) {
      tools.push({ tool: 'analyze_expenses_by_category', args: {} });
    }
    
    // Obtener el balance actual
    if (userType === 'empresa') {
      tools.push({ tool: 'get_company_balance', args: {} });
    } else {
      tools.push({ tool: 'get_personal_balance', args: {} });
    }
    
    // Extraer números del mensaje para los cambios
    const numbers = message.match(/\d+[,.]?\d*/g);
    let monthlyIncomeChange = 0;
    let monthlyExpenseChange = 0;
    let isPercentage = false;
    let percentageValue = 0;
    
    if (numbers && numbers.length > 0) {
      const amount = parseFloat(numbers[0].replace(',', ''));
      
      // Detectar si es porcentaje
      if (lowerMessage.includes('%') || lowerMessage.includes('porciento') || lowerMessage.includes('por ciento')) {
        isPercentage = true;
        percentageValue = amount;
        console.log(`[Chat] Detectado porcentaje: ${percentageValue}%`);
      }
      
      // Si NO es porcentaje, usar el monto directo
      if (!isPercentage) {
        // Determinar si es cambio en ingresos o gastos
        if (lowerMessage.includes('ingreso') || lowerMessage.includes('venta') || 
            lowerMessage.includes('ganancia') || lowerMessage.includes('aumento') && lowerMessage.includes('ingreso')) {
          monthlyIncomeChange = amount;
        } else if (lowerMessage.includes('gasto') || lowerMessage.includes('costo') || 
                   lowerMessage.includes('contratar') || lowerMessage.includes('sueldo') ||
                   lowerMessage.includes('salario') || lowerMessage.includes('suben')) {
          monthlyExpenseChange = amount;
        }
        
        // Agregar simulación con monto directo
        tools.push({ 
          tool: 'simulate_financial_scenario', 
          args: { 
            monthly_income_change: monthlyIncomeChange,
            monthly_expense_change: monthlyExpenseChange,
            months: 6 
          } 
        });
      } else {
        // Si es porcentaje, marcar para calcular después de obtener gastos
        tools.push({ 
          tool: 'simulate_financial_scenario', 
          args: { 
            monthly_income_change: 0,
            monthly_expense_change: 0,
            months: 6,
            _isPercentage: true,
            _percentageValue: percentageValue,
            _percentageType: lowerMessage.includes('ingreso') ? 'income' : 'expense'
          } 
        });
      }
    }
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
    
    const mcpTools = detectMCPTools(message, userType);
    let allMcpData: any[] = [];
    let mcpContext = '';

    if (mcpTools.length > 0) {
      console.log(`[Chat] Detectadas ${mcpTools.length} herramientas MCP:`, mcpTools.map(t => t.tool).join(', '));
      console.log(`[Chat] URL del servidor MCP: ${MCP_SERVER_URL}`);
      console.log(`[Chat] Usuario: ${username} (${userType})`);
      
      let currentBalance = 0;
      let totalExpenses = 0;
      let totalIncome = 0;
      
      // Llamar a todas las herramientas detectadas
      for (const mcpTool of mcpTools) {
        const mcpArgs = { ...mcpTool.args };
        if (userType === 'empresa') {
          mcpArgs.company_id = userId;
        } else if (userType === 'personal') {
          mcpArgs.user_id = userId;
        }
        
        // Si es análisis de gastos, guardar el total para porcentajes
        if (mcpTool.tool === 'analyze_expenses_by_category') {
          try {
            const expenseData = await callMCPTool(mcpTool.tool, mcpArgs);
            if (expenseData && expenseData.structuredContent) {
              totalExpenses = expenseData.structuredContent.data?.total_gastos || 0;
              console.log(`[Chat] Total de gastos obtenido: ${totalExpenses}`);
              allMcpData.push({
                tool: mcpTool.tool,
                data: expenseData
              });
            }
          } catch (error) {
            console.error(`[Chat] Error al obtener gastos por categoría, continuando sin ese dato:`, error);
            // Continuar sin los datos de categorías
          }
        }
        // Si es una herramienta de balance, guardar el balance para simulaciones
        else if (mcpTool.tool === 'get_company_balance' || mcpTool.tool === 'get_personal_balance') {
          const balanceData = await callMCPTool(mcpTool.tool, mcpArgs);
          if (balanceData && balanceData.structuredContent) {
            currentBalance = balanceData.structuredContent.data?.balance || 0;
            totalIncome = balanceData.structuredContent.data?.ingresos || 0;
            totalExpenses = balanceData.structuredContent.data?.gastos || 0;
            console.log(`[Chat] Balance actual obtenido: ${currentBalance}, Ingresos: ${totalIncome}, Gastos: ${totalExpenses}`);
            allMcpData.push({
              tool: mcpTool.tool,
              data: balanceData
            });
          }
        }
        // Si es simulación, usar el balance obtenido
        else if (mcpTool.tool === 'simulate_financial_scenario') {
          mcpArgs.current_balance = currentBalance;
          
          // Si es porcentaje, calcular el monto basado en gastos/ingresos REALES
          if (mcpArgs._isPercentage) {
            const percentageValue = mcpArgs._percentageValue;
            const percentageType = mcpArgs._percentageType;
            
            if (percentageType === 'expense') {
              // Usar gastos totales reales
              if (totalExpenses > 0) {
                // Calcular gasto mensual promedio (asumiendo que totalExpenses es histórico)
                const monthlyExpense = totalExpenses / 12; // Promedio mensual
                mcpArgs.monthly_expense_change = monthlyExpense * (percentageValue / 100);
                console.log(`[Chat] Calculado ${percentageValue}% de gastos mensuales (${monthlyExpense}): ${mcpArgs.monthly_expense_change}`);
              } else {
                console.log(`[Chat] No hay datos de gastos, usando estimación`);
                mcpArgs.monthly_expense_change = Math.abs(currentBalance * 0.01) * (percentageValue / 100);
              }
            } else {
              // Usar ingresos totales reales
              if (totalIncome > 0) {
                const monthlyIncome = totalIncome / 12; // Promedio mensual
                mcpArgs.monthly_income_change = monthlyIncome * (percentageValue / 100);
                console.log(`[Chat] Calculado ${percentageValue}% de ingresos mensuales (${monthlyIncome}): ${mcpArgs.monthly_income_change}`);
              } else {
                console.log(`[Chat] No hay datos de ingresos, usando estimación`);
                mcpArgs.monthly_income_change = Math.abs(currentBalance * 0.01) * (percentageValue / 100);
              }
            }
            
            // Limpiar flags internos
            delete mcpArgs._isPercentage;
            delete mcpArgs._percentageValue;
            delete mcpArgs._percentageType;
          }
          
          console.log(`[Chat] Simulando con balance: ${currentBalance}, income_change: ${mcpArgs.monthly_income_change}, expense_change: ${mcpArgs.monthly_expense_change}`);
          
          const mcpData = await callMCPTool(mcpTool.tool, mcpArgs);
          
          if (mcpData) {
            console.log(`[Chat] Datos de simulación recibidos`);
            allMcpData.push({
              tool: mcpTool.tool,
              data: mcpData
            });
          }
        }
        // Otras herramientas
        else {
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

ACCESO AUTOMÁTICO A DATOS - MUY IMPORTANTE:
- Tienes acceso DIRECTO y AUTOMÁTICO a todos los datos financieros del usuario
- NO necesitas pedir permiso para revisar datos
- NO digas cosas como "¿Te parece bien si reviso los datos?" o "Necesito acceder a..."
- NO preguntes "¿Deseas que realice la simulación?" - ¡SOLO HAZLO!
- NO preguntes "¿Te gustaría que te ayudara a...?" - ¡SOLO AYUDA!
- Los datos ya están disponibles para ti en este mensaje
- Si los datos están en este mensaje, úsalos INMEDIATAMENTE sin solicitar acceso
- Cuando el usuario pregunta algo, RESPONDE DIRECTAMENTE con los datos, no pidas confirmación

ESTILO DE RESPUESTA:
- NO te presentes a cada rato, con que lo hagas una vez es suficiente
- Sé BREVE y DIRECTO - el usuario no quiere leer mucho texto
- NO preguntes si quiere más análisis al final - si es relevante, INCLÚYELO directamente
- Ejemplo MALO: "¿Te gustaría que analice tus gastos por categoría?"
- Ejemplo BUENO: "Analicé tus gastos por categoría: [datos]"
- Si tienes datos relevantes adicionales, MUÉSTRALOS sin preguntar


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

INTERPRETACIÓN DE SIMULACIONES (WHAT-IF):
- Cuando recibes datos de "simulate_financial_scenario", tienes una proyección mes a mes del balance.
- SIEMPRE muestra los resultados de forma visual y clara:
  * Balance inicial
  * Cambio mensual (ingresos/gastos)
  * Balance proyectado en 3 y 6 meses
  * Si el balance se vuelve negativo, ALERTA INMEDIATA
- Ejemplo de respuesta:
  "📊 SIMULACIÓN: Si tus gastos suben 20%:
   
   Gastos actuales: $X/mes
   Aumento: +$Y (20%)
   Nuevos gastos: $Z/mes
   
   Proyección de balance:
   • Mes 3: $A
   • Mes 6: $B
   
   ✅ Tu balance se mantiene positivo / ⚠️ Entrarías en números rojos en el mes X"
   
- NO preguntes al final "¿Te gustaría que analice...?" - Si tienes análisis relevante, INCLÚYELO directamente
- Si los gastos por categoría son relevantes, MUÉSTRALOS sin preguntar
- Cuando simulas cambios en gastos, SIEMPRE incluye las top 3-5 categorías de gasto para contexto
- Formato recomendado para categorías:
  "📊 Principales categorías de gasto:
   1. [Categoría]: $X (Y%)
   2. [Categoría]: $X (Y%)
   3. [Categoría]: $X (Y%)"

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
      
      // Mensaje amigable para error de cuota
      let errorMessage = 'Error al comunicarse con Gemini';
      if (errorData.error?.code === 429) {
        errorMessage = '⚠️ Se ha alcanzado el límite de uso de la API de Gemini. Por favor, intenta de nuevo en unos momentos o contacta al administrador para aumentar la cuota.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
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