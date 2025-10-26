# src/tools/financial/orchestrator.py
from datetime import datetime
from . import risk, predictive, analytics, descriptive, budget, planning

def get_business_health_check(company_id: str) -> dict:
    """
    Orquestador que responde a: "Dame un panorama completo de la salud financiera de mi empresa".

    Combina el score de salud, el análisis de riesgo, el runway de caja y las alertas
    para dar un diagnóstico integral y accionable.

    Args:
        company_id: El ID de la empresa a analizar.

    Returns:
        Un diccionario con el resumen ejecutivo y los detalles del análisis.
    """
    try:
        # 1. Llamar a las herramientas atómicas de análisis
        health_score = risk.get_financial_health_score_tool(company_id=company_id)
        risk_assessment = risk.assess_financial_risk_tool(company_id=company_id)
        cash_runway = predictive.cash_runway_tool(entity_type="company", entity_id=company_id)
        alerts = risk.get_alerts_tool(company_id=company_id)

        # 2. Sintetizar los resultados en un resumen ejecutivo
        executive_summary = {
            "health_score": health_score.get("financial_health_score"),
            "health_level": health_score.get("level"),
            "risk_level": risk_assessment.get("risk_level"),
            "cash_runway_months": cash_runway.get("cash_runway_months"),
            "active_critical_alerts": len([a for a in alerts.get("active_alerts", []) if a['severity'] == 'critical'])
        }

        # 3. Generar un insight principal
        insight = "La salud financiera es estable."
        if executive_summary['risk_level'] in ["Crítico", "Alto"]:
            insight = "Atención requerida: El nivel de riesgo es elevado. Revise los factores de riesgo y alertas."
        elif executive_summary['cash_runway_months'] is not None and executive_summary['cash_runway_months'] < 6:
            insight = "Alerta de liquidez: El runway de caja es menor a 6 meses. Se necesita un plan de acción."
        elif executive_summary['active_critical_alerts'] > 0:
            insight = "Hay alertas críticas que necesitan atención inmediata."

        return {
            "success": True,
            "orchestrator": "business_health_check",
            "company_id": company_id,
            "executive_summary": executive_summary,
            "primary_insight": insight,
            "details": {
                "health_score_details": health_score,
                "risk_assessment_details": risk_assessment,
                "cash_runway_details": cash_runway,
                "alerts_details": alerts
            }
        }
    except Exception as e:
        return {"success": False, "error": f"Error en el orquestador de salud empresarial: {e}"}


def get_personal_monthly_review(user_id: str, year: int = None, month: int = None) -> dict:
    """
    Orquestador que responde a: "¿Cómo voy con mis finanzas este mes y en qué debería fijarme?".

    Combina el resumen del mes vs el anterior, la comparación con el presupuesto,
    y una predicción de las próximas facturas.

    Args:
        user_id: El ID del usuario a analizar.
        year: Año a analizar (default: actual).
        month: Mes a analizar (default: actual).

    Returns:
        Un diccionario con el resumen del mes, conclusiones y próximos pagos.
    """
    try:
        if not year or not month:
            today = datetime.now()
            year = today.year
            month = today.month

        # 1. Llamar a las herramientas atómicas
        summary = descriptive.monthly_summary_tool(entity_type="personal", entity_id=user_id, year=year, month=month)
        budget_comparison = budget.get_budget_comparison_tool(company_id=user_id, year=year, month=month) # Asumiendo que el presupuesto personal usa la misma tabla/lógica
        bill_forecast = predictive.bill_forecaster_tool(user_id=user_id, months_ahead=1)

        # 2. Sintetizar resultados
        income_change = summary.get("variation_vs_previous_period", {}).get("income_pct_change", 0)
        expense_change = summary.get("variation_vs_previous_period", {}).get("expense_pct_change", 0)
        
        conclusion = f"Este mes, tus ingresos cambiaron en un {income_change}% y tus gastos en un {expense_change}% comparado al mes anterior."
        
        over_budget_cats = []
        if budget_comparison.get("success"):
            over_budget_cats = [c for c in budget_comparison.get("comparison", []) if c['status'] == 'Over budget']
            if over_budget_cats:
                conclusion += f" Cuidado, has gastado de más en {len(over_budget_cats)} categorías."

        return {
            "success": True,
            "orchestrator": "personal_monthly_review",
            "user_id": user_id,
            "period": f"{year}-{month:02d}",
            "main_conclusion": conclusion,
            "details": {
                "monthly_summary": summary,
                "over_budget_categories": over_budget_cats,
                "upcoming_bills": bill_forecast.get("forecasted_recurring_bills", [])
            }
        }
    except Exception as e:
        return {"success": False, "error": f"Error en el orquestador de revisión mensual: {e}"}


def create_debt_reduction_plan(user_id: str, debts: list, initial_extra_payment: float = 0) -> dict:
    """
    Orquestador que responde a: "Ayúdame a crear un plan para salir de mis deudas".

    Primero, busca áreas de ahorro para proponer un pago extra. Luego, usa el optimizador
    de deudas para crear el plan más eficiente.

    Args:
        user_id: El ID del usuario.
        debts: Una lista de las deudas del usuario. Ej: [{"name": "TC1", "balance": 5000, "apr": 22.5, "min_payment": 150}]
        initial_extra_payment: El monto extra que el usuario ya sabe que puede pagar.

    Returns:
        Un plan de pago de deudas accionable.
    """
    try:
        # 1. Buscar ahorros potenciales para sugerir un pago extra
        suggested_savings = 0
        recommendations = analytics.get_category_recommendations_tool(company_id=user_id, top_n=3) # Asumiendo que el usuario es un "company_id" en esta tool
        if recommendations.get("success"):
            # Lógica simple: sugerir ahorrar un 10% de las top 3 categorías de gasto
            for rec in recommendations.get("recommendations", []):
                suggested_savings += rec.get("total_spent", 0) * 0.10
        
        total_extra_payment = initial_extra_payment + suggested_savings

        # 2. Crear el plan de pago con el método avalancha (el más eficiente)
        debt_plan = planning.debt_paydown_optimizer_tool(
            entity_type="personal",
            entity_id=user_id,
            debts=debts,
            metodo="avalancha",
            extra_mensual=total_extra_payment
        )

        if not debt_plan.get("success"):
            return debt_plan # Devolver el error del optimizador

        return {
            "success": True,
            "orchestrator": "debt_reduction_plan",
            "user_id": user_id,
            "suggestion": f"Hemos identificado un potencial de ahorro de ${suggested_savings:.2f}/mes en tus gastos. Usando esto más tu aporte inicial, puedes destinar un total de ${total_extra_payment:.2f} extra al mes para pagar tus deudas.",
            "debt_payoff_plan": debt_plan
        }
    except Exception as e:
        return {"success": False, "error": f"Error en el orquestador de plan de deudas: {e}"}