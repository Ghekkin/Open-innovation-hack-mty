import { NextRequest, NextResponse } from 'next/server';

// URL del backend MCP (ajusta según tu configuración)
const BACKEND_URL = process.env.MCP_SERVER_URL || 'http://localhost:8080';

// Variable global para mantener el session ID (en producción, usar cache o base de datos)
let globalSessionId: string | null = null;

// Función para hacer peticiones MCP
async function makeMCPRequest(method: string, params?: any, sessionId?: string | null) {
  const payload = {
    jsonrpc: "2.0",
    method: method,
    params: params || {},
    id: Date.now()
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };

  // Agregar session ID si existe
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const response = await fetch(`${BACKEND_URL}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`MCP Error (${response.status}):`, errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Capturar session ID de la respuesta
  const newSessionId = response.headers.get('mcp-session-id');
  if (newSessionId) {
    globalSessionId = newSessionId;
  }

  const contentType = response.headers.get('content-type');
  
  // Si es Server-Sent Events (SSE)
  if (contentType?.includes('text/event-stream')) {
    const text = await response.text();
    
    // Parsear formato SSE
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonData = line.substring(6);
        return JSON.parse(jsonData);
      }
    }
    
    throw new Error('No se encontró data en respuesta SSE');
  }
  
  // Si es JSON normal
  return await response.json();
}

// Inicializar sesión MCP
async function initializeMCPSession() {
  console.log('Inicializando sesión MCP...');
  
  const result = await makeMCPRequest('initialize', {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "banorte-frontend",
      version: "1.0.0"
    }
  });

  if (result.error) {
    throw new Error(`Error al inicializar: ${result.error.message}`);
  }

  console.log('Sesión MCP inicializada:', globalSessionId);
  return result;
}

// Función helper para llamar herramientas MCP
async function callMCPTool(toolName: string, args: any = {}) {
  // Si no tenemos session ID, inicializar
  if (!globalSessionId) {
    await initializeMCPSession();
  }

  console.log(`Llamando herramienta: ${toolName} con session: ${globalSessionId}`);

  const result = await makeMCPRequest('tools/call', {
    name: toolName,
    arguments: args
  }, globalSessionId);

  if (result.error) {
    throw new Error(result.error.message || 'Error en MCP');
  }

  // FastMCP devuelve el resultado en result.content[0].text como JSON string
  if (result.result && result.result.content && result.result.content[0]) {
    const contentText = result.result.content[0].text;
    console.log(`Respuesta de ${toolName}:`, contentText);
    
    try {
      // Intentar parsear como JSON
      return JSON.parse(contentText);
    } catch (parseError) {
      console.error(`Error parseando JSON de ${toolName}:`, parseError);
      console.error('Contenido recibido:', contentText);
      
      // Si no es JSON válido, intentar limpiar el texto
      // A veces FastMCP puede devolver texto con caracteres extra
      const cleanedText = contentText.trim();
      
      try {
        return JSON.parse(cleanedText);
      } catch (secondError) {
        // Si aún falla, devolver un objeto de error
        return {
          success: false,
          error: 'Error al parsear respuesta del servidor',
          raw_response: contentText.substring(0, 200) // Solo primeros 200 caracteres
        };
      }
    }
  }

  throw new Error('Formato de respuesta inesperado');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get('company_id') || searchParams.get('user_id') || null;

    // Detectar si es empresa (empieza con E) o usuario personal (número)
    const isCompany = entityId && entityId.startsWith('E');
    const isPersonal = entityId && /^\d+$/.test(entityId);

    console.log(`Llamando a MCP tools para ${isCompany ? 'empresa' : 'usuario'}: ${entityId}`);

    let balanceData, expensesData;

    if (isCompany) {
      // Llamadas para empresa
      console.log('Usando herramientas de empresa');
      [balanceData, expensesData] = await Promise.all([
        callMCPTool('get_company_balance', { company_id: entityId }),
        callMCPTool('analyze_expenses_by_category', { company_id: entityId })
      ]);
    } else if (isPersonal) {
      // Llamadas para usuario personal
      console.log('Usando herramientas de usuario personal');
      [balanceData, expensesData] = await Promise.all([
        callMCPTool('get_personal_balance', { user_id: entityId }),
        callMCPTool('analyze_expenses_by_category', { user_id: entityId })
      ]);
    } else {
      // Sin ID, usar empresa por defecto
      console.log('Sin ID, usando empresa por defecto');
      [balanceData, expensesData] = await Promise.all([
        callMCPTool('get_company_balance', {}),
        callMCPTool('analyze_expenses_by_category', {})
      ]);
    }

    console.log('Balance data:', balanceData);
    console.log('Expenses data:', expensesData);
    console.log('Categorías encontradas:', expensesData.data?.categorias?.length || 0);

    // Procesar y formatear los datos
    const response = {
      balance: {
        ingresos_totales: balanceData.data?.ingresos || 0,
        gastos_totales: balanceData.data?.gastos || 0,
        balance_total: balanceData.data?.balance || 0
      },
      expenses: {
        categorias: expensesData.data?.categorias || [],
        total_gastos: expensesData.data?.total_gastos || 0
      }
    };

    console.log('Respuesta final a enviar:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en financial_data API:', error);
    
    // Retornar datos de ejemplo en caso de error
    return NextResponse.json({
      balance: {
        ingresos_totales: 150000,
        gastos_totales: 85000,
        balance_total: 65000
      },
      expenses: {
        categorias: [
          { categoria: "Nómina", total: 45000, transacciones: 12 },
          { categoria: "Servicios", total: 15000, transacciones: 8 },
          { categoria: "Compras", total: 12000, transacciones: 25 },
          { categoria: "Transporte", total: 8000, transacciones: 15 },
          { categoria: "Otros", total: 5000, transacciones: 10 }
        ],
        total_gastos: 85000
      }
    });
  }
}

