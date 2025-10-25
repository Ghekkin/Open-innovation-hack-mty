"""Descriptive analysis tools for MCP server."""
import logging
from typing import Any, Dict, Optional
from datetime import datetime
from database import FinancialDataQueries
from utils import validators

logger = logging.getLogger(__name__)


def list_transactions_tool(
    entity_type: str = 'company',
    entity_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    try:
        validators.validate_entity_type(entity_type)
        start_dt = validators.parse_date(start_date) if start_date else None
        end_dt = validators.parse_date(end_date) if end_date else None
        limit, offset = validators.validate_pagination(limit, offset, max_limit=200)
        if type and type not in ('ingreso', 'gasto'):
            return {'success': False, 'error': 'invalid_type', 'message': 'type debe ser "ingreso" o "gasto"'}

        q = FinancialDataQueries()
        page = q.list_transactions(
            entity_type=entity_type,
            entity_id=entity_id,
            start_date=start_dt,
            end_date=end_dt,
            category=category,
            min_amount=min_amount,
            max_amount=max_amount,
            txn_type=type,
            limit=limit,
            offset=offset,
        )
        return {
            'success': True,
            'data': {
                'items': page['items'],
                'total': page['total'],
                'page_info': {'limit': limit, 'offset': offset},
            },
            'message': 'Transacciones listadas exitosamente',
        }
    except Exception as e:
        logger.error(f"Error in list_transactions_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al listar transacciones'}


def top_categories_tool(
    entity_type: str = 'company',
    entity_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    direction: str = 'gasto',
    top_n: int = 5,
) -> Dict[str, Any]:
    try:
        validators.validate_entity_type(entity_type)
        if direction not in ('gasto', 'ingreso'):
            return {'success': False, 'error': 'invalid_direction', 'message': 'direction debe ser "gasto" o "ingreso"'}
        start_dt = validators.parse_date(start_date) if start_date else None
        end_dt = validators.parse_date(end_date) if end_date else None
        if top_n < 1 or top_n > 50:
            top_n = 5
        q = FinancialDataQueries()
        cats = q.get_top_categories(entity_type, entity_id, start_dt, end_dt, direction, top_n)
        total = sum(c['total'] for c in cats) or 1
        for c in cats:
            c['porcentaje'] = round(c['total'] / total * 100, 2)
        return {
            'success': True,
            'data': {'categorias': cats, 'direction': direction, 'top_n': top_n},
            'message': 'Top de categorías obtenido',
        }
    except Exception as e:
        logger.error(f"Error in top_categories_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al obtener top de categorías'}


def monthly_summary_tool(
    entity_type: str = 'company',
    entity_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    try:
        validators.validate_entity_type(entity_type)
        if month and (month < 1 or month > 12):
            return {'success': False, 'error': 'invalid_month', 'message': 'El mes debe estar entre 1 y 12'}
        start_dt = validators.parse_date(start_date) if start_date else None
        end_dt = validators.parse_date(end_date) if end_date else None
        q = FinancialDataQueries()
        res = q.get_monthly_summary(entity_type, entity_id, month, year, start_dt, end_dt)
        return {
            'success': True,
            'data': res,
            'message': 'Resumen mensual calculado',
        }
    except Exception as e:
        logger.error(f"Error in monthly_summary_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al calcular resumen mensual'}