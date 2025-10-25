"""
HTTP REST API Server para exponer las herramientas MCP
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging
from tools.balance_tools import get_company_balance_tool, get_personal_balance_tool
from tools.expense_tools import get_expenses_by_category_tool
from tools.projection_tools import get_cash_flow_projection_tool
from utils.logger import setup_logger

# Configurar logging
logger = setup_logger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title="API Financiera Banorte",
    description="API REST para consultas financieras",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "API Financiera Banorte",
        "version": "1.0.0",
        "endpoints": [
            "/api/balance/company",
            "/api/balance/personal",
            "/api/expenses/category",
            "/api/projection/cash-flow"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# ==================== ENDPOINTS DE BALANCE ====================

@app.get("/api/balance/company")
async def get_company_balance(
    company_id: Optional[str] = Query(None, description="ID de la empresa")
):
    """
    Obtiene el balance financiero de una empresa.
    
    Args:
        company_id: ID de la empresa (opcional)
    
    Returns:
        Balance con ingresos, gastos y balance total
    """
    try:
        logger.info(f"GET /api/balance/company - company_id={company_id}")
        result = get_company_balance_tool(company_id=company_id)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('message', 'Error al obtener balance'))
        
        return result
    except Exception as e:
        logger.error(f"Error en /api/balance/company: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/balance/personal")
async def get_personal_balance(
    user_id: Optional[str] = Query(None, description="ID del usuario")
):
    """
    Obtiene el balance financiero personal.
    
    Args:
        user_id: ID del usuario (opcional)
    
    Returns:
        Balance personal con ingresos, gastos y balance total
    """
    try:
        logger.info(f"GET /api/balance/personal - user_id={user_id}")
        result = get_personal_balance_tool(user_id=user_id)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('message', 'Error al obtener balance'))
        
        return result
    except Exception as e:
        logger.error(f"Error en /api/balance/personal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ENDPOINTS DE GASTOS ====================

@app.get("/api/expenses/category")
async def analyze_expenses_by_category(
    company_id: Optional[str] = Query(None, description="ID de la empresa"),
    start_date: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)")
):
    """
    Analiza gastos agrupados por categoría.
    
    Args:
        company_id: ID de la empresa (opcional)
        start_date: Fecha de inicio (opcional)
        end_date: Fecha de fin (opcional)
    
    Returns:
        Gastos por categoría con totales y porcentajes
    """
    try:
        logger.info(f"GET /api/expenses/category - company_id={company_id}, dates={start_date} to {end_date}")
        result = get_expenses_by_category_tool(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('message', 'Error al obtener gastos'))
        
        return result
    except Exception as e:
        logger.error(f"Error en /api/expenses/category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ENDPOINTS DE PROYECCIONES ====================

@app.get("/api/projection/cash-flow")
async def project_cash_flow(
    company_id: Optional[str] = Query(None, description="ID de la empresa"),
    months: int = Query(3, description="Meses a proyectar (1-24)", ge=1, le=24)
):
    """
    Proyecta el flujo de caja futuro.
    
    Args:
        company_id: ID de la empresa (opcional)
        months: Número de meses a proyectar (default: 3)
    
    Returns:
        Proyección de flujo de caja con recomendaciones
    """
    try:
        logger.info(f"GET /api/projection/cash-flow - company_id={company_id}, months={months}")
        result = get_cash_flow_projection_tool(
            company_id=company_id,
            months=months
        )
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('message', 'Error al generar proyección'))
        
        return result
    except Exception as e:
        logger.error(f"Error en /api/projection/cash-flow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Iniciando servidor HTTP en http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

