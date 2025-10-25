"""Financial projection tools for MCP server."""
import logging
from typing import Any, Dict, Optional
from database import FinancialDataQueries

logger = logging.getLogger(__name__)


def get_cash_flow_projection_tool(
    company_id: Optional[str] = None,
    months: int = 3
) -> Dict[str, Any]:
    """
    Project future cash flow based on historical data.
    
    This tool analyzes historical income and expense patterns
    to project future cash flow for the specified number of months.
    
    Args:
        company_id: Optional company ID to filter results
        months: Number of months to project (default: 3)
    
    Returns:
        Dictionary with cash flow projections
    """
    try:
        if months < 1 or months > 24:
            return {
                'success': False,
                'error': 'Invalid months parameter',
                'message': 'El número de meses debe estar entre 1 y 24'
            }
        
        queries = FinancialDataQueries()
        projection = queries.get_cash_flow_projection(
            company_id=company_id,
            months=months
        )
        
        # Add recommendations based on projection
        recommendations = []
        balance = projection.get('balance_mensual_proyectado', 0)
        
        if balance < 0:
            recommendations.append({
                'tipo': 'alerta',
                'mensaje': 'Balance mensual negativo proyectado. Considere reducir gastos o aumentar ingresos.'
            })
        elif balance < 10000:
            recommendations.append({
                'tipo': 'advertencia',
                'mensaje': 'Balance mensual bajo. Considere optimizar gastos operativos.'
            })
        else:
            recommendations.append({
                'tipo': 'positivo',
                'mensaje': 'Flujo de caja saludable proyectado.'
            })
        
        return {
            'success': True,
            'data': {
                **projection,
                'recomendaciones': recommendations
            },
            'message': f'Proyección de flujo de caja generada para {months} meses'
        }
        
    except Exception as e:
        logger.error(f"Error in get_cash_flow_projection_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al generar la proyección de flujo de caja'
        }


def simulate_scenario_tool(
    current_balance: float,
    monthly_income_change: float = 0,
    monthly_expense_change: float = 0,
    months: int = 6
) -> Dict[str, Any]:
    """
    Simulate a "what-if" financial scenario.
    
    This tool allows users to simulate changes in income or expenses
    and see the projected impact on their balance.
    
    Args:
        current_balance: Current balance to start simulation
        monthly_income_change: Change in monthly income (can be negative)
        monthly_expense_change: Change in monthly expenses (can be negative)
        months: Number of months to simulate
    
    Returns:
        Dictionary with scenario simulation results
    """
    try:
        monthly_projections = []
        running_balance = current_balance
        
        for month in range(1, months + 1):
            running_balance += (monthly_income_change - monthly_expense_change)
            monthly_projections.append({
                'mes': month,
                'balance': round(running_balance, 2),
                'cambio_acumulado': round(running_balance - current_balance, 2)
            })
        
        final_balance = running_balance
        total_change = final_balance - current_balance
        
        return {
            'success': True,
            'data': {
                'balance_inicial': current_balance,
                'balance_final': round(final_balance, 2),
                'cambio_total': round(total_change, 2),
                'cambio_porcentual': round((total_change / current_balance * 100), 2) if current_balance != 0 else 0,
                'proyecciones_mensuales': monthly_projections,
                'parametros': {
                    'cambio_ingreso_mensual': monthly_income_change,
                    'cambio_gasto_mensual': monthly_expense_change,
                    'meses_simulados': months
                }
            },
            'message': f'Escenario simulado para {months} meses'
        }
        
    except Exception as e:
        logger.error(f"Error in simulate_scenario_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al simular el escenario financiero'
        }

