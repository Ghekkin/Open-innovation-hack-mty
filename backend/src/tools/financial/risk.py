from database import get_db_connection
from utils import setup_logger
import logging

logger = setup_logger('risk_tools', logging.INFO)

def get_financial_health_score_tool(company_id: str = None, user_id: str = None) -> dict:
    """
    Calcula un score de salud financiera (0-100).
    """
    try:
        db = get_db_connection()
        
        if company_id:
            table = "finanzas_empresa"
            id_col = "empresa_id"
            entity_id = company_id
        elif user_id:
            table = "finanzas_personales"
            id_col = "id_usuario"
            entity_id = user_id
        else: # Global
            table = "finanzas_empresa"
            id_col = None
            entity_id = None

        query = f"""
            SELECT 
                SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END),
                SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END)
            FROM {table}
        """
        params = []
        if entity_id:
            query += f" WHERE {id_col} = %s"
            params.append(entity_id)
            
        total_income, total_expense = db.execute_query(query, tuple(params), fetch='one')
        total_income = float(total_income or 0)
        total_expense = float(total_expense or 0)
        
        balance = total_income - total_expense
        
        score = 50
        if total_income > 0:
            savings_rate = (balance / total_income) * 100
            if savings_rate > 20: score += 25
            elif savings_rate > 10: score += 15
            elif savings_rate > 0: score += 5
            else: score -= 20
        else:
            score -= 10
            
        if balance > 0: score += 25
        else: score -= 30
        
        score = max(0, min(100, int(score)))
        
        level = "Crítica"
        if score > 80: level = "Excelente"
        elif score > 60: level = "Buena"
        elif score > 40: level = "Regular"
        
        return {
            "success": True,
            "financial_health_score": score,
            "level": level,
            "metrics": {
                "total_income": total_income,
                "total_expense": total_expense,
                "net_balance": balance
            },
            "recommendations": "Para mejorar tu score, enfócate en aumentar tus ingresos o reducir gastos no esenciales."
        }
    except Exception as e:
        logger.error(f"Error en get_financial_health_score_tool: {e}")
        return {"success": False, "error": str(e)}

def assess_financial_risk_tool(company_id: str = None) -> dict:
    """
    Evalúa el nivel de riesgo financiero de una empresa.
    """
    try:
        db = get_db_connection()
        
        query = """
            SELECT 
                SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as income,
                SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as expense
            FROM finanzas_empresa
            WHERE fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        """
        params = []
        if company_id:
            query += " AND empresa_id = %s"
            params.append(company_id)
        
        result = db.execute_query(query, tuple(params), fetch='one')
        income = float(result[0] or 0)
        expense = float(result[1] or 0)

        balance_query = "SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) FROM finanzas_empresa"
        balance_params = []
        if company_id:
            balance_query += " WHERE empresa_id = %s"
            balance_params.append(company_id)
        balance = float(db.execute_query(balance_query, tuple(balance_params), fetch='one')[0] or 0)

        risk_score = 0
        risk_factors = []

        if income < expense:
            risk_score += 40
            risk_factors.append({
                "factor": "Burn Rate Negativo",
                "details": f"La empresa está gastando ${expense - income:.2f} más de lo que ingresa en los últimos 6 meses.",
                "severity": "High"
            })

        expense_ratio = (expense / income * 100) if income > 0 else 1000
        if expense_ratio > 90:
            risk_score += 30
            risk_factors.append({
                "factor": "Ratio de Gastos Elevado",
                "details": f"Los gastos representan el {expense_ratio:.2f}% de los ingresos.",
                "severity": "Medium"
            })

        if balance <= 0:
            risk_score += 50
            risk_factors.append({
                "factor": "Balance Negativo",
                "details": f"El balance actual es de ${balance:.2f}.",
                "severity": "Critical"
            })
        elif income > 0 and balance < (income / 6):
             risk_score += 20
             risk_factors.append({
                "factor": "Reservas de Efectivo Bajas",
                "details": f"El balance actual (${balance:.2f}) es menor que un mes de ingresos promedio.",
                "severity": "Medium"
            })

        risk_score = min(100, int(risk_score))
        
        level = "Bajo"
        if risk_score > 70: level = "Crítico"
        elif risk_score > 40: level = "Alto"
        elif risk_score > 20: level = "Moderado"

        return {
            "success": True,
            "risk_score": risk_score,
            "risk_level": level,
            "risk_factors": risk_factors
        }
    except Exception as e:
        logger.error(f"Error en assess_financial_risk_tool: {e}")
        return {"success": False, "error": str(e)}


def get_alerts_tool(company_id: str = None, severity: str = None) -> dict:
    """
    Obtiene alertas financieras activas.
    """
    try:
        db = get_db_connection()
        alerts = []

        balance_query = "SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) FROM finanzas_empresa"
        params = []
        if company_id:
            balance_query += " WHERE empresa_id = %s"
            params.append(company_id)
        balance = float(db.execute_query(balance_query, tuple(params), fetch='one')[0] or 0)
        
        if balance < 0:
            alerts.append({
                "severity": "critical",
                "title": "Balance General Negativo",
                "message": f"El balance actual de la cuenta es de ${balance:.2f}. Se requiere acción inmediata."
            })

        budget_comp_query = """
            WITH real_expenses AS (
                SELECT categoria, SUM(monto) as actual
                FROM finanzas_empresa
                WHERE tipo = 'gasto' AND MONTH(fecha) = MONTH(NOW()) AND YEAR(fecha) = YEAR(NOW())
                GROUP BY categoria
            ), budgeted_expenses AS (
                SELECT categoria, monto_presupuestado as budgeted
                FROM presupuestos
                WHERE MONTH(mes) = MONTH(NOW()) AND YEAR(mes) = YEAR(NOW())
            )
            SELECT b.categoria, r.actual, b.budgeted
            FROM budgeted_expenses b JOIN real_expenses r ON b.categoria = r.categoria
            WHERE r.actual > b.budgeted * 1.20
        """
        over_budget_cats = db.execute_query(budget_comp_query, fetch='all')
        for cat, actual, budgeted in over_budget_cats:
            over_pct = (actual / budgeted - 1) * 100
            alerts.append({
                "severity": "medium",
                "title": "Presupuesto Excedido",
                "message": f"La categoría '{cat}' ha superado el presupuesto en un {over_pct:.0f}% este mes (Gastado: ${actual:.2f}, Presupuestado: ${budgeted:.2f})."
            })

        if severity:
            alerts = [a for a in alerts if a['severity'] == severity]

        return {
            "success": True,
            "active_alerts": alerts
        }
    except Exception as e:
        logger.error(f"Error en get_alerts_tool: {e}")
        return {"success": False, "error": str(e)}


def get_stress_test_tool(company_id: str = None, income_reduction: float = 30.0, expense_increase: float = 20.0) -> dict:
    """
    Realiza una prueba de estrés financiero.
    """
    try:
        db = get_db_connection()
        
        balance_query = "SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) FROM finanzas_empresa"
        params = []
        if company_id:
            balance_query += " WHERE empresa_id = %s"
            params.append(company_id)
        current_balance = float(db.execute_query(balance_query, tuple(params), fetch='one')[0] or 0)

        # Calcular promedios mensuales de los últimos 6 meses
        if company_id:
            income_query = """
                SELECT AVG(monthly_total) FROM (
                    SELECT SUM(monto) as monthly_total 
                    FROM finanzas_empresa 
                    WHERE tipo = 'ingreso' AND empresa_id = %s 
                    AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                    GROUP BY YEAR(fecha), MONTH(fecha)
                ) as monthly_incomes
            """
            expense_query = """
                SELECT AVG(monthly_total) FROM (
                    SELECT SUM(monto) as monthly_total 
                    FROM finanzas_empresa 
                    WHERE tipo = 'gasto' AND empresa_id = %s 
                    AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                    GROUP BY YEAR(fecha), MONTH(fecha)
                ) as monthly_expenses
            """
            avg_income = float(db.execute_query(income_query, (company_id,), fetch='one')[0] or 0)
            avg_expense = float(db.execute_query(expense_query, (company_id,), fetch='one')[0] or 0)
        else:
            income_query = """
                SELECT AVG(monthly_total) FROM (
                    SELECT SUM(monto) as monthly_total 
                    FROM finanzas_empresa 
                    WHERE tipo = 'ingreso'
                    AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                    GROUP BY YEAR(fecha), MONTH(fecha)
                ) as monthly_incomes
            """
            expense_query = """
                SELECT AVG(monthly_total) FROM (
                    SELECT SUM(monto) as monthly_total 
                    FROM finanzas_empresa 
                    WHERE tipo = 'gasto'
                    AND fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                    GROUP BY YEAR(fecha), MONTH(fecha)
                ) as monthly_expenses
            """
            avg_income = float(db.execute_query(income_query, fetch='one')[0] or 0)
            avg_expense = float(db.execute_query(expense_query, fetch='one')[0] or 0)

        stressed_income = float(avg_income) * (1 - income_reduction / 100)
        stressed_expense = float(avg_expense) * (1 + expense_increase / 100)
        stressed_net_flow = stressed_income - stressed_expense

        if stressed_net_flow >= 0:
            return {
                "success": True,
                "resilience": "Alta",
                "message": "La empresa sobrevive al escenario de estrés y mantiene un flujo de caja positivo.",
                "stressed_monthly_net_flow": stressed_net_flow
            }

        months_to_zero = -current_balance / stressed_net_flow if stressed_net_flow < 0 else float('inf')
        
        resilience = "Baja"
        if months_to_zero > 6: resilience = "Moderada"
        if months_to_zero > 12: resilience = "Alta"

        return {
            "success": True,
            "resilience": resilience,
            "initial_balance": current_balance,
            "stressed_monthly_income": stressed_income,
            "stressed_monthly_expense": stressed_expense,
            "stressed_monthly_net_flow": stressed_net_flow,
            "estimated_survival_months": round(months_to_zero, 1) if months_to_zero != float('inf') else "Indefinido"
        }
    except Exception as e:
        logger.error(f"Error en get_stress_test_tool: {e}")
        return {"success": False, "error": str(e)}