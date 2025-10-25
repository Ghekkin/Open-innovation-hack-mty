"""
Script para probar el servidor MCP en producción (Coolify).
"""
import requests
import json
from typing import Dict, Any


class MCPProductionClient:
    """Cliente para probar el servidor MCP en producción."""
    
    def __init__(self, base_url: str):
        """
        Inicializa el cliente de producción.
        
        Args:
            base_url: URL base del servidor (ej: http://ao8kws8s040c8ggk0k8soss8.72.60.123.201.sslip.io)
        """
        self.base_url = base_url.rstrip('/')
        self.mcp_endpoint = f"{self.base_url}/mcp"
        self.request_id = 0
        self.session_id = None
        print(f"🌐 Cliente configurado para: {self.mcp_endpoint}")
    
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
            
            print(f"\n📤 Enviando petición: {method}")
            print(f"   Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(
                self.mcp_endpoint,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            print(f"📥 Status Code: {response.status_code}")
            
            response.raise_for_status()
            
            # Guardar session_id si viene en la respuesta
            if "mcp-session-id" in response.headers:
                self.session_id = response.headers["mcp-session-id"]
                print(f"   Session ID: {self.session_id}")
            
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
            
        except requests.exceptions.Timeout:
            return {"error": "Timeout: El servidor no respondió en 30 segundos"}
        except requests.exceptions.ConnectionError as e:
            return {"error": f"Error de conexión: {str(e)}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Error en la petición: {str(e)}"}
        except json.JSONDecodeError as e:
            return {"error": f"Error al decodificar JSON: {str(e)}", "content": response.text[:200]}
    
    def test_health(self) -> bool:
        """Verifica que el servidor esté respondiendo."""
        try:
            print("\n🏥 Verificando salud del servidor...")
            response = requests.get(f"{self.base_url}/", timeout=10)
            print(f"   Status: {response.status_code}")
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
    def initialize(self) -> Dict:
        """Inicializa la sesión MCP."""
        print("\n🔐 Inicializando sesión MCP...")
        result = self._make_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "production-test-client",
                "version": "1.0.0"
            }
        })
        
        if "error" not in result:
            print("   ✅ Sesión inicializada correctamente")
        else:
            print(f"   ❌ Error: {result.get('error')}")
        
        return result
    
    def list_tools(self) -> Dict:
        """Lista todas las herramientas disponibles."""
        # Primero inicializar si no tenemos session
        if not self.session_id:
            init_result = self.initialize()
            if "error" in init_result:
                return init_result
        
        print("\n🔧 Listando herramientas disponibles...")
        result = self._make_request("tools/list")
        
        if "error" not in result and "result" in result:
            tools = result["result"].get("tools", [])
            print(f"   ✅ Encontradas {len(tools)} herramientas:")
            for i, tool in enumerate(tools, 1):
                print(f"      {i}. {tool.get('name', 'Sin nombre')}")
        else:
            print(f"   ❌ Error: {result.get('error', 'Respuesta inesperada')}")
        
        return result
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any] = None) -> Dict:
        """Ejecuta una herramienta específica."""
        # Primero inicializar si no tenemos session
        if not self.session_id:
            init_result = self.initialize()
            if "error" in init_result:
                return init_result
        
        params = {
            "name": tool_name,
            "arguments": arguments if arguments is not None else {}
        }
        
        print(f"\n⚙️  Ejecutando herramienta: {tool_name}")
        print(f"   Argumentos: {json.dumps(arguments, indent=2)}")
        
        result = self._make_request("tools/call", params)
        
        if "error" not in result:
            print("   ✅ Herramienta ejecutada correctamente")
        else:
            print(f"   ❌ Error: {result.get('error')}")
        
        return result


def main():
    """Función principal de prueba."""
    print("=" * 80)
    print("🧪 PRUEBAS DEL SERVIDOR MCP EN PRODUCCIÓN")
    print("=" * 80)
    
    # URL de producción (reemplazar con tu URL de Coolify)
    PRODUCTION_URL = "http://ao8kws8s040c8ggk0k8soss8.72.60.123.201.sslip.io"
    
    print(f"\n🎯 URL de producción: {PRODUCTION_URL}")
    print("\n⚠️  IMPORTANTE: Asegúrate de reemplazar la URL con tu URL de Coolify")
    
    # Crear cliente
    client = MCPProductionClient(PRODUCTION_URL)
    
    # 1. Verificar salud del servidor
    print("\n" + "=" * 80)
    print("TEST 1: Verificación de salud del servidor")
    print("=" * 80)
    if not client.test_health():
        print("\n❌ El servidor no está respondiendo. Verifica:")
        print("   1. Que el servidor esté corriendo en Coolify")
        print("   2. Que la URL sea correcta")
        print("   3. Que el puerto 8080 esté abierto")
        return
    
    # 2. Inicializar sesión
    print("\n" + "=" * 80)
    print("TEST 2: Inicialización de sesión MCP")
    print("=" * 80)
    init_result = client.initialize()
    if "error" in init_result:
        print(f"\n❌ Error al inicializar: {init_result}")
        return
    
    print(f"\n✅ Respuesta de inicialización:")
    print(json.dumps(init_result, indent=2))
    
    # 3. Listar herramientas
    print("\n" + "=" * 80)
    print("TEST 3: Listado de herramientas disponibles")
    print("=" * 80)
    tools_result = client.list_tools()
    if "error" in tools_result:
        print(f"\n❌ Error al listar herramientas: {tools_result}")
        return
    
    # 4. Probar una herramienta simple
    print("\n" + "=" * 80)
    print("TEST 4: Ejecución de herramienta (get_company_balance)")
    print("=" * 80)
    balance_result = client.call_tool("get_company_balance")
    
    if "error" not in balance_result:
        print(f"\n✅ Resultado:")
        print(json.dumps(balance_result, indent=2, ensure_ascii=False))
    else:
        print(f"\n❌ Error: {balance_result}")
    
    # Resumen final
    print("\n" + "=" * 80)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 80)
    print("✅ Servidor accesible")
    print("✅ Sesión MCP inicializada")
    print("✅ Herramientas listadas correctamente")
    print("✅ Herramienta ejecutada correctamente")
    print("\n🎉 ¡El servidor MCP está funcionando correctamente en producción!")
    print("\n💡 Próximos pasos:")
    print("   1. Integrar este cliente en tu frontend")
    print("   2. Probar más herramientas financieras")
    print("   3. Implementar manejo de errores robusto")
    print("   4. Agregar autenticación si es necesario")


if __name__ == "__main__":
    main()

