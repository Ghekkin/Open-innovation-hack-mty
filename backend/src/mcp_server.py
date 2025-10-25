"""
MCP Financial Server - Servidor MCP para análisis financiero inteligente.

Este servidor proporciona herramientas de análisis financiero a través del
Model Context Protocol (MCP), permitiendo realizar consultas, proyecciones
y simulaciones financieras.
"""

import asyncio
import logging
from typing import Any, Sequence
from contextlib import asynccontextmanager

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
)
import mcp.types as types

from database import get_db_connection
from tools import (
    get_company_balance_tool,
    get_personal_balance_tool,
    get_expenses_by_category_tool,
    get_cash_flow_projection_tool,
    get_budget_comparison_tool
)
from tools.projection_tools import simulate_scenario_tool
from utils import setup_logger

# Setup logger
logger = setup_logger('mcp_financiero', logging.INFO)

# Initialize MCP server
app = Server("mcp-financiero")


@asynccontextmanager
async def lifespan(server: Server):
    """Lifecycle management for the MCP server."""
    logger.info("Iniciando servidor MCP Financiero...")
    
    # Test database connection on startup
    try:
        db = get_db_connection()
        if db.test_connection():
            logger.info("Conexión a base de datos establecida exitosamente")
        else:
            logger.warning("No se pudo conectar a la base de datos")
    except Exception as e:
        logger.error(f"Error al conectar a la base de datos: {e}")
    
    yield
    
    logger.info("Cerrando servidor MCP Financiero...")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """
    List all available financial analysis tools.
    
    Returns:
        List of available tools with their schemas
    """
    return [
        Tool(
            name="get_company_balance",
            description=(
                "Obtiene el balance financiero actual de una empresa, "
                "incluyendo ingresos totales, gastos totales y balance neto. "
                "Útil para conocer la situación financiera general."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "company_id": {
                        "type": "string",
                        "description": "ID de la empresa (opcional, si no se proporciona devuelve el total)",
                    }
                },
            },
        ),
        Tool(
            name="get_personal_balance",
            description=(
                "Obtiene el balance financiero personal de un usuario, "
                "incluyendo ingresos totales, gastos totales y balance neto."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "ID del usuario (opcional)",
                    }
                },
            },
        ),
        Tool(
            name="analyze_expenses_by_category",
            description=(
                "Analiza los gastos agrupados por categoría, mostrando el total "
                "gastado en cada categoría, número de transacciones y porcentaje "
                "del total. Permite filtrar por rango de fechas."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "company_id": {
                        "type": "string",
                        "description": "ID de la empresa (opcional)",
                    },
                    "start_date": {
                        "type": "string",
                        "description": "Fecha de inicio en formato YYYY-MM-DD (opcional)",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "Fecha de fin en formato YYYY-MM-DD (opcional)",
                    },
                },
            },
        ),
        Tool(
            name="project_cash_flow",
            description=(
                "Proyecta el flujo de caja futuro basándose en el histórico "
                "de ingresos y gastos. Calcula promedios mensuales y estima "
                "el balance para los próximos meses. Incluye recomendaciones."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "company_id": {
                        "type": "string",
                        "description": "ID de la empresa (opcional)",
                    },
                    "months": {
                        "type": "integer",
                        "description": "Número de meses a proyectar (1-24, default: 3)",
                        "minimum": 1,
                        "maximum": 24,
                    },
                },
            },
        ),
        Tool(
            name="simulate_financial_scenario",
            description=(
                "Simula un escenario 'what-if' financiero. Permite probar "
                "cambios en ingresos o gastos mensuales y ver el impacto "
                "proyectado en el balance a lo largo de varios meses."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "current_balance": {
                        "type": "number",
                        "description": "Balance actual de inicio",
                    },
                    "monthly_income_change": {
                        "type": "number",
                        "description": "Cambio en ingresos mensuales (puede ser negativo)",
                        "default": 0,
                    },
                    "monthly_expense_change": {
                        "type": "number",
                        "description": "Cambio en gastos mensuales (puede ser negativo)",
                        "default": 0,
                    },
                    "months": {
                        "type": "integer",
                        "description": "Número de meses a simular (default: 6)",
                        "minimum": 1,
                        "maximum": 24,
                        "default": 6,
                    },
                },
                "required": ["current_balance"],
            },
        ),
        Tool(
            name="compare_budget_vs_actual",
            description=(
                "Compara los gastos presupuestados vs los gastos reales "
                "para un mes específico. Identifica variaciones y áreas "
                "que requieren atención."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "company_id": {
                        "type": "string",
                        "description": "ID de la empresa (opcional)",
                    },
                    "month": {
                        "type": "integer",
                        "description": "Mes a analizar (1-12, default: mes actual)",
                        "minimum": 1,
                        "maximum": 12,
                    },
                    "year": {
                        "type": "integer",
                        "description": "Año a analizar (default: año actual)",
                    },
                },
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent | ImageContent | EmbeddedResource]:
    """
    Execute a financial analysis tool.
    
    Args:
        name: Name of the tool to execute
        arguments: Tool arguments
    
    Returns:
        Tool execution results
    """
    try:
        logger.info(f"Ejecutando herramienta: {name} con argumentos: {arguments}")
        
        result = None
        
        if name == "get_company_balance":
            result = get_company_balance_tool(
                company_id=arguments.get("company_id")
            )
        
        elif name == "get_personal_balance":
            result = get_personal_balance_tool(
                user_id=arguments.get("user_id")
            )
        
        elif name == "analyze_expenses_by_category":
            result = get_expenses_by_category_tool(
                company_id=arguments.get("company_id"),
                start_date=arguments.get("start_date"),
                end_date=arguments.get("end_date")
            )
        
        elif name == "project_cash_flow":
            result = get_cash_flow_projection_tool(
                company_id=arguments.get("company_id"),
                months=arguments.get("months", 3)
            )
        
        elif name == "simulate_financial_scenario":
            result = simulate_scenario_tool(
                current_balance=arguments.get("current_balance"),
                monthly_income_change=arguments.get("monthly_income_change", 0),
                monthly_expense_change=arguments.get("monthly_expense_change", 0),
                months=arguments.get("months", 6)
            )
        
        elif name == "compare_budget_vs_actual":
            result = get_budget_comparison_tool(
                company_id=arguments.get("company_id"),
                month=arguments.get("month"),
                year=arguments.get("year")
            )
        
        else:
            raise ValueError(f"Herramienta desconocida: {name}")
        
        # Format result as JSON string
        import json
        result_text = json.dumps(result, indent=2, ensure_ascii=False)
        
        logger.info(f"Herramienta {name} ejecutada exitosamente")
        
        return [
            types.TextContent(
                type="text",
                text=result_text
            )
        ]
    
    except Exception as e:
        logger.error(f"Error ejecutando herramienta {name}: {e}", exc_info=True)
        import json
        error_result = {
            "success": False,
            "error": str(e),
            "message": f"Error al ejecutar la herramienta {name}"
        }
        return [
            types.TextContent(
                type="text",
                text=json.dumps(error_result, indent=2, ensure_ascii=False)
            )
        ]


async def main():
    """Run the MCP server."""
    logger.info("=== MCP Financiero Server ===")
    logger.info("Servidor MCP para análisis financiero inteligente")
    logger.info("Ready to accept connections...")
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())

