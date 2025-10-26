from database import get_db_connection
from utils import setup_logger
import logging
from datetime import datetime
from dateutil.relativedelta import relativedelta

logger = setup_logger('descriptive_tools', logging.INFO)

def list_transactions_tool(
    entity_type: str = "company",
    entity_id: str = None,
    start_date: str = None,
    end_date: str = None,
    category: str = None,
    min_amount: float = None,
    max_amount: float = None,
    type: str = None,
    limit: int = 50,
    offset: int = 0
) -> dict:
    """
    Lista transacciones con filtros y paginación.
    """
    try:
        db = get_db_connection()
        table = "transacciones" if entity_type == "company" else "transacciones_personales"
        id_column = "empresa_id" if entity_type == "company" else "usuario_id"
        
        query = f"SELECT * FROM {table} WHERE 1=1"
        params = []
        
        if entity_id:
            query += f" AND {id_column} = %s"
            params.append(entity_id)
        if start_date:
            query += " AND fecha >= %s"
            params.append(start_date)
        if end_date:
            query += " AND fecha <= %s"
            params.append(end_date)
        if category:
            query += " AND categoria = %s"
            params.append(category)
        if min_amount is not None:
            query += " AND monto >= %s"
            params.append(min_amount)
        if max_amount is not None:
            query += " AND monto <= %s"
            params.append(max_amount)
        if type:
            query += " AND tipo = %s"
            params.append(type)
        
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        total_count_result = db.execute_query(count_query, tuple(params), fetch='one')
        total_count = total_count_result[0] if total_count_result else 0

        query += " ORDER BY fecha DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        transactions_data = db.execute_query(query, tuple(params), fetch='all')
        
        # Assuming the table columns are known and serializable
        # You might need to convert datetime objects to strings
        transactions = []
        if transactions_data:
            columns = [desc[0] for desc in db.cursor.description]
            for row in transactions_data:
                row_dict = dict(zip(columns, row))
                for key, value in row_dict.items():
                    if isinstance(value, datetime):
                        row_dict[key] = value.isoformat()
                transactions.append(row_dict)

        return {
            "success": True,
            "total_records": total_count,
            "limit": limit,
            "offset": offset,
            "transactions": transactions
        }
    except Exception as e:
        logger.error(f"Error en list_transactions_tool: {e}")
        return {"success": False, "error": str(e)}

def top_categories_tool(
    entity_type: str = "company",
    entity_id: str = None,
    start_date: str = None,
    end_date: str = None,
    direction: str = "gasto",
    top_n: int = 5
) -> dict:
    """
    Obtiene las N categorías principales por gasto o ingreso.
    """
    try:
        db = get_db_connection()
        table = "transacciones" if entity_type == "company" else "transacciones_personales"
        id_column = "empresa_id" if entity_type == "company" else "usuario_id"
        
        query = f"""
            SELECT categoria, SUM(monto) as total 
            FROM {table} 
            WHERE tipo = %s
        """
        params = [direction]
        
        if entity_id:
            query += f" AND {id_column} = %s"
            params.append(entity_id)
        if start_date:
            query += " AND fecha >= %s"
            params.append(start_date)
        if end_date:
            query += " AND fecha <= %s"
            params.append(end_date)
            
        query += " GROUP BY categoria ORDER BY total DESC LIMIT %s"
        params.append(top_n)
        
        top_cats = db.execute_query(query, tuple(params), fetch='all')
        
        total_query = f"SELECT SUM(monto) FROM {table} WHERE tipo = %s"
        total_params = [direction]
        if entity_id:
            total_query += f" AND {id_column} = %s"
            total_params.append(entity_id)
        
        total_sum_result = db.execute_query(total_query, tuple(total_params), fetch='one')
        total_sum = total_sum_result[0] or 1
        
        result = [
            {
                "category": cat,
                "total": float(total),
                "percentage": round((float(total) / float(total_sum)) * 100, 2)
            } for cat, total in top_cats
        ]
        
        return {"success": True, "top_categories": result}
    except Exception as e:
        logger.error(f"Error en top_categories_tool: {e}")
        return {"success": False, "error": str(e)}

def monthly_summary_tool(
    entity_type: str = "company",
    entity_id: str = None,
    month: int = None,
    year: int = None,
    start_date: str = None,
    end_date: str = None
) -> dict:
    """
    Proporciona un resumen mensual de ingresos, gastos y balance.
    """
    try:
        db = get_db_connection()
        table = "transacciones" if entity_type == "company" else "transacciones_personales"
        id_column = "empresa_id" if entity_type == "company" else "usuario_id"

        if not start_date:
            target_date = datetime(year, month, 1) if month and year else datetime.now()
            current_period_start = target_date.replace(day=1)
            current_period_end = (current_period_start + relativedelta(months=1)) - relativedelta(days=1)
            prev_period_start = current_period_start - relativedelta(months=1)
            prev_period_end = (prev_period_start + relativedelta(months=1)) - relativedelta(days=1)
        else:
            current_period_start = datetime.strptime(start_date, "%Y-%m-%d")
            current_period_end = datetime.strptime(end_date, "%Y-%m-%d")
            period_days = (current_period_end - current_period_start).days
            prev_period_end = current_period_start - relativedelta(days=1)
            prev_period_start = prev_period_end - relativedelta(days=period_days)

        def get_summary(start, end):
            query = f"""
                SELECT 
                    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) as income,
                    COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) as expense
                FROM {table}
                WHERE fecha BETWEEN %s AND %s
            """
            params = [start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")]
            if entity_id:
                query += f" AND {id_column} = %s"
                params.append(entity_id)
            
            income, expense = db.execute_query(query, tuple(params), fetch='one')
            return {
                "income": float(income),
                "expense": float(expense),
                "net_flow": float(income) - float(expense)
            }

        current_summary = get_summary(current_period_start, current_period_end)
        prev_summary = get_summary(prev_period_start, prev_period_end)

        def calculate_variation(current, previous):
            if previous == 0:
                return 'inf' if current > 0 else 0.0
            return round((current - previous) / previous * 100, 2)

        variation = {
            "income_pct_change": calculate_variation(current_summary['income'], prev_summary['income']),
            "expense_pct_change": calculate_variation(current_summary['expense'], prev_summary['expense']),
        }

        return {
            "success": True,
            "current_period": {
                "start_date": current_period_start.strftime("%Y-%m-%d"),
                "end_date": current_period_end.strftime("%Y-%m-%d"),
                **current_summary
            },
            "previous_period": {
                "start_date": prev_period_start.strftime("%Y-%m-%d"),
                "end_date": prev_period_end.strftime("%Y-%m-%d"),
                **prev_summary
            },
            "variation_vs_previous_period": variation
        }
    except Exception as e:
        logger.error(f"Error en monthly_summary_tool: {e}")
        return {"success": False, "error": str(e)}
