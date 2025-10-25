"""Predictive analysis tools for MCP server."""
import logging
from typing import Any, Dict, Optional, List
from database import FinancialDataQueries
from utils import validators

logger = logging.getLogger(__name__)


def cash_runway_tool(
    entity_type: str = 'company',
    entity_id: Optional[str] = None,
    current_cash: Optional[float] = None,
    burn_method: str = 'avg_3m',
) -> Dict[str, Any]:
    try:
        validators.validate_entity_type(entity_type)
        q = FinancialDataQueries()
        avg_exp, avg_inc = q.get_recent_burn_rate(entity_type, entity_id, months=3)
        monthly_burn = max(avg_exp - avg_inc, 0)
        if current_cash is None:
            # Fallback: usa balance positivo como caja aproximada (limitación de esquema)
            bal = q.get_company_balance(entity_id) if entity_type == 'company' else q.get_personal_balance(entity_id)
            current_cash = max(float(bal.get('balance', 0)), 0)
        months_runway = (current_cash / monthly_burn) if monthly_burn > 0 else float('inf')
        return {
            'success': True,
            'data': {
                'cash_actual': round(current_cash or 0, 2),
                'burn_mensual_estimado': round(monthly_burn, 2),
                'meses_runway': round(months_runway, 1) if months_runway != float('inf') else None,
                'ilimitado_si_sin_burn': monthly_burn == 0,
                'metodo': burn_method,
            },
            'message': 'Runway de caja estimado',
        }
    except Exception as e:
        logger.error(f"Error in cash_runway_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al estimar runway de caja'}


def forecast_expenses_by_category_tool(
    entity_type: str = 'company',
    entity_id: Optional[str] = None,
    category: str = '',
    months_ahead: int = 6,
    method: str = 'sma',  # 'sma' | 'ema'
) -> Dict[str, Any]:
    try:
        validators.validate_entity_type(entity_type)
        if not category:
            return {'success': False, 'error': 'missing_category', 'message': 'Debe especificar category'}
        if months_ahead < 1 or months_ahead > 12:
            months_ahead = 6
        q = FinancialDataQueries()
        history = q.get_monthly_totals_by_category(entity_type, entity_id, category, months_back=12)
        series = [h['total'] for h in history] or [0]
        forecasts: List[float] = []
        if method == 'ema':
            alpha = 2 / (min(len(series), 6) + 1)
            ema = series[0]
            for v in series[1:]:
                ema = alpha * v + (1 - alpha) * ema
            for _ in range(months_ahead):
                forecasts.append(round(ema, 2))
        else:  # sma
            window = min(3, len(series))
            sma = sum(series[-window:]) / window if window else 0
            forecasts = [round(sma, 2) for _ in range(months_ahead)]
        return {
            'success': True,
            'data': {
                'categoria': category,
                'historico': history,
                'pronostico_mensual': [
                    {'mes_ahead': i + 1, 'monto': forecasts[i]} for i in range(months_ahead)
                ],
                'metodo': method,
            },
            'message': 'Pronóstico de gastos por categoría generado',
        }
    except Exception as e:
        logger.error(f"Error in forecast_expenses_by_category_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al pronosticar gastos por categoría'}


def bill_forecaster_tool(
    user_id: str,
    months_ahead: int = 3,
) -> Dict[str, Any]:
    try:
        if not user_id:
            return {'success': False, 'error': 'missing_user_id', 'message': 'user_id es requerido'}
        q = FinancialDataQueries()
        rec = q.detect_recurring_payments(user_id=user_id, months_back=12, min_occurrences=3)
        # Proyectar próximas fechas de cobro: aprox. cada mes
        forecasts = []
        for r in rec:
            for i in range(1, months_ahead + 1):
                forecasts.append({
                    'comercio': r['comercio'],
                    'mes_ahead': i,
                    'monto_estimado': r['costo_mensual_estimado'],
                })
        total_est = round(sum(f['monto_estimado'] for f in forecasts), 2)
        return {
            'success': True,
            'data': {
                'suscripciones_detectadas': rec,
                'pronostico_facturas': forecasts,
                'total_estimado_periodo': total_est,
            },
            'message': 'Facturas recurrentes proyectadas',
        }
    except Exception as e:
        logger.error(f"Error in bill_forecaster_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al proyectar facturas recurrentes'}