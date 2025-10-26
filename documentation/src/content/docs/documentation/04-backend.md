---
title: Backend (Python)
---

### El Servidor MCP sobre HTTP (`mcp_http_server.py`)
Este archivo es el corazón del backend.
- **FastMCP**: Utilizamos `FastMCP`, un framework que simplifica la creación de servidores basados en el "Protocolo de Contexto de Modelo". Permite exponer funciones de Python como "herramientas" accesibles remotamente.
- **`@mcp.tool()`**: Este decorador es la magia del sistema. Al aplicarlo a una función, `FastMCP` la registra automáticamente, generando su documentación y haciéndola disponible a través del protocolo JSON-RPC 2.0 sobre HTTP.
- **Tipado Estricto**: El uso de type hints en las firmas de las funciones (ej. `company_id: Optional[str] = None`) es crucial. `FastMCP` los utiliza para validar automáticamente las solicitudes entrantes, rechazando las que no cumplen con el formato esperado.

### El Ecosistema de Herramientas Financieras (`src/tools/financial/`)
Esta carpeta contiene la lógica de negocio real, organizada en módulos por dominio.
- **Herramientas Atómicas**: Cada función está diseñada para tener una única responsabilidad (Principio de Responsabilidad Única).
  - **Ej. Descriptivas**: `get_company_balance_tool` solo calcula el balance.
  - **Ej. Predictivas**: `get_cash_flow_projection_tool` solo proyecta el flujo de caja.
- **Abstracción de Datos**: Las herramientas no interactúan directamente con la base de datos. Utilizan funciones de `database/queries.py`, abstrayendo la lógica SQL y haciendo las herramientas más limpias y centradas en el cálculo.

### El Poder de la Orquestación (`orchestrator.py`)
Esta es una de las características más avanzadas y valiosas.
- **¿Qué es un Orquestador?**: Es una herramienta de alto nivel que no realiza cálculos por sí misma, sino que **invoca a múltiples herramientas atómicas** y sintetiza sus resultados para responder a una pregunta compleja del usuario.
- **Caso de Estudio: `get_business_health_check`**:
  1. Un usuario pregunta: "Dame un panorama completo de la salud de mi empresa".
  2. El orquestador se activa y llama a:
     - `risk.get_financial_health_score_tool()` para obtener el score.
     - `risk.assess_financial_risk_tool()` para evaluar el nivel de riesgo.
     - `predictive.cash_runway_tool()` para calcular los meses de liquidez restantes.
     - `risk.get_alerts_tool()` para buscar alertas críticas.
  3. **Síntesis**: En lugar de devolver cuatro respuestas separadas, el orquestador las combina en un **resumen ejecutivo cohesivo**, con un "insight principal" y los detalles disponibles para quien quiera profundizar.
- **Valor Agregado**: La orquestación transforma una colección de herramientas en un verdadero asistente inteligente, capaz de realizar análisis multifacéticos con una sola pregunta.