"""Expense analysis tools for MCP server."""
from database import get_db_connection
from utils import setup_logger
import logging
from datetime import datetime
from dateutil.relativedelta import relativedelta

logger = setup_logger('expense_tools', logging.INFO)

def get_expenses_by_category_tool(company_id: str = None, start_date: str = None, end_date: str = None) -> dict:
    """
    Analiza los gastos de una empresa agrupados por categoría para un período de tiempo.
    Si no se especifican fechas, se utiliza el mes actual por defecto.
    """
    try:
        db = get_db_connection()
        
        params = []
        
        if not start_date or not end_date:
            today = datetime.now()
            start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0).strftime("%Y-%m-%d")
            end_date = (today.replace(day=1) + relativedelta(months=1) - relativedelta(days=1)).strftime("%Y-%m-%d")

        query = """
            SELECT categoria, SUM(monto), COUNT(*)
            FROM transacciones
            WHERE tipo = 'gasto'
        """
        params.extend([start_date, end_date])
        
        if company_id:
            query += " AND empresa_id = %s"
            params.append(company_id)
            
        query += " GROUP BY categoria ORDER BY SUM(monto) DESC"
        
        expenses_by_cat = db.execute_query(query, tuple(params), fetch='all')
        
        if not expenses_by_cat:
            return {"message": "No hay gastos registrados para el período y empresa especificados."}
            
        total_expenses = sum(e[1] for e in expenses_by_cat)
        
        result = {
            "success": True,
            "period": {
                "start_date": start_date,
                "end_date": end_date
            },
            "total_expenses": float(total_expenses),
            "categories": [
                {
                    "category": cat,
                    "total_spent": float(total),
                    "transaction_count": count,
                    "percentage_of_total": round((float(total) / total_expenses) * 100, 2) if total_expenses > 0 else 0
                } for cat, total, count in expenses_by_cat
            ]
        }
        return result
        
    except Exception as e:
        logger.error(f"Error en get_expenses_by_category_tool: {e}")
        return {"success": False, "error": str(e)}

