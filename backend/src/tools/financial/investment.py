"""
Herramientas de análisis y recomendaciones de inversión.
"""

import logging
from typing import Optional, Dict, Any, List
from database import get_db_connection
from utils import setup_logger

logger = setup_logger('investment_tools', logging.INFO)


def get_investment_recommendations_tool(
    entity_type: str = "personal",
    entity_id: Optional[str] = None,
    investment_amount: Optional[float] = None,
    risk_tolerance: str = "moderate",
    investment_horizon: int = 12
) -> Dict[str, Any]:
    """
    Genera recomendaciones de inversión personalizadas basadas en el perfil financiero.
    
    Args:
        entity_type: Tipo de entidad ("personal" o "company")
        entity_id: ID de la entidad
        investment_amount: Monto a invertir (opcional, se calcula automáticamente)
        risk_tolerance: Tolerancia al riesgo ("conservative", "moderate", "aggressive")
        investment_horizon: Horizonte de inversión en meses
        
    Returns:
        Diccionario con recomendaciones de inversión personalizadas
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Obtener datos financieros de la entidad
        if entity_type == "company":
            # Balance de la empresa
            cursor.execute("""
                SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM transacciones_empresa
                WHERE empresa_id = %s
            """, (entity_id,))
        else:
            # Balance personal
            cursor.execute("""
                SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM transacciones_personales
                WHERE usuario_id = %s
            """, (entity_id,))
        
        balance_row = cursor.fetchone()
        
        if not balance_row or not balance_row.get('balance'):
            return {
                "success": False,
                "error": "No se encontraron datos financieros para esta entidad"
            }
        
        current_balance = float(balance_row['balance'])
        total_income = float(balance_row['ingresos'] or 0)
        total_expenses = float(balance_row['gastos'] or 0)
        
        # Calcular promedios mensuales
        if entity_type == "company":
            cursor.execute("""
                SELECT 
                    AVG(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as avg_income,
                    AVG(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as avg_expense
                FROM transacciones_empresa
                WHERE empresa_id = %s
            """, (entity_id,))
        else:
            cursor.execute("""
                SELECT 
                    AVG(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as avg_income,
                    AVG(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as avg_expense
                FROM transacciones_personales
                WHERE usuario_id = %s
            """, (entity_id,))
        
        avg_row = cursor.fetchone()
        avg_monthly_income = float(avg_row['avg_income'] or 0)
        avg_monthly_expense = float(avg_row['avg_expense'] or 0)
        monthly_surplus = avg_monthly_income - avg_monthly_expense
        
        cursor.close()
        conn.close()
        
        # Calcular monto recomendado para inversión si no se especificó
        if investment_amount is None:
            # Mantener 6 meses de gastos como fondo de emergencia
            emergency_fund = avg_monthly_expense * 6
            available_for_investment = max(0, current_balance - emergency_fund)
            # Recomendar invertir hasta el 70% del excedente
            investment_amount = available_for_investment * 0.7
        
        # Determinar perfil de riesgo basado en la situación financiera
        actual_risk_profile = _determine_risk_profile(
            current_balance,
            monthly_surplus,
            avg_monthly_expense,
            risk_tolerance
        )
        
        # Generar recomendaciones de fondos
        fund_recommendations = _generate_fund_recommendations(
            investment_amount,
            actual_risk_profile,
            investment_horizon
        )
        
        # Generar estrategia de diversificación
        diversification_strategy = _generate_diversification_strategy(
            investment_amount,
            actual_risk_profile
        )
        
        # Calcular proyecciones de rendimiento
        projections = _calculate_investment_projections(
            investment_amount,
            fund_recommendations,
            investment_horizon
        )
        
        # Generar consejos personalizados
        investment_tips = _generate_investment_tips(
            current_balance,
            monthly_surplus,
            investment_amount,
            actual_risk_profile
        )
        
        return {
            "success": True,
            "profile": {
                "current_balance": round(current_balance, 2),
                "monthly_income": round(avg_monthly_income, 2),
                "monthly_expense": round(avg_monthly_expense, 2),
                "monthly_surplus": round(monthly_surplus, 2),
                "emergency_fund_months": round(current_balance / avg_monthly_expense, 1) if avg_monthly_expense > 0 else 0
            },
            "investment_analysis": {
                "recommended_amount": round(investment_amount, 2),
                "risk_profile": actual_risk_profile,
                "investment_horizon_months": investment_horizon,
                "can_invest_monthly": round(monthly_surplus * 0.5, 2) if monthly_surplus > 0 else 0
            },
            "fund_recommendations": fund_recommendations,
            "diversification_strategy": diversification_strategy,
            "projections": projections,
            "tips": investment_tips
        }
        
    except Exception as e:
        logger.error(f"Error en get_investment_recommendations_tool: {e}")
        return {"success": False, "error": str(e)}


def _determine_risk_profile(
    current_balance: float,
    monthly_surplus: float,
    avg_monthly_expense: float,
    preferred_risk: str
) -> str:
    """Determina el perfil de riesgo real basado en la situación financiera."""
    
    # Calcular meses de cobertura
    emergency_months = current_balance / avg_monthly_expense if avg_monthly_expense > 0 else 0
    
    # Si no tiene fondo de emergencia adecuado, forzar perfil conservador
    if emergency_months < 6:
        return "conservative"
    
    # Si tiene excedente mensual bajo, reducir riesgo
    if monthly_surplus < avg_monthly_expense * 0.2:
        if preferred_risk == "aggressive":
            return "moderate"
        return preferred_risk
    
    # Si tiene buena situación financiera, respetar preferencia
    return preferred_risk


def _generate_fund_recommendations(
    investment_amount: float,
    risk_profile: str,
    investment_horizon: int
) -> List[Dict[str, Any]]:
    """Genera recomendaciones de fondos específicos."""
    
    recommendations = []
    
    if risk_profile == "conservative":
        recommendations = [
            {
                "name": "Fondo de Deuda Gubernamental",
                "type": "Renta Fija",
                "risk_level": "Bajo",
                "expected_return_annual": 7.5,
                "minimum_investment": 1000,
                "liquidity": "Alta",
                "description": "Invierte principalmente en CETES y bonos gubernamentales mexicanos. Ideal para preservar capital.",
                "recommended_allocation": 50,
                "providers": ["BBVA", "Banorte", "Actinver"]
            },
            {
                "name": "Fondo de Deuda Corporativa",
                "type": "Renta Fija",
                "risk_level": "Bajo-Medio",
                "expected_return_annual": 9.0,
                "minimum_investment": 5000,
                "liquidity": "Media",
                "description": "Invierte en bonos de empresas mexicanas de alta calidad crediticia.",
                "recommended_allocation": 30,
                "providers": ["GBM", "Actinver", "Banorte"]
            },
            {
                "name": "Fondo de Renta Variable Conservador",
                "type": "Renta Variable",
                "risk_level": "Medio",
                "expected_return_annual": 11.0,
                "minimum_investment": 10000,
                "liquidity": "Media",
                "description": "Invierte en acciones de empresas estables y con dividendos consistentes.",
                "recommended_allocation": 20,
                "providers": ["BlackRock", "Actinver", "GBM"]
            }
        ]
    
    elif risk_profile == "moderate":
        recommendations = [
            {
                "name": "Fondo Balanceado",
                "type": "Mixto",
                "risk_level": "Medio",
                "expected_return_annual": 12.0,
                "minimum_investment": 5000,
                "liquidity": "Media",
                "description": "Combina 60% renta variable y 40% renta fija para balance entre crecimiento y estabilidad.",
                "recommended_allocation": 40,
                "providers": ["Actinver", "GBM", "Banorte"]
            },
            {
                "name": "Fondo de Renta Variable Nacional",
                "type": "Renta Variable",
                "risk_level": "Medio-Alto",
                "expected_return_annual": 14.0,
                "minimum_investment": 10000,
                "liquidity": "Media",
                "description": "Invierte en las principales empresas del mercado mexicano (IPC).",
                "recommended_allocation": 30,
                "providers": ["GBM", "BlackRock", "Actinver"]
            },
            {
                "name": "Fondo Internacional Diversificado",
                "type": "Renta Variable",
                "risk_level": "Medio",
                "expected_return_annual": 13.0,
                "minimum_investment": 10000,
                "liquidity": "Media",
                "description": "Exposición a mercados globales (S&P 500, Europa, Asia).",
                "recommended_allocation": 20,
                "providers": ["BlackRock", "Vanguard", "GBM"]
            },
            {
                "name": "Fondo de Deuda Gubernamental",
                "type": "Renta Fija",
                "risk_level": "Bajo",
                "expected_return_annual": 7.5,
                "minimum_investment": 1000,
                "liquidity": "Alta",
                "description": "Para estabilidad y liquidez inmediata.",
                "recommended_allocation": 10,
                "providers": ["BBVA", "Banorte", "Actinver"]
            }
        ]
    
    else:  # aggressive
        recommendations = [
            {
                "name": "Fondo de Renta Variable Nacional",
                "type": "Renta Variable",
                "risk_level": "Alto",
                "expected_return_annual": 16.0,
                "minimum_investment": 10000,
                "liquidity": "Media",
                "description": "Máxima exposición al mercado mexicano con potencial de alto crecimiento.",
                "recommended_allocation": 35,
                "providers": ["GBM", "Actinver", "BlackRock"]
            },
            {
                "name": "Fondo de Tecnología Global",
                "type": "Renta Variable",
                "risk_level": "Alto",
                "expected_return_annual": 18.0,
                "minimum_investment": 15000,
                "liquidity": "Media-Baja",
                "description": "Invierte en empresas tecnológicas líderes globales (FAANG+).",
                "recommended_allocation": 25,
                "providers": ["BlackRock", "Vanguard", "GBM"]
            },
            {
                "name": "Fondo de Mercados Emergentes",
                "type": "Renta Variable",
                "risk_level": "Alto",
                "expected_return_annual": 17.0,
                "minimum_investment": 10000,
                "liquidity": "Media-Baja",
                "description": "Exposición a economías emergentes con alto potencial de crecimiento.",
                "recommended_allocation": 20,
                "providers": ["BlackRock", "Vanguard", "Actinver"]
            },
            {
                "name": "Fondo Balanceado",
                "type": "Mixto",
                "risk_level": "Medio",
                "expected_return_annual": 12.0,
                "minimum_investment": 5000,
                "liquidity": "Media",
                "description": "Para diversificación y reducción de volatilidad.",
                "recommended_allocation": 15,
                "providers": ["Actinver", "GBM", "Banorte"]
            },
            {
                "name": "Fondo de Deuda Corporativa",
                "type": "Renta Fija",
                "risk_level": "Bajo-Medio",
                "expected_return_annual": 9.0,
                "minimum_investment": 5000,
                "liquidity": "Media",
                "description": "Componente de estabilidad en el portafolio.",
                "recommended_allocation": 5,
                "providers": ["GBM", "Actinver", "Banorte"]
            }
        ]
    
    # Calcular montos recomendados para cada fondo
    for fund in recommendations:
        fund["recommended_amount"] = round(investment_amount * (fund["recommended_allocation"] / 100), 2)
    
    return recommendations


def _generate_diversification_strategy(
    investment_amount: float,
    risk_profile: str
) -> Dict[str, Any]:
    """Genera estrategia de diversificación."""
    
    if risk_profile == "conservative":
        return {
            "asset_allocation": {
                "renta_fija": 80,
                "renta_variable": 15,
                "efectivo": 5
            },
            "geographic_allocation": {
                "mexico": 70,
                "internacional": 30
            },
            "rebalancing_frequency": "Trimestral",
            "description": "Enfoque en preservación de capital con crecimiento moderado"
        }
    elif risk_profile == "moderate":
        return {
            "asset_allocation": {
                "renta_fija": 40,
                "renta_variable": 50,
                "efectivo": 10
            },
            "geographic_allocation": {
                "mexico": 60,
                "internacional": 40
            },
            "rebalancing_frequency": "Semestral",
            "description": "Balance entre crecimiento y estabilidad"
        }
    else:  # aggressive
        return {
            "asset_allocation": {
                "renta_fija": 20,
                "renta_variable": 75,
                "efectivo": 5
            },
            "geographic_allocation": {
                "mexico": 40,
                "internacional": 60
            },
            "rebalancing_frequency": "Anual",
            "description": "Máximo potencial de crecimiento con mayor volatilidad"
        }


def _calculate_investment_projections(
    investment_amount: float,
    fund_recommendations: List[Dict[str, Any]],
    investment_horizon: int
) -> Dict[str, Any]:
    """Calcula proyecciones de rendimiento."""
    
    # Calcular rendimiento promedio ponderado
    weighted_return = sum(
        fund["expected_return_annual"] * (fund["recommended_allocation"] / 100)
        for fund in fund_recommendations
    )
    
    # Proyecciones mensuales
    monthly_return_rate = weighted_return / 100 / 12
    
    projections = []
    current_value = investment_amount
    
    for month in range(1, investment_horizon + 1):
        current_value = current_value * (1 + monthly_return_rate)
        projections.append({
            "month": month,
            "value": round(current_value, 2),
            "gain": round(current_value - investment_amount, 2),
            "return_percentage": round(((current_value - investment_amount) / investment_amount) * 100, 2)
        })
    
    final_projection = projections[-1] if projections else None
    
    return {
        "expected_annual_return": round(weighted_return, 2),
        "monthly_projections": projections,
        "final_value": final_projection["value"] if final_projection else investment_amount,
        "total_gain": final_projection["gain"] if final_projection else 0,
        "total_return_percentage": final_projection["return_percentage"] if final_projection else 0
    }


def _generate_investment_tips(
    current_balance: float,
    monthly_surplus: float,
    investment_amount: float,
    risk_profile: str
) -> List[str]:
    """Genera consejos personalizados de inversión."""
    
    tips = []
    
    # Consejo sobre diversificación
    tips.append("Diversifica tu inversión en al menos 3-4 fondos diferentes para reducir el riesgo.")
    
    # Consejo sobre horizonte de inversión
    if risk_profile == "aggressive":
        tips.append("Con un perfil agresivo, considera un horizonte de inversión de al menos 5 años para maximizar rendimientos.")
    else:
        tips.append("Revisa tu portafolio cada 6 meses y rebalancea si es necesario.")
    
    # Consejo sobre aportaciones periódicas
    if monthly_surplus > 0:
        monthly_investment = round(monthly_surplus * 0.5, 2)
        tips.append(f"Considera hacer aportaciones mensuales de ${monthly_investment:,.2f} para aprovechar el costo promedio.")
    
    # Consejo sobre impuestos
    tips.append("Consulta con un asesor fiscal sobre las implicaciones fiscales de tus inversiones.")
    
    # Consejo sobre comisiones
    tips.append("Compara las comisiones de administración entre diferentes fondos. Una diferencia del 1% puede significar miles de pesos a largo plazo.")
    
    # Consejo sobre liquidez
    tips.append("Mantén siempre un fondo de emergencia líquido equivalente a 6 meses de gastos antes de invertir agresivamente.")
    
    # Consejo sobre educación financiera
    tips.append("Continúa educándote sobre inversiones. Lee sobre análisis fundamental y técnico.")
    
    return tips

