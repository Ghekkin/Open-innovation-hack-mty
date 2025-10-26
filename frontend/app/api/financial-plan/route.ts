import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8080';

let mcpSessionId: string | null = null;
let mcpRequestId = 0;

/**
 * Llama al servidor MCP para generar un plan financiero
 */
async function generateFinancialPlanMCP(params: {
  entity_type: string;
  entity_id: string;
  plan_goal: string;
  use_saved_data: boolean;
  additional_incomes: any[];
  additional_expenses: any[];
  planning_horizon_months: number;
}) {
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
            name: 'financial-plan-api',
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

    // Llamar a la herramienta generate_financial_plan
    const payload = {
      jsonrpc: '2.0',
      method: 'tools/call',
      id: ++mcpRequestId,
      params: {
        name: 'generate_financial_plan',
        arguments: params
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
      console.error('[MCP Client] Error response:', errorText);
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
      throw new Error(data.error.message);
    }

    // FastMCP retorna el resultado en data.result que puede ser:
    // 1. Directamente el objeto (si FastMCP lo serializa automáticamente)
    // 2. Un objeto con { content: [{ type: "text", text: "..." }] } (protocolo MCP estándar)
    let finalResult = data.result;
    
    // Si el resultado tiene la estructura de MCP con content array
    if (finalResult && finalResult.content && Array.isArray(finalResult.content)) {
      const textContent = finalResult.content.find((c: any) => c.type === 'text');
      if (textContent && textContent.text) {
        finalResult = JSON.parse(textContent.text);
      }
    }
    
    return finalResult;
  } catch (error) {
    console.error('Error al generar plan financiero:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      planOption,
      customIncomes,
      customExpenses,
      planGoal,
      userInfo
    } = body;

    if (!planGoal || planGoal.trim() === '') {
      return NextResponse.json(
        { error: 'La meta del plan financiero es requerida' },
        { status: 400 }
      );
    }

    // Extraer información del usuario
    const userType = userInfo?.type || 'personal';
    const userId = userInfo?.userId || '';

    // Preparar datos para el MCP
    const use_saved_data = planOption === 'saved';
    
    // Convertir los ingresos y gastos adicionales al formato esperado por el backend
    const additional_incomes = customIncomes?.map((income: any) => ({
      description: income.description,
      amount: income.amount,
      frequency: income.frequency,
      start_date: income.startDate,
      end_date: income.endDate,
      is_indefinite: income.isIndefinite
    })) || [];

    const additional_expenses = customExpenses?.map((expense: any) => ({
      description: expense.description,
      amount: expense.amount,
      frequency: expense.frequency,
      start_date: expense.startDate,
      end_date: expense.endDate,
      is_indefinite: expense.isIndefinite
    })) || [];

    // Llamar al MCP para generar el plan
    const planData = await generateFinancialPlanMCP({
      entity_type: userType,
      entity_id: userId,
      plan_goal: planGoal,
      use_saved_data: use_saved_data,
      additional_incomes: additional_incomes,
      additional_expenses: additional_expenses,
      planning_horizon_months: 12
    });

    return NextResponse.json({
      success: true,
      plan: planData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en financial-plan API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false
      },
      { status: 500 }
    );
  }
}

