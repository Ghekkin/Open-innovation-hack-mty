"""
Servidor MCP sobre HTTP usando FastMCP.
Este servidor implementa el protocolo MCP completo pero usando HTTP como transporte.
"""

import logging
from typing import Optional
from fastmcp import FastMCP

from database import get_db_connection
from tools.financial.balance import get_company_balance_tool, get_personal_balance_tool
from tools.financial.expense import get_expenses_by_category_tool
from tools.financial.projection import get_cash_flow_projection_tool, simulate_scenario_tool
from tools.financial.budget import get_budget_comparison_tool
from tools.financial.risk import (
    get_financial_health_score_tool,
    assess_financial_risk_tool,
    get_alerts_tool,
    get_stress_test_tool,
)
from tools.financial.analytics import (
    get_spending_trends_tool,
    get_category_recommendations_tool,
    detect_anomalies_tool,
    compare_periods_tool,
)
from tools.financial.predictive import predict_cash_shortage_tool
from tools.financial.financial_plan import generate_financial_plan_tool
from tools.financial.shortcuts import get_current_month_spending_summary
from tools.financial.investment import get_investment_recommendations_tool
from utils import setup_logger

# Setup logger
logger = setup_logger('mcp_http_server', logging.INFO)

# Initialize FastMCP server
mcp = FastMCP(
    name="",
    instructions="""
    Servidor MCP para análisis financiero inteligente.
    
    Este servidor proporciona herramientas avanzadas para:
    - Análisis de balances financieros (empresariales y personales)
    - Proyecciones de flujo de caja
    - Simulaciones de escenarios "what-if"
    - Evaluación de riesgos financieros
    - Detección de anomalías en gastos
    - Recomendaciones personalizadas de optimización
    - Alertas proactivas de problemas financieros
    
    Todas las herramientas están diseñadas para ayudar a tomar mejores decisiones
    financieras basadas en datos reales y análisis predictivo.
    """,
)


# ==================== HERRAMIENTAS DE BALANCE ====================

@mcp.tool()
def get_company_balance(company_id: Optional[str] = None) -> dict:
    """
    Obtiene el balance financiero actual de una empresa.
    
    Incluye ingresos totales, gastos totales y balance neto.
    Útil para conocer la situación financiera general de la empresa.
    
    Args:
        company_id: ID de la empresa (opcional, si no se proporciona devuelve el total)
    
    Returns:
        Diccionario con balance_total, ingresos_totales, gastos_totales y detalles
    """
    logger.info(f"Ejecutando get_company_balance para company_id={company_id}")
    return get_company_balance_tool(company_id=company_id)


@mcp.tool()
def get_personal_balance(user_id: Optional[str] = None) -> dict:
    """
    Obtiene el balance financiero personal de un usuario.
    
    Incluye ingresos totales, gastos totales y balance neto personal.
    
    Args:
        user_id: ID del usuario (opcional)
    
    Returns:
        Diccionario con balance_total, ingresos_totales, gastos_totales y detalles
    """
    logger.info(f"Ejecutando get_personal_balance para user_id={user_id}")
    return get_personal_balance_tool(user_id=user_id)


# ==================== ANÁLISIS DE GASTOS ====================

@mcp.tool()
def analyze_expenses_by_category(
    company_id: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> dict:
    """
    Analiza los gastos agrupados por categoría.
    
    Muestra el total gastado en cada categoría, número de transacciones
    y porcentaje del total. Permite filtrar por rango de fechas.
    
    Args:
        company_id: ID de la empresa (opcional)
        user_id: ID del usuario para finanzas personales (opcional)
        start_date: Fecha de inicio en formato YYYY-MM-DD (opcional)
        end_date: Fecha de fin en formato YYYY-MM-DD (opcional)
    
    Returns:
        Diccionario con categorías, totales y porcentajes de gasto
    """
    logger.info(f"Ejecutando analyze_expenses_by_category: company={company_id}, user={user_id}, dates={start_date} to {end_date}")
    return get_expenses_by_category_tool(
        company_id=company_id,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date
    )


# ==================== PROYECCIONES ====================

@mcp.tool()
def project_cash_flow(
    company_id: Optional[str] = None,
    months: int = 3
) -> dict:
    """
    Proyecta el flujo de caja futuro basándose en el histórico.
    
    Calcula promedios mensuales de ingresos y gastos, y estima
    el balance para los próximos meses. Incluye recomendaciones.
    
    Args:
        company_id: ID de la empresa (opcional)
        months: Número de meses a proyectar (1-24, default: 3)
    
    Returns:
        Diccionario con proyecciones mensuales y recomendaciones
    """
    logger.info(f"Ejecutando project_cash_flow: company={company_id}, months={months}")
    return get_cash_flow_projection_tool(company_id=company_id, months=months)


@mcp.tool()
def simulate_financial_scenario(
    current_balance: float,
    monthly_income_change: float = 0,
    monthly_expense_change: float = 0,
    months: int = 6
) -> dict:
    """
    Simula un escenario 'what-if' financiero.
    
    Permite probar cambios en ingresos o gastos mensuales y ver
    el impacto proyectado en el balance a lo largo de varios meses.
    
    Args:
        current_balance: Balance actual de inicio
        monthly_income_change: Cambio en ingresos mensuales (puede ser negativo)
        monthly_expense_change: Cambio en gastos mensuales (puede ser negativo)
        months: Número de meses a simular (1-24, default: 6)
    
    Returns:
        Diccionario con proyección del escenario simulado
    """
    logger.info(f"Ejecutando simulate_financial_scenario: balance={current_balance}, months={months}")
    return simulate_scenario_tool(
        current_balance=current_balance,
        monthly_income_change=monthly_income_change,
        monthly_expense_change=monthly_expense_change,
        months=months
    )


# ==================== PRESUPUESTO ====================

@mcp.tool()
def compare_budget_vs_actual(
    company_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> dict:
    """
    Compara los gastos presupuestados vs los gastos reales.
    
    Identifica variaciones y áreas que requieren atención para
    un mes específico.
    
    Args:
        company_id: ID de la empresa (opcional)
        month: Mes a analizar (1-12, default: mes actual)
        year: Año a analizar (default: año actual)
    
    Returns:
        Diccionario con comparación presupuesto vs real por categoría
    """
    logger.info(f"Ejecutando compare_budget_vs_actual: company={company_id}, {month}/{year}")
    return get_budget_comparison_tool(company_id=company_id, month=month, year=year)


# ==================== SALUD FINANCIERA ====================

@mcp.tool()
def get_financial_health_score(
    company_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> dict:
    """
    Calcula un score integral de salud financiera (0-100).
    
    Analiza múltiples métricas: tasa de ahorro, ratio de gastos,
    y balance. Incluye recomendaciones personalizadas.
    
    Args:
        company_id: ID de la empresa (opcional)
        user_id: ID del usuario para finanzas personales (opcional)
    
    Returns:
        Diccionario con score, nivel de salud y recomendaciones
    """
    logger.info(f"Ejecutando get_financial_health_score: company={company_id}, user={user_id}")
    return get_financial_health_score_tool(company_id=company_id, user_id=user_id)


# ==================== TENDENCIAS ====================

@mcp.tool()
def get_spending_trends(
    company_id: Optional[str] = None,
    months_back: int = 6
) -> dict:
    """
    Analiza tendencias de gasto a lo largo del tiempo.
    
    Identifica patrones, crecimiento promedio, y meses con
    mayor/menor gasto. Útil para entender comportamiento financiero.
    
    Args:
        company_id: ID de la empresa (opcional)
        months_back: Número de meses a analizar (1-24, default: 6)
    
    Returns:
        Diccionario con tendencias mensuales y análisis de patrones
    """
    logger.info(f"Ejecutando get_spending_trends: company={company_id}, months_back={months_back}")
    return get_spending_trends_tool(company_id=company_id, months_back=months_back)


# ==================== RECOMENDACIONES ====================

@mcp.tool()
def get_category_recommendations(
    company_id: Optional[str] = None,
    top_n: int = 5
) -> dict:
    """
    Genera recomendaciones personalizadas para optimizar gastos.
    
    Identifica las categorías con mayor gasto y sugiere acciones
    específicas para reducir costos.
    
    Args:
        company_id: ID de la empresa (opcional)
        top_n: Número de categorías principales a analizar (default: 5)
    
    Returns:
        Diccionario con recomendaciones por categoría
    """
    logger.info(f"Ejecutando get_category_recommendations: company={company_id}, top_n={top_n}")
    return get_category_recommendations_tool(company_id=company_id, top_n=top_n)


# ==================== DETECCIÓN DE ANOMALÍAS ====================

@mcp.tool()
def detect_anomalies(
    company_id: Optional[str] = None,
    threshold: float = 2.0
) -> dict:
    """
    Detecta transacciones o patrones de gasto inusuales.
    
    Identifica gastos que se desvían significativamente del promedio.
    Útil para identificar gastos sospechosos o excepcionales.
    
    Args:
        company_id: ID de la empresa (opcional)
        threshold: Umbral de desviación estándar (default: 2.0)
    
    Returns:
        Diccionario con anomalías detectadas y análisis
    """
    logger.info(f"Ejecutando detect_anomalies: company={company_id}, threshold={threshold}")
    return detect_anomalies_tool(company_id=company_id, threshold=threshold)


# ==================== COMPARACIÓN DE PERÍODOS ====================

@mcp.tool()
def compare_periods(
    company_id: Optional[str] = None,
    period1_start: str = None,
    period1_end: str = None,
    period2_start: str = None,
    period2_end: str = None
) -> dict:
    """
    Compara métricas financieras entre dos períodos de tiempo.
    
    Muestra cambios absolutos y porcentuales en ingresos, gastos
    y balance. Ideal para análisis de crecimiento.
    
    Args:
        company_id: ID de la empresa (opcional)
        period1_start: Fecha inicio período 1 (YYYY-MM-DD)
        period1_end: Fecha fin período 1 (YYYY-MM-DD)
        period2_start: Fecha inicio período 2 (YYYY-MM-DD)
        period2_end: Fecha fin período 2 (YYYY-MM-DD)
    
    Returns:
        Diccionario con comparación entre períodos
    """
    logger.info(f"Ejecutando compare_periods: company={company_id}")
    return compare_periods_tool(
        company_id=company_id,
        period1_start=period1_start,
        period1_end=period1_end,
        period2_start=period2_start,
        period2_end=period2_end
    )


# ==================== EVALUACIÓN DE RIESGOS ====================

@mcp.tool()
def assess_financial_risk(company_id: Optional[str] = None) -> dict:
    """
    Evalúa el nivel de riesgo financiero general.
    
    Analiza múltiples factores de riesgo como balance negativo,
    ratio de gastos alto, y reservas bajas. Proporciona un score de riesgo.
    
    Args:
        company_id: ID de la empresa (opcional)
    
    Returns:
        Diccionario con nivel de riesgo, score y factores de riesgo
    """
    logger.info(f"Ejecutando assess_financial_risk: company={company_id}")
    return assess_financial_risk_tool(company_id=company_id)


@mcp.tool()
def get_alerts(
    company_id: Optional[str] = None,
    severity: Optional[str] = None
) -> dict:
    """
    Obtiene alertas financieras activas que requieren atención.
    
    Identifica problemas como balance bajo, gastos excesivos,
    o falta de ingresos. Puede filtrar por severidad.
    
    Args:
        company_id: ID de la empresa (opcional)
        severity: Filtrar por severidad: 'low', 'medium', 'high', 'critical'
    
    Returns:
        Diccionario con alertas activas y recomendaciones
    """
    logger.info(f"Ejecutando get_alerts: company={company_id}, severity={severity}")
    return get_alerts_tool(company_id=company_id, severity=severity)


@mcp.tool()
def predict_cash_shortage(
    company_id: Optional[str] = None,
    months_ahead: int = 6
) -> dict:
    """
    Predice posibles escaseces de efectivo en el futuro.
    
    Basándose en tendencias actuales, identifica cuándo podría
    ocurrir una escasez y proporciona recomendaciones preventivas.
    
    Args:
        company_id: ID de la empresa (opcional)
        months_ahead: Meses a predecir (default: 6)
    
    Returns:
        Diccionario con predicción de escasez y recomendaciones
    """
    logger.info(f"Ejecutando predict_cash_shortage: company={company_id}, months_ahead={months_ahead}")
    return predict_cash_shortage_tool(company_id=company_id, months_ahead=months_ahead)


@mcp.tool()
def get_stress_test(
    company_id: Optional[str] = None,
    income_reduction: float = 30.0,
    expense_increase: float = 20.0
) -> dict:
    """
    Realiza una prueba de estrés financiero.
    
    Simula escenarios adversos (reducción de ingresos y aumento de gastos).
    Evalúa la resiliencia financiera y tiempo de supervivencia.
    
    Args:
        company_id: ID de la empresa (opcional)
        income_reduction: Porcentaje de reducción en ingresos (default: 30)
        expense_increase: Porcentaje de aumento en gastos (default: 20)
    
    Returns:
        Diccionario con resultados de la prueba de estrés
    """
    logger.info(f"Ejecutando get_stress_test: company={company_id}, income_reduction={income_reduction}%, expense_increase={expense_increase}%")
    return get_stress_test_tool(
        company_id=company_id,
        income_reduction=income_reduction,
        expense_increase=expense_increase
    )


# ==================== PLANIFICACIÓN FINANCIERA ====================

@mcp.tool()
def generate_financial_plan(
    entity_type: str = "personal",
    entity_id: Optional[str] = None,
    plan_goal: Optional[str] = None,
    use_saved_data: bool = True,
    additional_incomes: Optional[list] = None,
    additional_expenses: Optional[list] = None,
    planning_horizon_months: int = 12
) -> dict:
    """
    Genera un plan financiero personalizado completo.
    
    Crea un plan detallado con proyecciones, recomendaciones y estrategias
    basadas en datos históricos y metas específicas del usuario.
    
    Args:
        entity_type: Tipo de entidad ("personal" o "company")
        entity_id: ID de la entidad
        plan_goal: Meta financiera del usuario (ej: "Ahorrar $10,000 en 6 meses")
        use_saved_data: Si usar datos guardados en la base de datos
        additional_incomes: Lista de ingresos adicionales a considerar
        additional_expenses: Lista de gastos adicionales a considerar
        planning_horizon_months: Horizonte de planificación en meses (default: 12)
    
    Returns:
        Plan financiero completo con proyecciones, métricas, recomendaciones y estrategias
    """
    logger.info(f"Ejecutando generate_financial_plan: entity={entity_type}/{entity_id}, goal={plan_goal}")
    return generate_financial_plan_tool(
        entity_type=entity_type,
        entity_id=entity_id,
        plan_goal=plan_goal,
        use_saved_data=use_saved_data,
        additional_incomes=additional_incomes or [],
        additional_expenses=additional_expenses or [],
        planning_horizon_months=planning_horizon_months
    )


# ==================== RECOMENDACIONES DE INVERSIÓN ====================

@mcp.tool()
def get_investment_recommendations(
    entity_type: str = "personal",
    entity_id: Optional[str] = None,
    investment_amount: Optional[float] = None,
    risk_tolerance: str = "moderate",
    investment_horizon: int = 12
) -> dict:
    """
    Genera recomendaciones personalizadas de inversión en fondos.
    
    Analiza tu perfil financiero y sugiere fondos de inversión específicos,
    estrategias de diversificación y proyecciones de rendimiento.
    
    Args:
        entity_type: Tipo de entidad ("personal" o "company")
        entity_id: ID de la entidad
        investment_amount: Monto a invertir (opcional, se calcula automáticamente)
        risk_tolerance: Tolerancia al riesgo ("conservative", "moderate", "aggressive")
        investment_horizon: Horizonte de inversión en meses (default: 12)
    
    Returns:
        Recomendaciones de fondos, estrategia de diversificación y proyecciones
    """
    logger.info(f"Ejecutando get_investment_recommendations: entity={entity_type}/{entity_id}, amount={investment_amount}, risk={risk_tolerance}")
    return get_investment_recommendations_tool(
        entity_type=entity_type,
        entity_id=entity_id,
        investment_amount=investment_amount,
        risk_tolerance=risk_tolerance,
        investment_horizon=investment_horizon
    )


# ==================== ATAJOS FINANCIEROS ====================

@mcp.tool()
def get_current_month_spending(
    entity_type: str = "personal",
    entity_id: Optional[str] = None
) -> dict:
    """
    Obtiene un resumen del total de gastos para el mes actual.
    Es un atajo para la pregunta '¿Cuánto he gastado este mes?'.
    No requiere especificar fechas.
    
    Args:
        entity_type: Tipo de entidad ('personal' o 'company', default: 'personal')
        entity_id: ID de la entidad (usuario o empresa)
        
    Returns:
        Diccionario con el total gastado y número de transacciones.
    """
    logger.info(f"Ejecutando get_current_month_spending: entity_type={entity_type}, entity_id={entity_id}")
    return get_current_month_spending_summary(entity_type=entity_type, entity_id=entity_id)


# ==================== INICIALIZACIÓN ====================

def initialize_server():
    """Inicialización del servidor MCP."""
    logger.info("=" * 60)
    logger.info("INICIANDO SERVIDOR MCP FINANCIERO SOBRE HTTP")
    logger.info("=" * 60)
    
    # Test database connection
    try:
        db = get_db_connection()
        if db.test_connection():
            logger.info("Conexión a base de datos establecida exitosamente")
        else:
            logger.warning("No se pudo conectar a la base de datos")
    except Exception as e:
        logger.error(f"Error al conectar a la base de datos: {e}")
        logger.warning("El servidor iniciará sin conexión a base de datos")
    
    logger.info("=" * 60)
    logger.info("Servidor MCP listo para recibir conexiones")
    logger.info("=" * 60)


if __name__ == "__main__":
    import os
    import asyncio
    
    # Inicializar servidor
    initialize_server()
    
    port = int(os.getenv("PORT", 8080))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Iniciando servidor en {host}:{port}")
    logger.info(f"Protocolo: MCP sobre HTTP (streamable-http)")
    logger.info(f"Entorno: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Run the MCP server over HTTP
    # streamable-http es el transporte correcto para Coolify y servidores HTTP
    asyncio.run(
        mcp.run_async(
            transport="streamable-http",
            host=host,
            port=port,
        )
    )

