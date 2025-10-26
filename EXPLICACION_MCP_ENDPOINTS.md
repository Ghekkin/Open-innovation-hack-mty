# 📡 Explicación: Cómo Funciona el Servidor MCP

## 🔍 El Problema que Tenías

Estabas intentando llamar a endpoints REST tradicionales que **NO EXISTEN**:
```
❌ http://localhost:8080/api/balance/company
❌ http://localhost:8080/tools/financial/balance/get_company_balance_tool
```

## ✅ La Solución Correcta

El servidor usa **FastMCP** que implementa el protocolo **MCP (Model Context Protocol)** sobre HTTP usando **JSON-RPC 2.0**.

### Cómo Funciona MCP:

1. **Un solo endpoint**: `/mcp`
2. **Protocolo**: JSON-RPC 2.0
3. **Método HTTP**: POST
4. **Formato de petición**:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_company_balance",
    "arguments": {
      "company_id": "E001"
    }
  },
  "id": 1
}
```

5. **Formato de respuesta**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"data\": {...}}"
      }
    ]
  }
}
```

## 🔧 Configuración Correcta

### 1. Variable de Entorno

En `frontend/.env.local`:
```env
MCP_SERVER_URL=https://tu-url-de-coolify.com
```

O para local:
```env
MCP_SERVER_URL=http://localhost:8080
```

### 2. Estructura del Código

El archivo `route.ts` ahora tiene:

```typescript
// Función helper para llamar herramientas MCP
async function callMCPTool(toolName: string, args: any = {}) {
  const payload = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args
    },
    id: Date.now()
  };

  const response = await fetch(`${BACKEND_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  // FastMCP devuelve el resultado en result.content[0].text
  return JSON.parse(data.result.content[0].text);
}
```

### 3. Uso

```typescript
// Llamar a una herramienta
const balanceData = await callMCPTool('get_company_balance', { 
  company_id: 'E001' 
});

const expensesData = await callMCPTool('analyze_expenses_by_category', { 
  company_id: 'E001' 
});
```

## 📋 Herramientas Disponibles

Según el código del servidor (`mcp_http_server.py`), estas son las herramientas disponibles:

### Balance
- `get_company_balance` - Balance de empresa
- `get_personal_balance` - Balance personal

### Gastos
- `analyze_expenses_by_category` - Gastos por categoría

### Proyecciones
- `project_cash_flow` - Proyección de flujo de caja
- `simulate_financial_scenario` - Simulación de escenarios

### Presupuesto
- `compare_budget_vs_actual` - Comparar presupuesto vs real

### Salud Financiera
- `get_financial_health_score` - Score de salud financiera

### Tendencias
- `get_spending_trends` - Tendencias de gasto

### Recomendaciones
- `get_category_recommendations` - Recomendaciones por categoría

### Detección de Anomalías
- `detect_anomalies` - Detectar anomalías

### Comparación
- `compare_periods` - Comparar períodos

### Riesgo
- `assess_financial_risk` - Evaluar riesgo financiero
- `get_alerts` - Obtener alertas
- `predict_cash_shortage` - Predecir escasez de efectivo
- `get_stress_test` - Prueba de estrés

## 🧪 Cómo Probar

### Opción 1: Desde el navegador

1. Abre las DevTools (F12)
2. Ve a la consola
3. Ejecuta:

```javascript
fetch('https://tu-url-de-coolify.com/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "get_company_balance",
      arguments: { company_id: "E001" }
    },
    id: 1
  })
})
.then(r => r.json())
.then(console.log)
```

### Opción 2: Con curl

```bash
curl -X POST https://tu-url-de-coolify.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_company_balance",
      "arguments": {"company_id": "E001"}
    },
    "id": 1
  }'
```

### Opción 3: Script de prueba Python

```python
import requests
import json

def call_mcp_tool(url, tool_name, args=None):
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": args or {}
        },
        "id": 1
    }
    
    response = requests.post(f"{url}/mcp", json=payload)
    data = response.json()
    
    if "result" in data:
        result_text = data["result"]["content"][0]["text"]
        return json.loads(result_text)
    
    return data

# Uso
url = "https://tu-url-de-coolify.com"
balance = call_mcp_tool(url, "get_company_balance", {"company_id": "E001"})
print(json.dumps(balance, indent=2))
```

## 🐛 Solución de Problemas

### Error: "Cannot read property 'content' of undefined"

**Causa:** El servidor no está devolviendo el formato esperado

**Solución:** Verifica que el servidor esté corriendo y que la URL sea correcta

### Error: "fetch failed"

**Causa:** No se puede conectar al servidor

**Solución:** 
1. Verifica que `MCP_SERVER_URL` esté configurado en `.env.local`
2. Verifica que el servidor esté corriendo en Coolify
3. Verifica que la URL sea correcta (con https:// si es producción)

### Error: "CORS policy"

**Causa:** El servidor no permite peticiones desde tu dominio

**Solución:** El servidor debe tener configurado CORS para permitir tu dominio del frontend

## 📊 Flujo Completo

```
1. Usuario abre dashboard
   ↓
2. page.tsx llama a loadFinancialData()
   ↓
3. fetch('/api/financial_data?company_id=E001')
   ↓
4. route.ts recibe la petición
   ↓
5. callMCPTool() crea payload JSON-RPC
   ↓
6. POST https://tu-url-de-coolify.com/mcp
   ↓
7. FastMCP recibe la petición
   ↓
8. Ejecuta get_company_balance_tool()
   ↓
9. balance.py consulta MySQL
   ↓
10. Devuelve JSON en formato MCP
   ↓
11. route.ts parsea el resultado
   ↓
12. page.tsx muestra los datos
```

## ✅ Checklist de Verificación

- [ ] `MCP_SERVER_URL` está configurado en `frontend/.env.local`
- [ ] El servidor está corriendo en Coolify
- [ ] La URL incluye el protocolo (http:// o https://)
- [ ] El servidor tiene acceso a la base de datos MySQL
- [ ] Las tablas `finanzas_empresa` y `finanzas_personales` existen
- [ ] Hay datos en las tablas para el `company_id` que estás usando

## 🎯 Resumen

**Antes (Incorrecto):**
```typescript
fetch(`${BACKEND_URL}/api/balance/company?company_id=E001`)
```

**Ahora (Correcto):**
```typescript
fetch(`${BACKEND_URL}/mcp`, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "get_company_balance",
      arguments: { company_id: "E001" }
    },
    id: 1
  })
})
```

¡Ahora debería funcionar correctamente! 🎉

