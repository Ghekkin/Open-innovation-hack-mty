"""Expense analysis tools for MCP server."""
import logging
from typing import Any, Dict, Optional
from datetime import datetime
from database import FinancialDataQueries

logger = logging.getLogger(__name__)


def get_expenses_by_category_tool(
    company_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze expenses grouped by category.
    
    This tool provides a breakdown of expenses by category,
    showing total amounts and transaction counts.
    
    Args:
        company_id: Optional company ID to filter results
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    
    Returns:
        Dictionary with expense breakdown by category
    """
    try:
        queries = FinancialDataQueries()
        
        # Parse dates if provided
        start_dt = datetime.strptime(start_date, '%Y-%m-%d') if start_date else None
        end_dt = datetime.strptime(end_date, '%Y-%m-%d') if end_date else None
        
        expenses = queries.get_expenses_by_category(
            company_id=company_id,
            start_date=start_dt,
            end_date=end_dt
        )
        
        # Calculate total
        total_expenses = sum(e['total'] for e in expenses)
        
        # Add percentage to each category
        for expense in expenses:
            expense['porcentaje'] = round((expense['total'] / total_expenses * 100), 2) if total_expenses > 0 else 0
        
        return {
            'success': True,
            'data': {
                'categorias': expenses,
                'total_gastos': round(total_expenses, 2),
                'numero_categorias': len(expenses),
                'periodo': {
                    'inicio': start_date,
                    'fin': end_date
                }
            },
            'message': 'Análisis de gastos por categoría obtenido exitosamente'
        }
        
    except ValueError as e:
        logger.error(f"Date parsing error: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Formato de fecha inválido. Use YYYY-MM-DD'
        }
    except Exception as e:
        logger.error(f"Error in get_expenses_by_category_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al analizar gastos por categoría'
        }

