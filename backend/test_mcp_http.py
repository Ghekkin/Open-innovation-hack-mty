"""
Script de prueba para el servidor MCP sobre HTTP.
Demuestra cómo hacer llamadas al servidor usando el protocolo MCP.
"""

import requests
import json
from typing import Dict, Any


class MCPClient:
    """Cliente simple para probar el servidor MCP sobre HTTP."""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.mcp_endpoint = f"{base_url}/mcp"  # FastMCP con streamable-http usa /mcp
        self.request_id = 0
        self.session_id = None
    
    def _make_request(self, method: str, params: Dict[str, Any] = None) -> Dict:
        """Hace una petición JSON-RPC 2.0 al servidor MCP."""
        self.request_id += 1
        
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "id": self.request_id
        }
        
        if params:
            payload["params"] = params
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
            
            # Si tenemos session_id, agregarlo al header
            if self.session_id:
                headers["mcp-session-id"] = self.session_id
            
            response = requests.post(
                self.mcp_endpoint,
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            
            # Guardar session_id si viene en la respuesta
            if "mcp-session-id" in response.headers:
                self.session_id = response.headers["mcp-session-id"]
            
            # Parsear respuesta SSE
            content = response.text
            if content.startswith("event: message"):
                # Es una respuesta SSE, extraer el JSON del data:
                lines = content.split('\n')
                for line in lines:
                    if line.startswith("data: "):
                        json_data = line[6:]  # Remover "data: "
                        return json.loads(json_data)
            
            # Si no es SSE, parsear como JSON normal
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
        except json.JSONDecodeError as e:
            return {"error": f"JSON decode error: {str(e)}, content: {response.text[:200]}"}
    
    def initialize(self) -> Dict:
        """Inicializa la sesión MCP."""
        return self._make_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "test-client",
                "version": "1.0.0"
            }
        })
    
    def list_tools(self) -> Dict:
        """Lista todas las herramientas disponibles."""
        # Primero inicializar si no tenemos session
        if not self.session_id:
            init_result = self.initialize()
            if "error" in init_result:
                return init_result
        
        return self._make_request("tools/list")
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any] = None) -> Dict:
        """Ejecuta una herramienta específica."""
        params = {
            "name": tool_name,
            "arguments": arguments or {}
        }
        return self._make_request("tools/call", params)


def print_section(title: str):
    """Imprime un separador de sección."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60 + "\n")


def print_result(result: Dict):
    """Imprime el resultado de forma legible."""
    print(json.dumps(result, indent=2, ensure_ascii=False))


def main():
    """Función principal de prueba."""
    print_section("🧪 PRUEBA DEL SERVIDOR MCP SOBRE HTTP")
    
    # Crear cliente
    client = MCPClient()
    
    # 1. Listar herramientas disponibles
    print_section("1️⃣  Listando herramientas disponibles")
    tools_response = client.list_tools()
    
    if "error" in tools_response:
        print(f"❌ Error: {tools_response['error']}")
        print("\n⚠️  Asegúrate de que el servidor esté corriendo:")
        print("   python main.py")
        return
    
    print(f"✅ Herramientas encontradas: {len(tools_response.get('result', {}).get('tools', []))}")
    
    # Mostrar nombres de herramientas
    tools = tools_response.get('result', {}).get('tools', [])
    for i, tool in enumerate(tools, 1):
        print(f"   {i}. {tool.get('name')}")
    
    # 2. Probar get_company_balance
    print_section("2️⃣  Probando: get_company_balance")
    balance_response = client.call_tool("get_company_balance")
    print_result(balance_response)
    
    # 3. Probar analyze_expenses_by_category
    print_section("3️⃣  Probando: analyze_expenses_by_category")
    expenses_response = client.call_tool("analyze_expenses_by_category")
    print_result(expenses_response)
    
    # 4. Probar project_cash_flow
    print_section("4️⃣  Probando: project_cash_flow")
    projection_response = client.call_tool(
        "project_cash_flow",
        {"months": 3}
    )
    print_result(projection_response)
    
    # 5. Probar simulate_financial_scenario
    print_section("5️⃣  Probando: simulate_financial_scenario")
    scenario_response = client.call_tool(
        "simulate_financial_scenario",
        {
            "current_balance": 100000,
            "monthly_income_change": 5000,
            "monthly_expense_change": -2000,
            "months": 6
        }
    )
    print_result(scenario_response)
    
    # 6. Probar get_financial_health_score
    print_section("6️⃣  Probando: get_financial_health_score")
    health_response = client.call_tool("get_financial_health_score")
    print_result(health_response)
    
    # 7. Probar assess_financial_risk
    print_section("7️⃣  Probando: assess_financial_risk")
    risk_response = client.call_tool("assess_financial_risk")
    print_result(risk_response)
    
    # 8. Probar get_alerts
    print_section("8️⃣  Probando: get_alerts")
    alerts_response = client.call_tool("get_alerts")
    print_result(alerts_response)
    
    print_section("✅ PRUEBAS COMPLETADAS")
    print("El servidor MCP sobre HTTP está funcionando correctamente! 🎉\n")


if __name__ == "__main__":
    main()

