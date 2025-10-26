# src/tools/text/narrative.py
from . import formatting

def generate_narrative_from_data(data: dict) -> str:
    """
    Toma un diccionario de datos (generalmente de un orquestador) y genera
    una narrativa en lenguaje natural que explica los resultados.
    """
    if not data or not data.get("success"):
        return "No pude procesar la información para generar un resumen."

    orchestrator = data.get("orchestrator")

    if orchestrator == "business_health_check":
        return _narrate_business_health_check(data)
    elif orchestrator == "personal_monthly_review":
        return _narrate_personal_monthly_review(data)
    elif orchestrator == "debt_reduction_plan":
        return _narrate_debt_reduction_plan(data)
    else:
        # Caso por defecto para JSONs no reconocidos (aún útil)
        return "Aquí tienes un resumen de los datos solicitados. Si necesitas una explicación más detallada, no dudes en preguntar."


def _narrate_business_health_check(data: dict) -> str:
    summary = data.get("executive_summary", {})
    insight = data.get("primary_insight", "")
    risk_factors = data.get("details", {}).get("risk_assessment_details", {}).get("risk_factors", [])

    health_level = summary.get("health_level", "desconocido").lower()
    risk_level = summary.get("risk_level", "desconocido").lower()
    runway = summary.get("cash_runway_months", 0)

    narrative = f"¡Claro! Aquí tienes el chequeo de salud de tu empresa:\n\n"
    narrative += f"En general, la salud financiera de tu empresa es **{health_level}**, con un nivel de riesgo **{risk_level}**. {insight}\n\n"

    if runway is not None and runway < 12 and runway != float('inf'):
        narrative += f"Tu 'cash runway' (el tiempo que la empresa puede operar con el efectivo actual) es de aproximadamente **{runway:.1f} meses**. Es importante vigilar este número de cerca.\n"
    elif runway == float('inf'):
        narrative += "¡Excelentes noticias! Tu flujo de caja es positivo, por lo que no estás consumiendo tus reservas de efectivo.\n"

    if risk_factors:
        factor_names = [rf.get("factor") for rf in risk_factors]
        narrative += "\n" + formatting.format_list(factor_names, "Los principales factores de riesgo detectados son")

    narrative += "\n\nSi quieres profundizar en algún punto, solo tienes que pedirlo."
    return narrative

def _narrate_personal_monthly_review(data: dict) -> str:
    conclusion = data.get("main_conclusion", "")
    details = data.get("details", {})
    over_budget = details.get("over_budget_categories", [])
    upcoming_bills = details.get("upcoming_bills", [])

    narrative = f"Hola, aquí tienes tu revisión mensual para el período {data.get('period', '')}:\n\n"
    narrative += f"{conclusion}\n"

    if over_budget:
        category_names = [f"{c.get('category')} (gastaste {formatting.format_currency(c.get('variance', 0) * -1)} de más)" for c in over_budget]
        narrative += "\n" + formatting.format_list(category_names, "Áreas para poner atención (sobrepresupuesto)")
    else:
        narrative += "\n¡Felicidades! Te mantuviste dentro de tu presupuesto en todas las categorías.\n"

    if upcoming_bills:
        bill_names = [f"{b.get('description')} - aprox. {formatting.format_currency(b.get('amount', 0))} el {b.get('predicted_date')}" for b in upcoming_bills]
        narrative += "\n" + formatting.format_list(bill_names, "Recuerda tus próximos pagos importantes")

    narrative += "\n\nSigue así y no dudes en consultarme si quieres crear un plan de ahorro."
    return narrative


def _narrate_debt_reduction_plan(data: dict) -> str:
    suggestion = data.get("suggestion", "")
    plan = data.get("debt_payoff_plan", {})
    
    if not plan.get("success"):
        return "No se pudo generar un plan de pago de deudas. Asegúrate de que los datos de las deudas sean correctos."

    total_interest = plan.get("total_interest_paid", 0)
    months = plan.get("months_to_freedom", 0)
    method = plan.get("method", "").replace("_", " ")

    narrative = f"He preparado un plan de reducción de deudas para ti:\n\n{suggestion}\n\n"
    narrative += f"Siguiendo este plan (método **{method}**), podrías estar libre de deudas en aproximadamente **{months} meses**. En el proceso, te ahorrarías una cantidad significativa, pagando un total de **{formatting.format_currency(total_interest)} en intereses** en lugar de mucho más.\n"
    narrative += "\nLa clave es ser constante con los pagos. ¡Tú puedes!"
    return narrative
