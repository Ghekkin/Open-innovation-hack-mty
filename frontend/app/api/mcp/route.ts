import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8080';

interface MCPRequest {
  method: string;
  params?: any;
}

let sessionId: string | null = null;
let requestId = 0;

export async function POST(request: NextRequest) {
  try {
    const { method, params }: MCPRequest = await request.json();

    if (!method) {
      return NextResponse.json(
        { error: 'Método requerido' },
        { status: 400 }
      );
    }

    requestId++;

    const payload = {
      jsonrpc: '2.0',
      method,
      id: requestId,
      ...(params && { params })
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };

    if (sessionId) {
      headers['mcp-session-id'] = sessionId;
    }

    const mcpResponse = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!mcpResponse.ok) {
      console.error(`[MCP] Error HTTP ${mcpResponse.status}`);
      return NextResponse.json(
        { error: `Error del servidor MCP: ${mcpResponse.status}` },
        { status: mcpResponse.status }
      );
    }

    // Guardar session ID
    const newSessionId = mcpResponse.headers.get('mcp-session-id');
    if (newSessionId) {
      sessionId = newSessionId;
    }

    // Parsear respuesta (SSE o JSON)
    const text = await mcpResponse.text();
    let data;

    if (text.startsWith('event: message')) {
      // Es SSE, extraer el JSON
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

    return NextResponse.json({
      success: true,
      data,
      sessionId
    });

  } catch (error) {
    console.error('[MCP] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error
      },
      { status: 500 }
    );
  }
}

// Endpoint para resetear la sesión
export async function DELETE() {
  sessionId = null;
  requestId = 0;
  return NextResponse.json({ success: true, message: 'Sesión reseteada' });
}

