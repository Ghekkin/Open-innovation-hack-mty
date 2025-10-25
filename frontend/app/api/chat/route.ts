import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Definición de herramientas MCP para Gemini
const MCP_TOOLS_DEFINITIONS = [
  {
    name: 'get_company_balance',
    description: 'Obtiene el balance financiero actual de una empresa, incluyendo ingresos totales, gastos totales y balance neto.',
    parameters: {
      type: 'object',
      properties: {
        company_id: {
          type: 'string',
          description: 'ID de la empresa (opcional, por defecto E050)'
        }
      }
    }
  },
  {
    name: 'get_financial_health_score',
    description: 'Calcula un score integral de salud financiera (0-100) analizando múltiples métricas: tasa de ahorro, ratio de gastos y balance.',
    parameters: {
      type: 'object',
      properties: {
        company_id: {
          type: 'string',
          description: 'ID de la empresa'
        }
      }
    }
  },
  {
    name: 'analyze_expenses_by_category',
    description: 'Analiza los gastos agrupados por categoría, mostrando el total gastado en cada categoría y porcentaje del total.',
    parameters: {
      type: 'object',
      properties: {
        company_id: {
          type: 'string',
          description: 'ID de la empresa'
        }
      }
    }
  },
  {
    name: 'assess_financial_risk',
    description: 'Evalúa el nivel de riesgo financiero general, analizando múltiples factores de riesgo.',
    parameters: {
      type: 'object',
      properties: {
        company_id: {
          type: 'string',
          description: 'ID de la empresa'
        }
      }
    }
  },
  {
    name: 'get_alerts',
    description: 'Obtiene alertas financieras activas que requieren atención.',
    parameters: {
      type: 'object',
      properties: {
        company_id: {
          type: 'string',
          description: 'ID de la empresa'
        }
      }
    }
  },
  {
    name: 'project_cash_flow',
    description: 'Proyecta el flujo de caja futuro basándose en el histórico de ingresos y gastos.',
    parameters: {
      type: 'object',
      properties: {
        company_id: {
          type: 'string',
          description: 'ID de la empresa'
        },
        months: {
          type: 'integer',
          description: 'Número de meses a proyectar (1-24)'
        }
      }
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    // Crear el modelo con function calling
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      tools: [{
        functionDeclarations: MCP_TOOLS_DEFINITIONS.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }))
      }]
    });

    // Construir el historial de chat (filtrar el mensaje inicial del asistente)
    const chatHistory = history
      .filter((msg: any) => msg.role === 'user' || msg.content !== messages[0]?.content)
      .map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    // Enviar el mensaje del usuario
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Verificar si Gemini quiere llamar a una función
    const functionCall = response.functionCalls()?.[0];

    if (functionCall) {
      // Gemini quiere usar una herramienta MCP
      console.log('Function call:', functionCall);

      // Llamar a la herramienta MCP
      const mcpResponse = await fetch(`${request.nextUrl.origin}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: functionCall.name,
          arguments: functionCall.args
        })
      });

      const mcpData = await mcpResponse.json();

      // Enviar la respuesta de la herramienta de vuelta a Gemini
      const result2 = await chat.sendMessage([{
        functionResponse: {
          name: functionCall.name,
          response: mcpData
        }
      }]);

      const finalResponse = result2.response.text();

      return NextResponse.json({
        response: finalResponse,
        toolUsed: functionCall.name,
        toolData: mcpData
      });
    }

    // Respuesta normal sin function calling
    return NextResponse.json({
      response: response.text(),
      toolUsed: null
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

