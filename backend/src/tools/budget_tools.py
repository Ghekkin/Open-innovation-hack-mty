"""Budget analysis tools for MCP server."""
import logging
from typing import Any, Dict, Optional
from datetime import datetime
from database import FinancialDataQueries

logger = logging.getLogger(__name__)


def get_budget_comparison_tool(
    company_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> Dict[str, Any]:
    """
    Compare budgeted amounts vs actual spending.
    
    This tool compares planned budgets with actual expenses
    to identify variances and areas of concern.
    
    Args:
        company_id: Optional company ID to filter results
        month: Month to analyze (1-12, default: current month)
        year: Year to analyze (default: current year)
    
    Returns:
        Dictionary with budget vs actual comparison
    """
    try:
        if month and (month < 1 or month > 12):
            return {
                'success': False,
                'error': 'Invalid month parameter',
                'message': 'El mes debe estar entre 1 y 12'
            }
        
        if not month:
            month = datetime.now().month
        if not year:
            year = datetime.now().year
        
        queries = FinancialDataQueries()
        comparison = queries.compare_budget_vs_actual(
            company_id=company_id,
            month=month,
            year=year
        )
        
        # Calculate total actual spending
        total_actual = sum(cat['gasto_real'] for cat in comparison.get('categorias', []))
        
        return {
            'success': True,
            'data': {
                **comparison,
                'total_gasto_real': round(total_actual, 2),
                'analisis': {
                    'mes_nombre': datetime(year, month, 1).strftime('%B'),
                    'numero_categorias': len(comparison.get('categorias', []))
                }
            },
            'message': f'Comparación de presupuesto obtenida para {month}/{year}'
        }
        
    except Exception as e:
        logger.error(f"Error in get_budget_comparison_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al comparar presupuesto vs gastos reales'
        }

