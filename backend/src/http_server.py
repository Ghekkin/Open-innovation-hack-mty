"""
Servidor HTTP para exponer el servidor MCP como API REST.
Este servidor permite que Gemini y otros clientes HTTP puedan usar las herramientas MCP.
"""

import asyncio
import json
import logging
from typing import Any, Dict, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from database import get_db_connection
from tools import (
    get_company_balance_tool,
    get_personal_balance_tool,
    get_expenses_by_category_tool,
    get_cash_flow_projection_tool,
    get_budget_comparison_tool,
    simulate_scenario_tool,
    get_financial_health_score_tool,
    get_spending_trends_tool,
    get_category_recommendations_tool,
    detect_anomalies_tool,
    compare_periods_tool,
    assess_financial_risk_tool,
    get_alerts_tool,
    predict_cash_shortage_tool,
    get_stress_test_tool
)
from utils import setup_logger

# Setup logger
logger = setup_logger('mcp_http_server', logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for the HTTP server."""
    logger.info("🚀 Iniciando servidor HTTP MCP Financiero...")
    
    # Test database connection on startup (non-blocking)
    try:
        db = get_db_connection()
        if db.test_connection():
            logger.info("✅ Conexión a base de datos establecida exitosamente")
        else:
            logger.warning("⚠️ No se pudo conectar a la base de datos - el servidor iniciará de todos modos")
    except Exception as e:
        logger.error(f"❌ Error al conectar a la base de datos: {e}")
        logger.warning("⚠️ El servidor iniciará sin conexión a base de datos - algunas funciones pueden fallar")
    
    yield
    
    logger.info("👋 Cerrando servidor HTTP MCP Financiero...")


# Initialize FastAPI app
app = FastAPI(
    title="MCP Financiero API",
    description="API REST para análisis financiero inteligente usando Model Context Protocol",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class ToolRequest(BaseModel):
    """Request model for tool execution."""
    tool_name: str = Field(..., description="Nombre de la herramienta a ejecutar")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Argumentos para la herramienta")


class ToolResponse(BaseModel):
    """Response model for tool execution."""
    success: bool
    data: Any = None
    error: str = None


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    database_connected: bool
    version: str


# Tool registry mapping
TOOL_REGISTRY = {
    "get_company_balance": get_company_balance_tool,
    "get_personal_balance": get_personal_balance_tool,
    "analyze_expenses_by_category": get_expenses_by_category_tool,
    "project_cash_flow": get_cash_flow_projection_tool,
    "simulate_financial_scenario": simulate_scenario_tool,
    "compare_budget_vs_actual": get_budget_comparison_tool,
    "get_financial_health_score": get_financial_health_score_tool,
    "get_spending_trends": get_spending_trends_tool,
    "get_category_recommendations": get_category_recommendations_tool,
    "detect_anomalies": detect_anomalies_tool,
    "compare_periods": compare_periods_tool,
    "assess_financial_risk": assess_financial_risk_tool,
    "get_alerts": get_alerts_tool,
    "predict_cash_shortage": predict_cash_shortage_tool,
    "get_stress_test": get_stress_test_tool,
}


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint."""
    return {
        "message": "MCP Financiero API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    db_connected = False
    try:
        db = get_db_connection()
        db_connected = db.test_connection()
        logger.info(f"Health check: DB connected = {db_connected}")
    except Exception as e:
        logger.warning(f"Health check: DB connection failed - {e}")
    
    # Servidor está "healthy" si está corriendo, aunque la BD no esté conectada
    # Esto permite que el servidor inicie y sea accesible
    return HealthResponse(
        status="healthy",  # Siempre healthy si el servidor responde
        database_connected=db_connected,
        version="1.0.0"
    )


@app.get("/tools", response_model=List[Dict[str, Any]])
async def list_tools():
    """List all available tools."""
    tools = [
        {
            "name": "get_company_balance",
            "description": "Obtiene el balance financiero actual de una empresa",
            "parameters": {
                "company_id": {"type": "string", "required": False}
            }
        },
        {
            "name": "get_personal_balance",
            "description": "Obtiene el balance financiero personal de un usuario",
            "parameters": {
                "user_id": {"type": "string", "required": False}
            }
        },
        {
            "name": "analyze_expenses_by_category",
            "description": "Analiza los gastos agrupados por categoría",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "start_date": {"type": "string", "required": False},
                "end_date": {"type": "string", "required": False}
            }
        },
        {
            "name": "project_cash_flow",
            "description": "Proyecta el flujo de caja futuro",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "months": {"type": "integer", "required": False, "default": 3}
            }
        },
        {
            "name": "simulate_financial_scenario",
            "description": "Simula un escenario 'what-if' financiero",
            "parameters": {
                "current_balance": {"type": "number", "required": True},
                "monthly_income_change": {"type": "number", "required": False, "default": 0},
                "monthly_expense_change": {"type": "number", "required": False, "default": 0},
                "months": {"type": "integer", "required": False, "default": 6}
            }
        },
        {
            "name": "compare_budget_vs_actual",
            "description": "Compara los gastos presupuestados vs los gastos reales",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "month": {"type": "integer", "required": False},
                "year": {"type": "integer", "required": False}
            }
        },
        {
            "name": "get_financial_health_score",
            "description": "Calcula un score integral de salud financiera (0-100)",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "user_id": {"type": "string", "required": False}
            }
        },
        {
            "name": "get_spending_trends",
            "description": "Analiza tendencias de gasto a lo largo del tiempo",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "months_back": {"type": "integer", "required": False, "default": 6}
            }
        },
        {
            "name": "get_category_recommendations",
            "description": "Genera recomendaciones personalizadas para optimizar gastos",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "top_n": {"type": "integer", "required": False, "default": 5}
            }
        },
        {
            "name": "detect_anomalies",
            "description": "Detecta transacciones o patrones de gasto inusuales",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "threshold": {"type": "number", "required": False, "default": 2.0}
            }
        },
        {
            "name": "compare_periods",
            "description": "Compara métricas financieras entre dos períodos",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "period1_start": {"type": "string", "required": True},
                "period1_end": {"type": "string", "required": True},
                "period2_start": {"type": "string", "required": True},
                "period2_end": {"type": "string", "required": True}
            }
        },
        {
            "name": "assess_financial_risk",
            "description": "Evalúa el nivel de riesgo financiero general",
            "parameters": {
                "company_id": {"type": "string", "required": False}
            }
        },
        {
            "name": "get_alerts",
            "description": "Obtiene alertas financieras activas",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "severity": {"type": "string", "required": False}
            }
        },
        {
            "name": "predict_cash_shortage",
            "description": "Predice posibles escaseces de efectivo en el futuro",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "months_ahead": {"type": "integer", "required": False, "default": 6}
            }
        },
        {
            "name": "get_stress_test",
            "description": "Realiza una prueba de estrés financiero",
            "parameters": {
                "company_id": {"type": "string", "required": False},
                "income_reduction": {"type": "number", "required": False, "default": 30.0},
                "expense_increase": {"type": "number", "required": False, "default": 20.0}
            }
        }
    ]
    return tools


@app.post("/execute", response_model=ToolResponse)
async def execute_tool(request: ToolRequest):
    """Execute a financial analysis tool."""
    try:
        logger.info(f"📊 Ejecutando herramienta: {request.tool_name}")
        logger.debug(f"Argumentos: {request.arguments}")
        
        # Check if tool exists
        if request.tool_name not in TOOL_REGISTRY:
            raise HTTPException(
                status_code=404,
                detail=f"Herramienta '{request.tool_name}' no encontrada"
            )
        
        # Get the tool function
        tool_func = TOOL_REGISTRY[request.tool_name]
        
        # Execute the tool
        result = tool_func(**request.arguments)
        
        logger.info(f"✅ Herramienta {request.tool_name} ejecutada exitosamente")
        
        return ToolResponse(
            success=True,
            data=result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error ejecutando herramienta {request.tool_name}: {e}", exc_info=True)
        return ToolResponse(
            success=False,
            error=str(e)
        )


@app.post("/tools/{tool_name}", response_model=ToolResponse)
async def execute_tool_by_path(tool_name: str, request: Request):
    """Execute a tool using path parameter and JSON body for arguments."""
    try:
        body = await request.json() if await request.body() else {}
        
        tool_request = ToolRequest(
            tool_name=tool_name,
            arguments=body
        )
        
        return await execute_tool(tool_request)
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("PORT", 8080))
    
    logger.info("=" * 60)
    logger.info("🚀 INICIANDO SERVIDOR HTTP MCP FINANCIERO")
    logger.info("=" * 60)
    logger.info(f"Puerto: {port}")
    logger.info(f"Host: 0.0.0.0")
    logger.info(f"Entorno: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"DB Host: {os.getenv('DB_HOST', 'no configurado')}")
    logger.info("=" * 60)
    
    uvicorn.run(
        "http_server:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )

