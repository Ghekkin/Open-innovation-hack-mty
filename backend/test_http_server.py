"""
Script de prueba para el servidor HTTP MCP.
Ejecuta este script para verificar que el servidor funcione correctamente antes de desplegarlo.
"""

import requests
import json
import sys
from typing import Dict, Any


BASE_URL = "http://localhost:8080"


def print_result(test_name: str, success: bool, data: Any = None):
    """Imprime el resultado de una prueba."""
    status = "✅" if success else "❌"
    print(f"\n{status} {test_name}")
    if data:
        print(f"   Respuesta: {json.dumps(data, indent=2, ensure_ascii=False)[:200]}...")


def test_root():
    """Prueba el endpoint raíz."""
    try:
        response = requests.get(f"{BASE_URL}/")
        success = response.status_code == 200
        print_result("Root endpoint", success, response.json())
        return success
    except Exception as e:
        print_result("Root endpoint", False, {"error": str(e)})
        return False


def test_health():
    """Prueba el health check."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        data = response.json()
        success = response.status_code == 200 and data.get("status") in ["healthy", "degraded"]
        print_result("Health check", success, data)
        return success
    except Exception as e:
        print_result("Health check", False, {"error": str(e)})
        return False


def test_list_tools():
    """Prueba listar herramientas."""
    try:
        response = requests.get(f"{BASE_URL}/tools")
        data = response.json()
        success = response.status_code == 200 and isinstance(data, list) and len(data) > 0
        print_result(f"List tools ({len(data)} herramientas)", success)
        return success
    except Exception as e:
        print_result("List tools", False, {"error": str(e)})
        return False


def test_execute_tool():
    """Prueba ejecutar una herramienta."""
    try:
        payload = {
            "tool_name": "get_company_balance",
            "arguments": {}
        }
        response = requests.post(
            f"{BASE_URL}/execute",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        success = response.status_code == 200 and data.get("success") == True
        print_result("Execute tool (get_company_balance)", success, data)
        return success
    except Exception as e:
        print_result("Execute tool", False, {"error": str(e)})
        return False


def test_execute_tool_by_path():
    """Prueba ejecutar una herramienta usando path."""
    try:
        response = requests.post(
            f"{BASE_URL}/tools/get_company_balance",
            json={},
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        success = response.status_code == 200 and data.get("success") == True
        print_result("Execute tool by path", success, data)
        return success
    except Exception as e:
        print_result("Execute tool by path", False, {"error": str(e)})
        return False


def test_simulate_scenario():
    """Prueba simular un escenario financiero."""
    try:
        payload = {
            "current_balance": 50000,
            "monthly_income_change": 5000,
            "monthly_expense_change": -2000,
            "months": 3
        }
        response = requests.post(
            f"{BASE_URL}/tools/simulate_financial_scenario",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        success = response.status_code == 200 and data.get("success") == True
        print_result("Simulate scenario", success, data)
        return success
    except Exception as e:
        print_result("Simulate scenario", False, {"error": str(e)})
        return False


def test_invalid_tool():
    """Prueba ejecutar una herramienta inválida."""
    try:
        payload = {
            "tool_name": "invalid_tool_name",
            "arguments": {}
        }
        response = requests.post(
            f"{BASE_URL}/execute",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        # Esperamos un error 404
        success = response.status_code == 404
        print_result("Invalid tool (should fail)", success, response.json())
        return success
    except Exception as e:
        print_result("Invalid tool", False, {"error": str(e)})
        return False


def main():
    """Ejecuta todas las pruebas."""
    print("=" * 60)
    print("🧪 PRUEBAS DEL SERVIDOR HTTP MCP FINANCIERO")
    print("=" * 60)
    print(f"\n🌐 URL Base: {BASE_URL}")
    print("\n⚠️  Asegúrate de que el servidor esté corriendo en el puerto 8080")
    print("   Puedes iniciarlo con: uvicorn src.http_server:app --reload")
    print("\n" + "=" * 60)
    
    tests = [
        ("Root Endpoint", test_root),
        ("Health Check", test_health),
        ("List Tools", test_list_tools),
        ("Execute Tool", test_execute_tool),
        ("Execute Tool by Path", test_execute_tool_by_path),
        ("Simulate Scenario", test_simulate_scenario),
        ("Invalid Tool", test_invalid_tool),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Error ejecutando {test_name}: {e}")
            results.append((test_name, False))
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "=" * 60)
    print(f"Resultado: {passed}/{total} pruebas pasaron")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 ¡Todas las pruebas pasaron! El servidor está listo para deployment.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} prueba(s) fallaron. Revisa los errores arriba.")
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Pruebas interrumpidas por el usuario.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

