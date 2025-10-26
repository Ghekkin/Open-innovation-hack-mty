from database import get_db_connection
from utils import setup_logger
import logging
from datetime import datetime
from dateutil.relativedelta import relativedelta
import pandas as pd

logger = setup_logger('planning_tools', logging.INFO)

def goal_based_plan_tool(
    entity_type: str = "personal",
    entity_id: str = None,
    goal_amount: float = None,
    deadline: str = None,
    min_monthly_contrib: float = 0
) -> dict:
    """
    Crea un plan de ahorro para alcanzar una meta financiera.
    """
    try:
        deadline_date = datetime.strptime(deadline, "%Y-%m-%d")
        months_to_deadline = (deadline_date.year - datetime.now().year) * 12 + deadline_date.month - datetime.now().month
        
        if months_to_deadline <= 0:
            return {"success": False, "message": "La fecha límite debe ser en el futuro."}
            
        db = get_db_connection()
        table = "transacciones_personales" if entity_type == "personal" else "transacciones"
        id_column = "usuario_id" if entity_type == "personal" else "empresa_id"
        
        query = f"SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) FROM {table} WHERE {id_column} = %s"
        current_balance = db.execute_query(query, (entity_id,), fetch='one')[0] or 0
        
        remaining_amount = goal_amount - float(current_balance)
        
        if remaining_amount <= 0:
            return {"success": True, "message": "¡Felicidades! Ya has alcanzado tu meta."}
            
        required_monthly_savings = remaining_amount / months_to_deadline
        
        plan = {
            "goal_amount": goal_amount,
            "deadline": deadline,
            "current_balance": float(current_balance),
            "amount_to_save": remaining_amount,
            "months_to_go": months_to_deadline,
            "required_monthly_savings": required_monthly_savings
        }
        
        if required_monthly_savings < min_monthly_contrib:
            plan["message"] = f"Puedes alcanzar tu meta ahorrando solo {required_monthly_savings:.2f} al mes, que es menos que tu mínimo de {min_monthly_contrib:.2f}."
        else:
            plan["suggested_actions"] = f"Para alcanzar tu meta, necesitarás ahorrar {required_monthly_savings:.2f} al mes. Revisa tus gastos en categorías no esenciales para encontrar áreas de recorte."

        return {"success": True, "plan": plan}
    except Exception as e:
        logger.error(f"Error en goal_based_plan_tool: {e}")
        return {"success": False, "error": str(e)}

def budget_allocator_tool(
    entity_type: str = "personal",
    entity_id: str = None,
    monthly_cap: float = None,
    prioridades: list = []
) -> dict:
    """
    Asigna un presupuesto mensual por categoría.
    """
    try:
        db = get_db_connection()
        table = "transacciones_personales" if entity_type == "personal" else "transacciones"
        id_column = "usuario_id" if entity_type == "personal" else "empresa_id"

        query = f"""
            SELECT categoria, AVG(monthly_total) as avg_spent
            FROM (
                SELECT DATE_TRUNC('month', fecha) as month, categoria, SUM(monto) as monthly_total
                FROM {table}
                WHERE tipo = 'gasto' AND {id_column} = %s AND fecha >= NOW() - INTERVAL '3 months'
                GROUP BY month, categoria
            ) as monthly_expenses
            GROUP BY categoria
        """
        
        historical_spending = db.execute_query(query, (entity_id,), fetch='all')
        if not historical_spending:
            return {"success": False, "message": "No hay suficientes datos históricos para asignar un presupuesto."}

        df = pd.DataFrame(historical_spending, columns=['category', 'avg_spent'])
        df['avg_spent'] = df['avg_spent'].astype(float)

        df['weight'] = df['avg_spent']
        for priority in prioridades:
            if priority in df['category'].values:
                df.loc[df['category'] == priority, 'weight'] *= 1.10

        total_weight = df['weight'].sum()
        df['allocated_budget'] = (df['weight'] / total_weight) * monthly_cap
        
        budget = df[['category', 'allocated_budget']].to_dict('records')
        budget = [{"category": b['category'], "allocated_budget": round(b['allocated_budget'], 2)} for b in budget]

        return {
            "success": True,
            "total_budget": monthly_cap,
            "priorities": prioridades,
            "recommended_budget_allocation": budget
        }
    except Exception as e:
        logger.error(f"Error en budget_allocator_tool: {e}")
        return {"success": False, "error": str(e)}


def debt_paydown_optimizer_tool(
    entity_type: str = "personal",
    entity_id: str = None,
    debts: list = [],
    metodo: str = "avalancha",
    extra_mensual: float = 0
) -> dict:
    """
    Optimiza el plan de pago de deudas.
    """
    try:
        if not debts:
            return {"success": False, "error": "La lista de deudas no puede estar vacía."}

        for debt in debts:
            debt['monthly_rate'] = (debt['apr'] / 100) / 12

        if metodo == 'avalancha':
            debts.sort(key=lambda x: x['apr'], reverse=True)
        elif metodo == 'bola_nieve':
            debts.sort(key=lambda x: x['balance'])
        
        total_min_payment = sum(d['min_payment'] for d in debts)
        total_monthly_payment = total_min_payment + extra_mensual
        
        schedule = []
        month = 0
        total_interest_paid = 0
        
        sim_debts = [d.copy() for d in debts]

        while any(d['balance'] > 0 for d in sim_debts):
            month += 1
            if month > 360:
                raise Exception("El plan de pago excede los 30 años.")

            monthly_interest = 0
            payment_this_month = total_monthly_payment
            
            for debt in sim_debts:
                if debt['balance'] > 0:
                    interest = debt['balance'] * debt['monthly_rate']
                    debt['balance'] += interest
                    monthly_interest += interest
                    total_interest_paid += interest

            paid_off_this_month_min_payments = 0
            for debt in sim_debts:
                if debt['balance'] > 0:
                    payment = min(debt['balance'], debt['min_payment'])
                    debt['balance'] -= payment
                    payment_this_month -= payment
                    if debt['balance'] <= 0:
                         paid_off_this_month_min_payments += debt['min_payment']

            snowball_payment = payment_this_month + paid_off_this_month_min_payments
            
            sorted_sim_debts = sorted([d for d in sim_debts if d['balance'] > 0], key=lambda x: x['apr' if metodo == 'avalancha' else 'balance'], reverse=(metodo == 'avalancha'))

            for debt in sorted_sim_debts:
                 if debt['balance'] > 0 and snowball_payment > 0:
                    payment = min(debt['balance'], snowball_payment)
                    debt['balance'] -= payment
                    snowball_payment -= payment

            schedule.append({
                "month": month,
                "total_balance": round(sum(d['balance'] for d in sim_debts if d['balance'] > 0), 2),
                "interest_paid_this_month": round(monthly_interest, 2)
            })

        original_total_balance = sum(d['balance'] for d in debts)

        return {
            "success": True,
            "method": metodo,
            "months_to_freedom": month,
            "total_paid": round(original_total_balance + total_interest_paid, 2),
            "total_interest_paid": round(total_interest_paid, 2),
            "payment_schedule_summary": schedule[::3]
        }
    except Exception as e:
        logger.error(f"Error en debt_paydown_optimizer_tool: {e}")
        return {"success": False, "error": str(e)}
