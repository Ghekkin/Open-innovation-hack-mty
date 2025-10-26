"""Advanced analytics tools for MCP server."""
import logging
from typing import Any, Dict, Optional, List
from datetime import datetime, timedelta
from database import FinancialDataQueries

logger = logging.getLogger(__name__)


def get_financial_health_score_tool(
    company_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculate a comprehensive financial health score.
    
    This tool analyzes multiple financial metrics to provide
    an overall health score and detailed breakdown.
    
    Args:
        company_id: Optional company ID to analyze
        user_id: Optional user ID for personal finances
    
    Returns:
        Dictionary with health score and metrics
    """
    try:
        queries = FinancialDataQueries()
        
        # Get balance
        # Si user_id empieza con 'E', es una empresa
        if user_id and user_id.startswith('E'):
            balance_data = queries.get_company_balance(user_id)
        elif company_id:
            balance_data = queries.get_company_balance(company_id)
        elif user_id:
            balance_data = queries.get_personal_balance(user_id)
        else:
            balance_data = queries.get_company_balance()
        
        ingresos = balance_data.get('ingresos', 0)
        gastos = balance_data.get('gastos', 0)
        balance = balance_data.get('balance', 0)
        
        # Calculate metrics
        metrics = {}
        
        # 1. Savings Rate (higher is better)
        if ingresos > 0:
            savings_rate = ((ingresos - gastos) / ingresos) * 100
            metrics['tasa_ahorro'] = round(savings_rate, 2)
        else:
            savings_rate = 0
            metrics['tasa_ahorro'] = 0
        
        # 2. Expense Ratio (lower is better)
        if ingresos > 0:
            expense_ratio = (gastos / ingresos) * 100
            metrics['ratio_gastos'] = round(expense_ratio, 2)
        else:
            expense_ratio = 100
            metrics['ratio_gastos'] = 100
        
        # 3. Balance Health (positive is better)
        if balance > 0:
            balance_score = min(100, (balance / (gastos if gastos > 0 else 1)) * 10)
        else:
            balance_score = 0
        metrics['score_balance'] = round(balance_score, 2)
        
        # Calculate overall health score (0-100)
        health_score = (
            (min(savings_rate, 50) / 50 * 40) +  # 40% weight on savings rate
            ((100 - min(expense_ratio, 100)) / 100 * 30) +  # 30% weight on expense ratio
            (balance_score * 0.3)  # 30% weight on balance
        )
        
        # Determine health level
        if health_score >= 80:
            health_level = 'excelente'
            color = 'green'
        elif health_score >= 60:
            health_level = 'bueno'
            color = 'blue'
        elif health_score >= 40:
            health_level = 'regular'
            color = 'yellow'
        else:
            health_level = 'preocupante'
            color = 'red'
        
        # Generate recommendations
        recommendations = []
        if savings_rate < 20:
            recommendations.append({
                'tipo': 'ahorro',
                'prioridad': 'alta',
                'mensaje': 'Tu tasa de ahorro está por debajo del 20%. Intenta reducir gastos no esenciales.'
            })
        
        if expense_ratio > 80:
            recommendations.append({
                'tipo': 'gastos',
                'prioridad': 'alta',
                'mensaje': 'Tus gastos representan más del 80% de tus ingresos. Revisa tus gastos fijos.'
            })
        
        if balance < gastos * 3:
            recommendations.append({
                'tipo': 'reserva',
                'prioridad': 'media',
                'mensaje': 'Se recomienda tener un fondo de emergencia de al menos 3 meses de gastos.'
            })
        
        return {
            'success': True,
            'data': {
                'score_salud_financiera': round(health_score, 2),
                'nivel': health_level,
                'color': color,
                'metricas': metrics,
                'datos_base': {
                    'ingresos_totales': round(ingresos, 2),
                    'gastos_totales': round(gastos, 2),
                    'balance_actual': round(balance, 2)
                },
                'recomendaciones': recommendations
            },
            'message': f'Score de salud financiera calculado: {round(health_score, 2)}/100 ({health_level})'
        }
        
    except Exception as e:
        logger.error(f"Error in get_financial_health_score_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al calcular el score de salud financiera'
        }


def get_spending_trends_tool(
    company_id: Optional[str] = None,
    months_back: int = 6
) -> Dict[str, Any]:
    """
    Analyze spending trends over time.
    
    This tool identifies patterns, trends, and anomalies in spending
    behavior over the specified time period.
    
    Args:
        company_id: Optional company ID to analyze
        months_back: Number of months to analyze (default: 6)
    
    Returns:
        Dictionary with spending trends and insights
    """
    try:
        if months_back < 1 or months_back > 24:
            return {
                'success': False,
                'error': 'Invalid months_back parameter',
                'message': 'El número de meses debe estar entre 1 y 24'
            }
        
        queries = FinancialDataQueries()
        trends = queries.get_monthly_trends(company_id, months_back)
        
        # Analyze trends
        if len(trends) >= 2:
            # Calculate average growth rate
            total_change = 0
            for i in range(1, len(trends)):
                prev_expenses = trends[i-1].get('gastos', 0)
                curr_expenses = trends[i].get('gastos', 0)
                if prev_expenses > 0:
                    change = ((curr_expenses - prev_expenses) / prev_expenses) * 100
                    total_change += change
            
            avg_growth_rate = total_change / (len(trends) - 1) if len(trends) > 1 else 0
            
            # Identify highest and lowest spending months
            highest_month = max(trends, key=lambda x: x.get('gastos', 0))
            lowest_month = min(trends, key=lambda x: x.get('gastos', 0))
            
            insights = {
                'tendencia_promedio': round(avg_growth_rate, 2),
                'mes_mayor_gasto': {
                    'mes': highest_month.get('mes'),
                    'año': highest_month.get('año'),
                    'monto': round(highest_month.get('gastos', 0), 2)
                },
                'mes_menor_gasto': {
                    'mes': lowest_month.get('mes'),
                    'año': lowest_month.get('año'),
                    'monto': round(lowest_month.get('gastos', 0), 2)
                }
            }
        else:
            insights = {
                'tendencia_promedio': 0,
                'mensaje': 'Datos insuficientes para análisis de tendencias'
            }
        
        return {
            'success': True,
            'data': {
                'tendencias_mensuales': trends,
                'analisis': insights,
                'periodo_analizado': f'{months_back} meses'
            },
            'message': f'Análisis de tendencias completado para {months_back} meses'
        }
        
    except Exception as e:
        logger.error(f"Error in get_spending_trends_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al analizar tendencias de gasto'
        }


def get_category_recommendations_tool(
    company_id: Optional[str] = None,
    top_n: int = 5
) -> Dict[str, Any]:
    """
    Get personalized recommendations for expense optimization.
    
    This tool analyzes spending patterns and provides specific
    recommendations for reducing expenses in key categories.
    
    Args:
        company_id: Optional company ID to analyze
        top_n: Number of top categories to analyze (default: 5)
    
    Returns:
        Dictionary with recommendations by category
    """
    try:
        queries = FinancialDataQueries()
        expenses = queries.get_expenses_by_category(company_id)
        
        # Sort by total spending
        expenses.sort(key=lambda x: x.get('total', 0), reverse=True)
        top_expenses = expenses[:top_n]
        
        total_expenses = sum(e.get('total', 0) for e in expenses)
        
        recommendations = []
        for expense in top_expenses:
            category = expense.get('categoria', 'Sin categoría')
            total = expense.get('total', 0)
            percentage = (total / total_expenses * 100) if total_expenses > 0 else 0
            
            recommendation = {
                'categoria': category,
                'gasto_actual': round(total, 2),
                'porcentaje_total': round(percentage, 2),
                'sugerencias': []
            }
            
            # Generate category-specific recommendations
            if percentage > 30:
                recommendation['sugerencias'].append({
                    'tipo': 'alerta',
                    'mensaje': f'{category} representa más del 30% de tus gastos totales. Considera opciones más económicas.'
                })
            
            if category.lower() in ['nómina', 'nomina', 'salarios']:
                if percentage > 50:
                    recommendation['sugerencias'].append({
                        'tipo': 'optimización',
                        'mensaje': 'Los costos de nómina son altos. Evalúa la productividad y considera automatización.'
                    })
            
            elif category.lower() in ['marketing', 'publicidad']:
                recommendation['sugerencias'].append({
                    'tipo': 'optimización',
                    'mensaje': 'Analiza el ROI de tus campañas. Enfócate en canales con mejor rendimiento.'
                })
            
            elif category.lower() in ['servicios', 'suscripciones']:
                recommendation['sugerencias'].append({
                    'tipo': 'revisión',
                    'mensaje': 'Revisa suscripciones y servicios no utilizados. Cancela los innecesarios.'
                })
            
            elif category.lower() in ['suministros', 'materiales']:
                recommendation['sugerencias'].append({
                    'tipo': 'negociación',
                    'mensaje': 'Negocia con proveedores o busca alternativas más económicas.'
                })
            
            # Add general savings potential
            potential_savings = total * 0.15  # Assume 15% potential savings
            recommendation['ahorro_potencial'] = round(potential_savings, 2)
            
            recommendations.append(recommendation)
        
        total_potential_savings = sum(r['ahorro_potencial'] for r in recommendations)
        
        return {
            'success': True,
            'data': {
                'recomendaciones_por_categoria': recommendations,
                'resumen': {
                    'categorias_analizadas': len(recommendations),
                    'ahorro_potencial_total': round(total_potential_savings, 2),
                    'porcentaje_ahorro': round((total_potential_savings / total_expenses * 100), 2) if total_expenses > 0 else 0
                }
            },
            'message': f'Recomendaciones generadas para {len(recommendations)} categorías principales'
        }
        
    except Exception as e:
        logger.error(f"Error in get_category_recommendations_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al generar recomendaciones por categoría'
        }


def detect_anomalies_tool(
    company_id: Optional[str] = None,
    threshold: float = 2.0
) -> Dict[str, Any]:
    """
    Detect unusual transactions or spending patterns.
    
    This tool identifies transactions that deviate significantly
    from normal spending patterns.
    
    Args:
        company_id: Optional company ID to analyze
        threshold: Standard deviation threshold for anomaly detection (default: 2.0)
    
    Returns:
        Dictionary with detected anomalies
    """
    try:
        queries = FinancialDataQueries()
        anomalies = queries.detect_spending_anomalies(company_id, threshold)
        
        # Categorize anomalies by severity
        high_severity = [a for a in anomalies if a.get('desviacion', 0) > threshold * 1.5]
        medium_severity = [a for a in anomalies if threshold <= a.get('desviacion', 0) <= threshold * 1.5]
        
        return {
            'success': True,
            'data': {
                'anomalias_detectadas': len(anomalies),
                'anomalias': anomalies,
                'por_severidad': {
                    'alta': len(high_severity),
                    'media': len(medium_severity)
                },
                'recomendacion': 'Revisa las transacciones inusuales para verificar su legitimidad.'
            },
            'message': f'{len(anomalies)} anomalías detectadas en los patrones de gasto'
        }
        
    except Exception as e:
        logger.error(f"Error in detect_anomalies_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al detectar anomalías en los gastos'
        }


def compare_periods_tool(
    company_id: Optional[str] = None,
    period1_start: Optional[str] = None,
    period1_end: Optional[str] = None,
    period2_start: Optional[str] = None,
    period2_end: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compare financial metrics between two time periods.
    
    This tool allows comparing income, expenses, and balance
    between two different time periods.
    
    Args:
        company_id: Optional company ID to analyze
        period1_start: Start date of first period (YYYY-MM-DD)
        period1_end: End date of first period (YYYY-MM-DD)
        period2_start: Start date of second period (YYYY-MM-DD)
        period2_end: End date of second period (YYYY-MM-DD)
    
    Returns:
        Dictionary with period comparison
    """
    try:
        queries = FinancialDataQueries()
        
        # Parse dates
        p1_start = datetime.strptime(period1_start, '%Y-%m-%d') if period1_start else None
        p1_end = datetime.strptime(period1_end, '%Y-%m-%d') if period1_end else None
        p2_start = datetime.strptime(period2_start, '%Y-%m-%d') if period2_start else None
        p2_end = datetime.strptime(period2_end, '%Y-%m-%d') if period2_end else None
        
        # Get data for both periods
        period1_data = queries.get_period_summary(company_id, p1_start, p1_end)
        period2_data = queries.get_period_summary(company_id, p2_start, p2_end)
        
        # Calculate changes
        income_change = period2_data.get('ingresos', 0) - period1_data.get('ingresos', 0)
        expense_change = period2_data.get('gastos', 0) - period1_data.get('gastos', 0)
        balance_change = period2_data.get('balance', 0) - period1_data.get('balance', 0)
        
        # Calculate percentage changes
        income_pct = (income_change / period1_data.get('ingresos', 1)) * 100 if period1_data.get('ingresos', 0) > 0 else 0
        expense_pct = (expense_change / period1_data.get('gastos', 1)) * 100 if period1_data.get('gastos', 0) > 0 else 0
        
        return {
            'success': True,
            'data': {
                'periodo_1': {
                    'fechas': f'{period1_start} a {period1_end}',
                    **period1_data
                },
                'periodo_2': {
                    'fechas': f'{period2_start} a {period2_end}',
                    **period2_data
                },
                'cambios': {
                    'ingresos': {
                        'absoluto': round(income_change, 2),
                        'porcentual': round(income_pct, 2)
                    },
                    'gastos': {
                        'absoluto': round(expense_change, 2),
                        'porcentual': round(expense_pct, 2)
                    },
                    'balance': {
                        'absoluto': round(balance_change, 2)
                    }
                }
            },
            'message': 'Comparación de períodos completada'
        }
        
    except ValueError as e:
        logger.error(f"Date parsing error: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Formato de fecha inválido. Use YYYY-MM-DD'
        }
    except Exception as e:
        logger.error(f"Error in compare_periods_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al comparar períodos'
        }

