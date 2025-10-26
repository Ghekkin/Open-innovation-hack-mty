from database import get_db_connection
from utils import setup_logger
import logging
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import json

logger = setup_logger('financial_plan_tools', logging.INFO)

def generate_financial_plan_tool(
    entity_type: str = "personal",
    entity_id: str = None,
    plan_goal: str = None,
    use_saved_data: bool = True,
    additional_incomes: list = None,
    additional_expenses: list = None,
    planning_horizon_months: int = 12
) -> dict:
    """
    Genera un plan financiero personalizado basado en datos históricos y metas del usuario.
    
    Args:
        entity_type: Tipo de entidad ("personal" o "company")
        entity_id: ID de la entidad
        plan_goal: Meta financiera descrita por el usuario
        use_saved_data: Si usar datos guardados en la BD
        additional_incomes: Lista de ingresos adicionales [{description, amount, frequency, start_date, end_date}]
        additional_expenses: Lista de gastos adicionales [{description, amount, frequency, start_date, end_date}]
        planning_horizon_months: Horizonte de planificación en meses
    
    Returns:
        Plan financiero completo con proyecciones, recomendaciones y estrategias
    """
    try:
        # Normalizar el tipo de entidad: aceptar 'empresa' o 'company'
        normalized_type = "company" if str(entity_type).lower() in ("company", "empresa") else "personal"
        logger.info(f"Generando plan financiero para {normalized_type} {entity_id}")

        db = get_db_connection()
        # Usar tablas reales del esquema MySQL
        table = "finanzas_personales" if normalized_type == "personal" else "finanzas_empresa"
        # Columnas de ID reales por esquema
        id_column = "id_usuario" if normalized_type == "personal" else "empresa_id"
        
        # 1. Obtener datos históricos si use_saved_data es True
        historical_data = {}
        if use_saved_data and entity_id:
            # Obtener balance actual
            balance_query = f"""
                SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM {table}
                WHERE {id_column} = %s
            """
            balance_result = db.execute_query(balance_query, (entity_id,), fetch='one')
            current_balance = float(balance_result[0]) if balance_result and balance_result[0] else 0
            
            # Obtener promedios mensuales de los últimos 6 meses
            avg_query = f"""
                SELECT 
                    AVG(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as avg_income,
                    AVG(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as avg_expense
                FROM {table}
                WHERE {id_column} = %s 
                AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            """
            avg_result = db.execute_query(avg_query, (entity_id,), fetch='one')
            avg_monthly_income = float(avg_result[0]) if avg_result and avg_result[0] else 0
            avg_monthly_expense = float(avg_result[1]) if avg_result and avg_result[1] else 0
            
            # Obtener gastos por categoría
            category_query = f"""
                SELECT categoria, AVG(monto) as avg_amount, COUNT(*) as frequency
                FROM {table}
                WHERE {id_column} = %s 
                AND tipo = 'gasto'
                AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY categoria
                ORDER BY avg_amount DESC
            """
            categories = db.execute_query(category_query, (entity_id,), fetch='all')
            
            historical_data = {
                "current_balance": current_balance,
                "avg_monthly_income": avg_monthly_income,
                "avg_monthly_expense": avg_monthly_expense,
                "monthly_net": avg_monthly_income - avg_monthly_expense,
                "expense_categories": [
                    {"category": c[0], "avg_amount": float(c[1]), "frequency": int(c[2])}
                    for c in categories
                ] if categories else []
            }
        else:
            historical_data = {
                "current_balance": 0,
                "avg_monthly_income": 0,
                "avg_monthly_expense": 0,
                "monthly_net": 0,
                "expense_categories": []
            }
        
        # 2. Procesar ingresos y gastos adicionales
        additional_monthly_income = 0
        additional_monthly_expense = 0
        
        if additional_incomes:
            for income in additional_incomes:
                monthly_equiv = _convert_to_monthly(income['amount'], income['frequency'])
                additional_monthly_income += monthly_equiv
        
        if additional_expenses:
            for expense in additional_expenses:
                monthly_equiv = _convert_to_monthly(expense['amount'], expense['frequency'])
                additional_monthly_expense += monthly_equiv
        
        # 3. Calcular proyecciones mensuales
        total_monthly_income = historical_data['avg_monthly_income'] + additional_monthly_income
        total_monthly_expense = historical_data['avg_monthly_expense'] + additional_monthly_expense
        monthly_net = total_monthly_income - total_monthly_expense
        
        # 4. Analizar la meta del usuario
        goal_analysis = _analyze_goal(plan_goal)
        
        # 5. Crear proyección mes a mes
        projections = []
        current_balance = historical_data['current_balance']
        
        for month in range(planning_horizon_months):
            month_date = datetime.now() + relativedelta(months=month)
            current_balance += monthly_net
            
            projections.append({
                "month": month + 1,
                "date": month_date.strftime("%Y-%m"),
                "income": round(total_monthly_income, 2),
                "expense": round(total_monthly_expense, 2),
                "net": round(monthly_net, 2),
                "balance": round(current_balance, 2)
            })
        
        # 6. Generar recomendaciones basadas en el análisis
        recommendations = _generate_recommendations(
            historical_data,
            monthly_net,
            goal_analysis,
            projections
        )
        
        # 7. Identificar áreas de mejora
        improvement_areas = _identify_improvement_areas(
            historical_data['expense_categories'],
            total_monthly_expense
        )
        
        # 8. Crear estrategias de ahorro
        savings_strategies = _create_savings_strategies(
            improvement_areas,
            goal_analysis,
            monthly_net
        )
        
        # 9. Calcular métricas clave
        metrics = {
            "savings_rate": round((monthly_net / total_monthly_income * 100), 2) if total_monthly_income > 0 else 0,
            "expense_ratio": round((total_monthly_expense / total_monthly_income * 100), 2) if total_monthly_income > 0 else 0,
            "months_to_goal": _calculate_months_to_goal(goal_analysis, monthly_net, current_balance),
            "emergency_fund_months": round(current_balance / total_monthly_expense, 2) if total_monthly_expense > 0 else 0
        }
        
        # 10. Generar alertas y advertencias
        alerts = _generate_alerts(metrics, monthly_net, projections)
        
        return {
            "success": True,
            "plan_id": f"FP-{entity_type[:3].upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "generated_at": datetime.now().isoformat(),
            "entity_type": normalized_type,
            "entity_id": entity_id,
            "goal": plan_goal,
            "goal_analysis": goal_analysis,
            "current_situation": {
                "current_balance": round(historical_data['current_balance'], 2),
                "monthly_income": round(total_monthly_income, 2),
                "monthly_expense": round(total_monthly_expense, 2),
                "monthly_net": round(monthly_net, 2),
                "from_historical": use_saved_data,
                "additional_incomes_count": len(additional_incomes) if additional_incomes else 0,
                "additional_expenses_count": len(additional_expenses) if additional_expenses else 0
            },
            "metrics": metrics,
            "projections": projections,
            "recommendations": recommendations,
            "improvement_areas": improvement_areas,
            "savings_strategies": savings_strategies,
            "alerts": alerts,
            "planning_horizon_months": planning_horizon_months
        }
        
    except Exception as e:
        logger.error(f"Error en generate_financial_plan_tool: {e}")
        return {"success": False, "error": str(e)}


def _convert_to_monthly(amount: float, frequency: str) -> float:
    """Convierte un monto de cualquier frecuencia a su equivalente mensual."""
    conversions = {
        "unica": 0,  # No se cuenta como recurrente
        "semanal": amount * 4.33,  # ~4.33 semanas por mes
        "quincenal": amount * 2,
        "mensual": amount,
        "anual": amount / 12
    }
    return conversions.get(frequency, 0)


def _analyze_goal(goal_text: str) -> dict:
    """Analiza el texto de la meta para extraer información relevante."""
    if not goal_text:
        return {
            "type": "general",
            "description": "Mejorar salud financiera general",
            "target_amount": None,
            "timeframe": None
        }
    
    goal_lower = goal_text.lower()
    
    # Detectar tipo de meta
    goal_type = "general"
    if any(word in goal_lower for word in ["ahorrar", "ahorro", "guardar"]):
        goal_type = "savings"
    elif any(word in goal_lower for word in ["deuda", "pagar", "liquidar"]):
        goal_type = "debt_payoff"
    elif any(word in goal_lower for word in ["invertir", "inversión", "inversion"]):
        goal_type = "investment"
    elif any(word in goal_lower for word in ["comprar", "adquirir", "compra"]):
        goal_type = "purchase"
    
    # Intentar extraer monto (números con $ o sin él)
    import re
    amount_match = re.search(r'\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)', goal_text)
    target_amount = None
    if amount_match:
        amount_str = amount_match.group(1).replace(',', '')
        target_amount = float(amount_str)
    
    # Intentar extraer timeframe
    timeframe = None
    timeframe_match = re.search(r'(\d+)\s*(mes|meses|año|años)', goal_lower)
    if timeframe_match:
        number = int(timeframe_match.group(1))
        unit = timeframe_match.group(2)
        if 'año' in unit:
            timeframe = number * 12
        else:
            timeframe = number
    
    return {
        "type": goal_type,
        "description": goal_text,
        "target_amount": target_amount,
        "timeframe": timeframe
    }


def _generate_recommendations(historical_data: dict, monthly_net: float, goal_analysis: dict, projections: list) -> list:
    """Genera recomendaciones personalizadas basadas en el análisis."""
    recommendations = []
    
    # Recomendación sobre tasa de ahorro
    if monthly_net < 0:
        recommendations.append({
            "priority": "critical",
            "category": "balance",
            "title": "Balance negativo detectado",
            "description": f"Actualmente gastas ${abs(monthly_net):.2f} más de lo que ingresas cada mes. Es urgente reducir gastos o aumentar ingresos.",
            "action": "Revisa las áreas de mejora identificadas y aplica las estrategias de ahorro sugeridas."
        })
    elif monthly_net < historical_data['avg_monthly_income'] * 0.1:
        recommendations.append({
            "priority": "high",
            "category": "savings",
            "title": "Tasa de ahorro baja",
            "description": "Tu capacidad de ahorro es menor al 10% de tus ingresos. Se recomienda al menos 20% para una salud financiera óptima.",
            "action": "Identifica gastos no esenciales que puedas reducir o eliminar."
        })
    
    # Recomendación sobre fondo de emergencia
    emergency_months = historical_data['current_balance'] / historical_data['avg_monthly_expense'] if historical_data['avg_monthly_expense'] > 0 else 0
    if emergency_months < 3:
        recommendations.append({
            "priority": "high",
            "category": "emergency_fund",
            "title": "Fondo de emergencia insuficiente",
            "description": f"Tu balance actual solo cubre {emergency_months:.1f} meses de gastos. Se recomienda tener entre 3-6 meses.",
            "action": "Prioriza construir un fondo de emergencia antes de otras metas financieras."
        })
    
    # Recomendación basada en la meta
    if goal_analysis['target_amount'] and goal_analysis['timeframe']:
        required_monthly = goal_analysis['target_amount'] / goal_analysis['timeframe']
        if required_monthly > monthly_net:
            recommendations.append({
                "priority": "high",
                "category": "goal",
                "title": "Meta financiera ambiciosa",
                "description": f"Para alcanzar tu meta necesitas ahorrar ${required_monthly:.2f}/mes, pero solo tienes ${monthly_net:.2f} disponibles.",
                "action": "Considera extender el plazo, reducir el monto objetivo, o implementar estrategias agresivas de ahorro."
            })
        else:
            recommendations.append({
                "priority": "medium",
                "category": "goal",
                "title": "Meta financiera alcanzable",
                "description": f"Tu meta requiere ${required_monthly:.2f}/mes y tienes ${monthly_net:.2f} disponibles. ¡Estás en buen camino!",
                "action": "Mantén tu disciplina financiera y considera automatizar tus ahorros."
            })
    
    # Recomendación sobre proyección
    final_balance = projections[-1]['balance'] if projections else 0
    if final_balance < 0:
        recommendations.append({
            "priority": "critical",
            "category": "projection",
            "title": "Proyección negativa",
            "description": f"Con tu situación actual, en {len(projections)} meses tendrás un balance negativo de ${abs(final_balance):.2f}.",
            "action": "Debes tomar acción inmediata para cambiar tu trayectoria financiera."
        })
    
    return recommendations


def _identify_improvement_areas(expense_categories: list, total_monthly_expense: float) -> list:
    """Identifica áreas donde se puede mejorar el gasto."""
    improvement_areas = []
    
    for category in expense_categories[:5]:  # Top 5 categorías
        percentage = (category['avg_amount'] / total_monthly_expense * 100) if total_monthly_expense > 0 else 0
        
        # Identificar categorías con alto potencial de ahorro
        potential_savings = 0
        priority = "low"
        
        if percentage > 30:
            potential_savings = category['avg_amount'] * 0.20  # 20% de reducción
            priority = "high"
        elif percentage > 20:
            potential_savings = category['avg_amount'] * 0.15  # 15% de reducción
            priority = "medium"
        elif percentage > 10:
            potential_savings = category['avg_amount'] * 0.10  # 10% de reducción
            priority = "low"
        
        if potential_savings > 0:
            improvement_areas.append({
                "category": category['category'],
                "current_spending": round(category['avg_amount'], 2),
                "percentage_of_total": round(percentage, 2),
                "potential_savings": round(potential_savings, 2),
                "priority": priority,
                "frequency": category['frequency']
            })
    
    return improvement_areas


def _create_savings_strategies(improvement_areas: list, goal_analysis: dict, monthly_net: float) -> list:
    """Crea estrategias específicas de ahorro."""
    strategies = []
    
    # Estrategia 1: Reducción de gastos por categoría
    if improvement_areas:
        total_potential = sum(area['potential_savings'] for area in improvement_areas)
        strategies.append({
            "name": "Optimización de gastos por categoría",
            "type": "expense_reduction",
            "description": f"Reduciendo gastos en tus principales categorías podrías ahorrar hasta ${total_potential:.2f}/mes adicionales.",
            "impact": round(total_potential, 2),
            "difficulty": "medium",
            "steps": [
                f"Reducir {area['category']} en ${area['potential_savings']:.2f}/mes ({area['percentage_of_total']:.1f}% de tus gastos)"
                for area in improvement_areas[:3]
            ]
        })
    
    # Estrategia 2: Regla 50/30/20
    strategies.append({
        "name": "Regla 50/30/20",
        "type": "budgeting",
        "description": "Distribuye tus ingresos: 50% necesidades, 30% deseos, 20% ahorros/deudas.",
        "impact": None,
        "difficulty": "medium",
        "steps": [
            "Clasifica todos tus gastos en: necesidades, deseos y ahorros",
            "Ajusta tu presupuesto para cumplir con los porcentajes recomendados",
            "Revisa mensualmente y ajusta según sea necesario"
        ]
    })
    
    # Estrategia 3: Automatización de ahorros
    if monthly_net > 0:
        strategies.append({
            "name": "Automatización de ahorros",
            "type": "automation",
            "description": "Configura transferencias automáticas el día que recibes tu ingreso.",
            "impact": round(monthly_net * 0.8, 2),  # 80% de lo que puede ahorrar
            "difficulty": "easy",
            "steps": [
                "Abre una cuenta de ahorros separada",
                f"Configura transferencia automática de ${monthly_net * 0.8:.2f} cada mes",
                "Trata esta cuenta como intocable excepto para tu meta"
            ]
        })
    
    # Estrategia 4: Específica para el tipo de meta
    if goal_analysis['type'] == 'debt_payoff':
        strategies.append({
            "name": "Método avalancha para deudas",
            "type": "debt_strategy",
            "description": "Paga primero las deudas con mayor tasa de interés para minimizar el costo total.",
            "impact": None,
            "difficulty": "medium",
            "steps": [
                "Lista todas tus deudas ordenadas por tasa de interés",
                "Paga el mínimo en todas excepto la de mayor interés",
                "Destina todo el dinero extra a la deuda con mayor interés",
                "Una vez pagada, pasa a la siguiente"
            ]
        })
    
    return strategies


def _calculate_months_to_goal(goal_analysis: dict, monthly_net: float, current_balance: float) -> int:
    """Calcula cuántos meses tomará alcanzar la meta."""
    if not goal_analysis.get('target_amount') or monthly_net <= 0:
        return None
    
    remaining = goal_analysis['target_amount'] - current_balance
    if remaining <= 0:
        return 0
    
    return int(remaining / monthly_net) + 1


def _generate_alerts(metrics: dict, monthly_net: float, projections: list) -> list:
    """Genera alertas basadas en las métricas."""
    alerts = []
    
    if metrics['savings_rate'] < 0:
        alerts.append({
            "type": "danger",
            "message": "Estás gastando más de lo que ganas. Acción inmediata requerida."
        })
    elif metrics['savings_rate'] < 10:
        alerts.append({
            "type": "warning",
            "message": "Tu tasa de ahorro es muy baja. Considera reducir gastos no esenciales."
        })
    
    if metrics['emergency_fund_months'] < 1:
        alerts.append({
            "type": "danger",
            "message": "No tienes fondo de emergencia. Estás en riesgo ante imprevistos."
        })
    elif metrics['emergency_fund_months'] < 3:
        alerts.append({
            "type": "warning",
            "message": "Tu fondo de emergencia es insuficiente. Objetivo: 3-6 meses de gastos."
        })
    
    # Verificar si el balance se vuelve negativo en las proyecciones
    negative_months = [p for p in projections if p['balance'] < 0]
    if negative_months:
        first_negative = negative_months[0]
        alerts.append({
            "type": "danger",
            "message": f"Tu balance será negativo en el mes {first_negative['month']} ({first_negative['date']}) si no cambias tu situación actual."
        })
    
    return alerts

