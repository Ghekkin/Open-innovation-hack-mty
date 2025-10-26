# src/tools/financial/shortcuts.py
from datetime import datetime
from dateutil.relativedelta import relativedelta
from database import get_db_connection
from utils import setup_logger
import logging

logger = setup_logger('financial_shortcuts', logging.INFO)

def get_current_month_spending_summary(entity_type: str = "personal", entity_id: str = None) -> dict:
    """
    Obtiene el total de gastos para el mes actual. No requiere fechas.
    Es un atajo para la pregunta "¿Cuánto he gastado este mes?".
    """
    try:
        db = get_db_connection()
        table = "transacciones_personales" if entity_type == "personal" else "transacciones"
        id_column = "usuario_id" if entity_type == "personal" else "empresa_id"

        today = datetime.now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_of_month = (start_of_month + relativedelta(months=1)) - relativedelta(seconds=1)

        query = f"""
            SELECT SUM(monto) as total_gastado, COUNT(*) as numero_transacciones
            FROM {table}
            WHERE tipo = 'gasto' AND categoria != 'Ahorro' AND fecha BETWEEN %s AND %s
        """
        params = [start_of_month, end_of_month]

        if entity_id:
            query += f" AND {id_column} = %s"
            params.append(entity_id)

        result = db.execute_query(query, tuple(params), fetch='one')
        total_spent = result[0] or 0
        num_transactions = result[1] or 0

        return {
            "success": True,
            "period": {
                "start_date": start_of_month.strftime("%Y-%m-%d"),
                "end_date": end_of_month.strftime("%Y-%m-%d")
            },
            "total_spent": float(total_spent),
            "transaction_count": num_transactions,
            "summary": f"Hasta la fecha este mes, has gastado {total_spent:,.2f} en {num_transactions} transacciones."
        }

    except Exception as e:
        logger.error(f"Error en get_current_month_spending_summary: {e}")
        return {"success": False, "error": str(e)}
