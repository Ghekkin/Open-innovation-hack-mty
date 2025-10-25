"""Risk assessment and alert tools for MCP server."""
import logging
from typing import Any, Dict, Optional, List
from datetime import datetime, timedelta
from database import FinancialDataQueries

logger = logging.getLogger(__name__)


def assess_financial_risk_tool(
    company_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Assess overall financial risk level.
    
    This tool evaluates multiple risk factors to provide
    a comprehensive risk assessment.
    
    Args:
        company_id: Optional company ID to analyze
    
    Returns:
        Dictionary with risk assessment and factors
    """
    try:
        queries = FinancialDataQueries()
        balance_data = queries.get_company_balance(company_id)
        
        ingresos = balance_data.get('ingresos', 0)
        gastos = balance_data.get('gastos', 0)
        balance = balance_data.get('balance', 0)
        
        risk_factors = []
        risk_score = 0  # 0-100, higher is riskier
        
        # Factor 1: Negative balance
        if balance < 0:
            risk_factors.append({
                'factor': 'Balance negativo',
                'severidad': 'crítica',
                'impacto': 30,
                'descripcion': 'La empresa está operando con pérdidas.'
            })
            risk_score += 30
        
        # Factor 2: High expense ratio
        if ingresos > 0:
            expense_ratio = (gastos / ingresos) * 100
            if expense_ratio > 90:
                risk_factors.append({
                    'factor': 'Ratio de gastos alto',
                    'severidad': 'alta',
                    'impacto': 25,
                    'descripcion': f'Los gastos representan el {round(expense_ratio, 1)}% de los ingresos.'
                })
                risk_score += 25
            elif expense_ratio > 80:
                risk_factors.append({
                    'factor': 'Ratio de gastos elevado',
                    'severidad': 'media',
                    'impacto': 15,
                    'descripcion': f'Los gastos representan el {round(expense_ratio, 1)}% de los ingresos.'
                })
                risk_score += 15
        
        # Factor 3: Low cash reserves
        months_of_runway = (balance / gastos) if gastos > 0 else 0
        if months_of_runway < 3:
            risk_factors.append({
                'factor': 'Reservas bajas',
                'severidad': 'alta',
                'impacto': 20,
                'descripcion': f'Solo hay reservas para {round(months_of_runway, 1)} meses de operación.'
            })
            risk_score += 20
        elif months_of_runway < 6:
            risk_factors.append({
                'factor': 'Reservas limitadas',
                'severidad': 'media',
                'impacto': 10,
                'descripcion': f'Las reservas cubren {round(months_of_runway, 1)} meses de operación.'
            })
            risk_score += 10
        
        # Factor 4: Income dependency
        if ingresos == 0:
            risk_factors.append({
                'factor': 'Sin ingresos',
                'severidad': 'crítica',
                'impacto': 35,
                'descripcion': 'No se registran ingresos en el período analizado.'
            })
            risk_score += 35
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = 'crítico'
            color = 'red'
            recommendation = 'Se requiere acción inmediata para estabilizar las finanzas.'
        elif risk_score >= 40:
            risk_level = 'alto'
            color = 'orange'
            recommendation = 'Se recomienda implementar medidas correctivas pronto.'
        elif risk_score >= 20:
            risk_level = 'medio'
            color = 'yellow'
            recommendation = 'Monitorear de cerca y considerar optimizaciones.'
        else:
            risk_level = 'bajo'
            color = 'green'
            recommendation = 'Situación financiera estable. Mantener buenas prácticas.'
        
        return {
            'success': True,
            'data': {
                'nivel_riesgo': risk_level,
                'score_riesgo': min(risk_score, 100),
                'color': color,
                'factores_riesgo': risk_factors,
                'numero_factores': len(risk_factors),
                'recomendacion_general': recommendation,
                'metricas_clave': {
                    'balance_actual': round(balance, 2),
                    'meses_reserva': round(months_of_runway, 1),
                    'ratio_gastos': round((gastos / ingresos * 100) if ingresos > 0 else 100, 1)
                }
            },
            'message': f'Evaluación de riesgo completada: Nivel {risk_level}'
        }
        
    except Exception as e:
        logger.error(f"Error in assess_financial_risk_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al evaluar el riesgo financiero'
        }


def get_alerts_tool(
    company_id: Optional[str] = None,
    severity: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get financial alerts and warnings.
    
    This tool identifies current financial alerts that require
    attention, such as unusual spending, low balance, etc.
    
    Args:
        company_id: Optional company ID to analyze
        severity: Filter by severity ('low', 'medium', 'high', 'critical')
    
    Returns:
        Dictionary with active alerts
    """
    try:
        queries = FinancialDataQueries()
        balance_data = queries.get_company_balance(company_id)
        
        ingresos = balance_data.get('ingresos', 0)
        gastos = balance_data.get('gastos', 0)
        balance = balance_data.get('balance', 0)
        
        alerts = []
        
        # Alert 1: Negative balance
        if balance < 0:
            alerts.append({
                'id': 'alert_001',
                'tipo': 'balance_negativo',
                'severidad': 'crítica',
                'titulo': 'Balance Negativo',
                'mensaje': f'El balance actual es negativo: ${round(balance, 2)}',
                'accion_recomendada': 'Revisar gastos urgentemente y buscar fuentes de ingreso adicionales.',
                'fecha_deteccion': datetime.now().isoformat()
            })
        
        # Alert 2: Low balance warning
        elif balance < gastos * 0.5:
            alerts.append({
                'id': 'alert_002',
                'tipo': 'balance_bajo',
                'severidad': 'alta',
                'titulo': 'Balance Bajo',
                'mensaje': f'El balance actual (${round(balance, 2)}) es menor a la mitad de los gastos mensuales.',
                'accion_recomendada': 'Considerar reducir gastos no esenciales.',
                'fecha_deteccion': datetime.now().isoformat()
            })
        
        # Alert 3: High expense ratio
        if ingresos > 0:
            expense_ratio = (gastos / ingresos) * 100
            if expense_ratio > 95:
                alerts.append({
                    'id': 'alert_003',
                    'tipo': 'gastos_excesivos',
                    'severidad': 'crítica',
                    'titulo': 'Gastos Excesivos',
                    'mensaje': f'Los gastos representan el {round(expense_ratio, 1)}% de los ingresos.',
                    'accion_recomendada': 'Implementar plan de reducción de gastos inmediatamente.',
                    'fecha_deteccion': datetime.now().isoformat()
                })
            elif expense_ratio > 85:
                alerts.append({
                    'id': 'alert_004',
                    'tipo': 'gastos_altos',
                    'severidad': 'alta',
                    'titulo': 'Gastos Elevados',
                    'mensaje': f'Los gastos representan el {round(expense_ratio, 1)}% de los ingresos.',
                    'accion_recomendada': 'Revisar y optimizar categorías de gasto principales.',
                    'fecha_deteccion': datetime.now().isoformat()
                })
        
        # Alert 4: No income
        if ingresos == 0:
            alerts.append({
                'id': 'alert_005',
                'tipo': 'sin_ingresos',
                'severidad': 'crítica',
                'titulo': 'Sin Ingresos Registrados',
                'mensaje': 'No se han registrado ingresos en el período analizado.',
                'accion_recomendada': 'Verificar fuentes de ingreso y actualizar registros.',
                'fecha_deteccion': datetime.now().isoformat()
            })
        
        # Alert 5: Low savings rate
        if ingresos > 0:
            savings_rate = ((ingresos - gastos) / ingresos) * 100
            if 0 < savings_rate < 10:
                alerts.append({
                    'id': 'alert_006',
                    'tipo': 'ahorro_bajo',
                    'severidad': 'media',
                    'titulo': 'Tasa de Ahorro Baja',
                    'mensaje': f'La tasa de ahorro es solo del {round(savings_rate, 1)}%.',
                    'accion_recomendada': 'Establecer meta de ahorro del 20% de ingresos.',
                    'fecha_deteccion': datetime.now().isoformat()
                })
        
        # Filter by severity if specified
        if severity:
            severity_map = {
                'low': 'baja',
                'medium': 'media',
                'high': 'alta',
                'critical': 'crítica'
            }
            filter_severity = severity_map.get(severity.lower(), severity)
            alerts = [a for a in alerts if a['severidad'] == filter_severity]
        
        # Count by severity
        severity_counts = {
            'crítica': len([a for a in alerts if a['severidad'] == 'crítica']),
            'alta': len([a for a in alerts if a['severidad'] == 'alta']),
            'media': len([a for a in alerts if a['severidad'] == 'media']),
            'baja': len([a for a in alerts if a['severidad'] == 'baja'])
        }
        
        return {
            'success': True,
            'data': {
                'alertas_activas': len(alerts),
                'alertas': alerts,
                'por_severidad': severity_counts,
                'requiere_atencion_inmediata': severity_counts['crítica'] > 0
            },
            'message': f'{len(alerts)} alertas activas detectadas'
        }
        
    except Exception as e:
        logger.error(f"Error in get_alerts_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener alertas financieras'
        }


def predict_cash_shortage_tool(
    company_id: Optional[str] = None,
    months_ahead: int = 6
) -> Dict[str, Any]:
    """
    Predict potential cash shortages in the future.
    
    This tool analyzes current trends to predict if and when
    the company might face cash flow problems.
    
    Args:
        company_id: Optional company ID to analyze
        months_ahead: Number of months to predict (default: 6)
    
    Returns:
        Dictionary with cash shortage predictions
    """
    try:
        queries = FinancialDataQueries()
        
        # Get current balance
        balance_data = queries.get_company_balance(company_id)
        current_balance = balance_data.get('balance', 0)
        
        # Get cash flow projection
        projection_data = queries.get_cash_flow_projection(company_id, months_ahead)
        
        avg_monthly_income = projection_data.get('ingreso_promedio_mensual', 0)
        avg_monthly_expense = projection_data.get('gasto_promedio_mensual', 0)
        monthly_net = avg_monthly_income - avg_monthly_expense
        
        predictions = []
        running_balance = current_balance
        shortage_predicted = False
        shortage_month = None
        
        for month in range(1, months_ahead + 1):
            running_balance += monthly_net
            
            prediction = {
                'mes': month,
                'balance_proyectado': round(running_balance, 2),
                'estado': 'saludable' if running_balance > avg_monthly_expense else 'crítico'
            }
            
            if running_balance < 0 and not shortage_predicted:
                shortage_predicted = True
                shortage_month = month
                prediction['alerta'] = 'Se proyecta escasez de efectivo en este mes'
            
            predictions.append(prediction)
        
        # Generate recommendations
        recommendations = []
        if shortage_predicted:
            recommendations.append({
                'tipo': 'urgente',
                'mensaje': f'Se proyecta escasez de efectivo en {shortage_month} meses. Acción inmediata requerida.'
            })
            recommendations.append({
                'tipo': 'acción',
                'mensaje': 'Opciones: 1) Reducir gastos, 2) Aumentar ingresos, 3) Buscar financiamiento.'
            })
        elif running_balance < avg_monthly_expense * 3:
            recommendations.append({
                'tipo': 'precaución',
                'mensaje': 'Las reservas proyectadas son bajas. Considere aumentar el ahorro.'
            })
        else:
            recommendations.append({
                'tipo': 'positivo',
                'mensaje': 'No se proyectan problemas de flujo de efectivo en el período analizado.'
            })
        
        return {
            'success': True,
            'data': {
                'escasez_proyectada': shortage_predicted,
                'mes_escasez': shortage_month,
                'balance_actual': round(current_balance, 2),
                'balance_final_proyectado': round(running_balance, 2),
                'flujo_mensual_neto': round(monthly_net, 2),
                'proyecciones_mensuales': predictions,
                'recomendaciones': recommendations
            },
            'message': f'Predicción de flujo de efectivo completada para {months_ahead} meses'
        }
        
    except Exception as e:
        logger.error(f"Error in predict_cash_shortage_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al predecir escasez de efectivo'
        }


def get_stress_test_tool(
    company_id: Optional[str] = None,
    income_reduction: float = 30.0,
    expense_increase: float = 20.0
) -> Dict[str, Any]:
    """
    Perform a financial stress test.
    
    This tool simulates worst-case scenarios to assess
    financial resilience.
    
    Args:
        company_id: Optional company ID to analyze
        income_reduction: Percentage reduction in income (default: 30%)
        expense_increase: Percentage increase in expenses (default: 20%)
    
    Returns:
        Dictionary with stress test results
    """
    try:
        queries = FinancialDataQueries()
        balance_data = queries.get_company_balance(company_id)
        
        current_balance = balance_data.get('balance', 0)
        current_income = balance_data.get('ingresos', 0)
        current_expenses = balance_data.get('gastos', 0)
        
        # Calculate stressed scenarios
        stressed_income = current_income * (1 - income_reduction / 100)
        stressed_expenses = current_expenses * (1 + expense_increase / 100)
        stressed_monthly_net = (stressed_income - stressed_expenses) / 12  # Assuming annual figures
        
        # Project 6 months under stress
        months_to_test = 6
        projections = []
        running_balance = current_balance
        
        for month in range(1, months_to_test + 1):
            running_balance += stressed_monthly_net
            projections.append({
                'mes': month,
                'balance': round(running_balance, 2),
                'viable': running_balance > 0
            })
        
        # Determine survival time
        survival_months = months_to_test
        for i, proj in enumerate(projections):
            if not proj['viable']:
                survival_months = i
                break
        
        # Calculate resilience score
        if survival_months >= 6:
            resilience_score = 100
            resilience_level = 'excelente'
        elif survival_months >= 4:
            resilience_score = 75
            resilience_level = 'bueno'
        elif survival_months >= 2:
            resilience_score = 50
            resilience_level = 'regular'
        else:
            resilience_score = 25
            resilience_level = 'bajo'
        
        return {
            'success': True,
            'data': {
                'escenario_estres': {
                    'reduccion_ingresos': f'{income_reduction}%',
                    'aumento_gastos': f'{expense_increase}%'
                },
                'resultados': {
                    'meses_supervivencia': survival_months,
                    'score_resiliencia': resilience_score,
                    'nivel_resiliencia': resilience_level,
                    'balance_final': round(projections[-1]['balance'], 2) if projections else 0
                },
                'proyecciones': projections,
                'recomendacion': (
                    'Excelente resiliencia financiera.' if resilience_score >= 75
                    else 'Considere aumentar reservas de emergencia.' if resilience_score >= 50
                    else 'Situación vulnerable. Priorice construcción de reservas.'
                )
            },
            'message': f'Prueba de estrés completada: {resilience_level} resiliencia'
        }
        
    except Exception as e:
        logger.error(f"Error in get_stress_test_tool: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al realizar prueba de estrés financiero'
        }

