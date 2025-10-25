"""Planning and optimization tools for MCP server."""
import logging
from typing import Any, Dict, Optional, List
from datetime import datetime
from database import FinancialDataQueries
from utils import validators

logger = logging.getLogger(__name__)


def goal_based_plan_tool(
    entity_type: str = 'personal',
    entity_id: Optional[str] = None,
    goal_amount: float = 0.0,
    deadline: str = '',  # YYYY-MM-DD
    min_monthly_contrib: Optional[float] = None,
) -> Dict[str, Any]:
    try:
        validators.validate_entity_type(entity_type)
        if goal_amount <= 0:
            return {'success': False, 'error': 'invalid_goal', 'message': 'goal_amount debe ser > 0'}
        ddl = validators.parse_date(deadline)
        today = datetime.now().date()
        months = max((ddl.year - today.year) * 12 + (ddl.month - today.month), 1)
        monthly_needed = goal_amount / months
        # Estimar capacidad contribución por ahorro actual
        q = FinancialDataQueries()
        avg_exp, avg_inc = q.get_recent_burn_rate(entity_type, entity_id, months=3)
        current_savings_capacity = max(avg_inc - avg_exp, 0)
        recommended = max(monthly_needed, min_monthly_contrib or 0)
        plan_ok = current_savings_capacity >= recommended
        recortes = []
        if not plan_ok:
            # Sugerir recortes top categorías
            cats = q.get_top_categories(entity_type, entity_id, None, None, 'gasto', 5)
            recortes = [
                {
                    'categoria': c['categoria'],
                    'recorte_sugerido': round(c['total'] * 0.1, 2),
                    'comentario': 'Reducir 10% respecto a gasto promedio reciente',
                }
                for c in cats
            ]
        return {
            'success': True,
            'data': {
                'objetivo_total': goal_amount,
                'deadline_meses': months,
                'aporte_mensual_recomendado': round(recommended, 2),
                'capacidad_ahorro_actual': round(current_savings_capacity, 2),
                'es_factible_sin_recortes': plan_ok,
                'recortes_sugeridos_por_categoria': recortes,
                'hitos': [
                    {'mes': i, 'acumulado': round(recommended * i, 2)} for i in range(1, months + 1)
                ],
            },
            'message': 'Plan basado en objetivos generado',
        }
    except Exception as e:
        logger.error(f"Error in goal_based_plan_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al generar plan por objetivos'}


def budget_allocator_tool(
    entity_type: str = 'personal',
    entity_id: Optional[str] = None,
    monthly_cap: float = 0.0,
    prioridades: Optional[List[str]] = None,
) -> Dict[str, Any]:
    try:
        validators.validate_entity_type(entity_type)
        if monthly_cap <= 0:
            return {'success': False, 'error': 'invalid_cap', 'message': 'monthly_cap debe ser > 0'}
        q = FinancialDataQueries()
        base = q.get_top_categories(entity_type, entity_id, None, None, 'gasto', 10)
        total_hist = sum(c['total'] for c in base) or 1
        prios = set(prioridades or [])
        asignacion = []
        restante = monthly_cap
        for c in base:
            weight = c['total'] / total_hist
            # Prioriza categorías en `prioridades` con +20% de peso efectivo
            adj_weight = weight * (1.2 if c['categoria'] in prios else 1.0)
            asignacion.append({'categoria': c['categoria'], 'peso': adj_weight})
        # normalizar
        weight_sum = sum(a['peso'] for a in asignacion) or 1
        for a in asignacion:
            a['monto'] = round(monthly_cap * a['peso'] / weight_sum, 2)
        return {
            'success': True,
            'data': {
                'cap_mensual': monthly_cap,
                'prioridades': list(prios),
                'asignacion': [{'categoria': a['categoria'], 'monto': a['monto']} for a in asignacion],
            },
            'message': 'Asignación de presupuesto generada',
        }
    except Exception as e:
        logger.error(f"Error in budget_allocator_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al asignar presupuesto'}


def debt_paydown_optimizer_tool(
    entity_type: str = 'personal',
    entity_id: Optional[str] = None,
    debts: Optional[List[Dict[str, float]]] = None,  # [{saldo, tasa, minimo}]
    metodo: str = 'avalancha',  # 'avalancha' | 'bola_nieve'
    extra_mensual: float = 0.0,
) -> Dict[str, Any]:
    try:
        if not debts:
            return {'success': False, 'error': 'missing_debts', 'message': 'Debe proporcionar debts[]'}
        # Orden de pago
        if metodo == 'bola_nieve':
            debts_sorted = sorted(debts, key=lambda d: d['saldo'])
        else:
            debts_sorted = sorted(debts, key=lambda d: d['tasa'], reverse=True)
        # Cronograma simple mes a mes
        schedule = []
        balances = [dict(d) for d in debts_sorted]
        month = 0
        total_interest = 0.0
        while any(d['saldo'] > 0.01 for d in balances) and month < 240:
            month += 1
            pago_extra = extra_mensual
            pagos_mes = []
            for d in balances:
                if d['saldo'] <= 0:
                    pagos_mes.append({'pago': 0.0})
                    continue
                interes = d['saldo'] * (d['tasa'] / 12.0)
                total_interest += interes
                pago = d['minimo'] + interes
                # asignar extra a la primera deuda en el orden
                if pago_extra > 0 and d is balances[0]:
                    extra = min(pago_extra, d['saldo'] - pago)
                    pago += max(extra, 0)
                    pago_extra -= max(extra, 0)
                d['saldo'] = max(d['saldo'] + interes - pago, 0.0)
                pagos_mes.append({'pago': round(pago, 2)})
            schedule.append({'mes': month, 'pagos': pagos_mes, 'saldo_restante_total': round(sum(d['saldo'] for d in balances), 2)})
            # reordenar tras cada mes (para avalancha/bola de nieve)
            if metodo == 'bola_nieve':
                balances.sort(key=lambda d: d['saldo'])
            else:
                balances.sort(key=lambda d: d['tasa'], reverse=True)
        return {
            'success': True,
            'data': {
                'metodo': metodo,
                'meses_hasta_liquidar': month,
                'intereses_estimados': round(total_interest, 2),
                'cronograma_pagos': schedule[:60],  # limitar salida
            },
            'message': 'Plan de pago de deudas optimizado',
        }
    except Exception as e:
        logger.error(f"Error in debt_paydown_optimizer_tool: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': 'Error al optimizar pago de deudas'}