/**
 * Cliente MCP para comunicarse con el servidor MCP sobre HTTP
 */

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  structuredContent?: any;
  isError: boolean;
}

export class MCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private requestId: number = 0;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_MCP_URL || 'http://localhost:8080';
  }

  private async makeRequest(method: string, params?: any): Promise<MCPResponse> {
    this.requestId++;
    
    const payload = {
      jsonrpc: '2.0',
      method,
      id: this.requestId,
      ...(params && { params })
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Guardar session ID si viene en headers
    const newSessionId = response.headers.get('mcp-session-id');
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    // Parsear respuesta (puede ser SSE o JSON)
    const contentType = response.headers.get('content-type');
    const text = await response.text();

    if (text.startsWith('event: message')) {
      // Es SSE, extraer el JSON
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          return JSON.parse(line.substring(6));
        }
      }
    }

    return JSON.parse(text);
  }

  async initialize(): Promise<void> {
    const response = await this.makeRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'frontend-client',
        version: '1.0.0'
      }
    });

    if (response.error) {
      throw new Error(`Error al inicializar: ${response.error.message}`);
    }
  }

  async listTools(): Promise<any[]> {
    if (!this.sessionId) {
      await this.initialize();
    }

    const response = await this.makeRequest('tools/list');

    if (response.error) {
      throw new Error(`Error al listar herramientas: ${response.error.message}`);
    }

    return response.result?.tools || [];
  }

  async callTool(toolName: string, args: Record<string, any> = {}): Promise<ToolResult> {
    if (!this.sessionId) {
      await this.initialize();
    }

    const response = await this.makeRequest('tools/call', {
      name: toolName,
      arguments: args
    });

    if (response.error) {
      throw new Error(`Error al ejecutar herramienta: ${response.error.message}`);
    }

    return response.result as ToolResult;
  }

  /**
   * Obtiene el balance de la empresa
   */
  async getCompanyBalance() {
    return this.callTool('get_company_balance');
  }

  /**
   * Obtiene el balance personal
   */
  async getPersonalBalance() {
    return this.callTool('get_personal_balance');
  }

  /**
   * Analiza gastos por categoría
   */
  async analyzeExpensesByCategory(params?: { start_date?: string; end_date?: string }) {
    return this.callTool('analyze_expenses_by_category', params || {});
  }

  /**
   * Proyecta el flujo de caja
   */
  async projectCashFlow(params?: { months?: number }) {
    return this.callTool('project_cash_flow', params || {});
  }

  /**
   * Simula un escenario financiero
   */
  async simulateScenario(params: {
    scenario_type: 'optimista' | 'pesimista' | 'realista';
    months?: number;
  }) {
    return this.callTool('simulate_financial_scenario', params);
  }

  /**
   * Compara presupuesto vs actual
   */
  async compareBudget(params?: { start_date?: string; end_date?: string }) {
    return this.callTool('compare_budget_vs_actual', params || {});
  }

  /**
   * Obtiene el score de salud financiera
   */
  async getFinancialHealthScore() {
    return this.callTool('get_financial_health_score');
  }

  /**
   * Obtiene tendencias de gasto
   */
  async getSpendingTrends(params?: { months?: number }) {
    return this.callTool('get_spending_trends', params || {});
  }

  /**
   * Obtiene recomendaciones por categoría
   */
  async getCategoryRecommendations() {
    return this.callTool('get_category_recommendations');
  }

  /**
   * Detecta anomalías en gastos
   */
  async detectAnomalies(params?: { threshold?: number }) {
    return this.callTool('detect_anomalies', params || {});
  }

  /**
   * Compara períodos
   */
  async comparePeriods(params: {
    period1_start: string;
    period1_end: string;
    period2_start: string;
    period2_end: string;
  }) {
    return this.callTool('compare_periods', params);
  }

  /**
   * Evalúa riesgo financiero
   */
  async assessFinancialRisk() {
    return this.callTool('assess_financial_risk');
  }

  /**
   * Obtiene alertas financieras
   */
  async getAlerts() {
    return this.callTool('get_alerts');
  }

  /**
   * Predice escasez de efectivo
   */
  async predictCashShortage(params?: { months?: number }) {
    return this.callTool('predict_cash_shortage', params || {});
  }

  /**
   * Realiza prueba de estrés
   */
  async getStressTest(params: {
    revenue_decrease: number;
    expense_increase: number;
    months?: number;
  }) {
    return this.callTool('get_stress_test', params);
  }
}

// Instancia singleton del cliente
export const mcpClient = new MCPClient();

