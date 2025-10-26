"""Expense analysis tools for MCP server."""
from database import get_db_connection
from utils import setup_logger
import logging
from datetime import datetime
from dateutil.relativedelta import relativedelta

logger = setup_logger('expense_tools', logging.INFO)

def get_expenses_by_category_tool(company_id: str = None, user_id: str = None, start_date: str = None, end_date: str = None) -> dict:
    """
    Analiza los gastos agrupados por categoría para un período de tiempo.
    Funciona tanto para empresas como para usuarios personales.
    Si no se especifican fechas, se utiliza el mes actual por defecto.
    """
    try:
        db = get_db_connection()
        
        params = []
        
        if not start_date or not end_date:
            today = datetime.now()
            start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0).strftime("%Y-%m-%d")
            end_date = (today.replace(day=1) + relativedelta(months=1) - relativedelta(days=1)).strftime("%Y-%m-%d")

        is_personal = user_id is not None
        table_name = "finanzas_personales" if is_personal else "finanzas_empresa"
        id_column = "id_usuario" if is_personal else "empresa_id"
        entity_id = user_id if is_personal else company_id
        
        logger.info(f"Consultando gastos para {'usuario' if is_personal else 'empresa'}={entity_id}, período: {start_date} a {end_date}")

        query = f"""
            SELECT categoria, SUM(monto) as total, COUNT(*) as cantidad
            FROM {table_name}
            WHERE tipo = 'gasto'
            AND categoria != 'Ahorro'
            AND fecha >= %s
            AND fecha <= %s
        """
        params.extend([start_date, end_date])
        
        if entity_id:
            query += f" AND {id_column} = %s"
            params.append(entity_id)
            
        query += " GROUP BY categoria ORDER BY SUM(monto) DESC"
        
        logger.info(f"Query: {query}")
        logger.info(f"Params: {params}")
        
        expenses_by_cat = db.execute_query(query, tuple(params), fetch=True)
        
        logger.info(f"Resultados obtenidos: {len(expenses_by_cat) if expenses_by_cat else 0} categorías")
        
        if not expenses_by_cat:
            return {
                "success": True,
                "data": {
                    "categorias": [],
                    "total_gastos": 0,
                    "periodo": {
                        "inicio": start_date,
                        "fin": end_date
                    }
                },
                "message": "No hay gastos registrados para el período y empresa especificados."
            }
            
        total_expenses = sum(float(e['total']) for e in expenses_by_cat)
        
        categorias = [
            {
                "categoria": e['categoria'],
                "total": float(e['total']),
                "transacciones": int(e['cantidad']),
                "porcentaje": round((float(e['total']) / total_expenses) * 100, 2) if total_expenses > 0 else 0
            } for e in expenses_by_cat
        ]
        
        result = {
            "success": True,
            "data": {
                "categorias": categorias,
                "total_gastos": float(total_expenses),
                "periodo": {
                    "inicio": start_date,
                    "fin": end_date
                }
            },
            "message": f"Análisis de gastos obtenido exitosamente para {len(categorias)} categorías"
        }
        return result
        
    except Exception as e:
        logger.error(f"Error en get_expenses_by_category_tool: {e}")
        return {"success": False, "error": str(e)}

