"""Financial data queries for the MCP server."""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .connection import get_db_connection
from typing import Tuple

logger = logging.getLogger(__name__)


class FinancialDataQueries:
    """Handles all financial data queries."""
    
    def __init__(self):
        self.db = get_db_connection()

    def list_transactions(
        self,
        entity_type: str,
        entity_id: str | None,
        start_date: datetime | None,
        end_date: datetime | None,
        category: str | None,
        min_amount: float | None,
        max_amount: float | None,
        txn_type: str | None,  # 'ingreso' | 'gasto'
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Lista transacciones con filtros y paginación.
        Asume tabla `finanzas_empresa(empresa_id, user_id?, fecha, tipo, monto, categoria, descripcion, contraparte)`.
        Si no hay `user_id` en la tabla (solo empresa), `entity_type` personal no aplicará.
        """
        where = []
        params: list[Any] = []
        if entity_type == 'company' and entity_id:
            where.append("empresa_id = %s")
            params.append(entity_id)
        elif entity_type == 'personal' and entity_id:
            # Si tu esquema usa `usuario_id` en otra tabla, ajusta este filtro
            where.append("usuario_id = %s")
            params.append(entity_id)
        if start_date:
            where.append("fecha >= %s")
            params.append(start_date)
        if end_date:
            where.append("fecha <= %s")
            params.append(end_date)
        if category:
            where.append("categoria = %s")
            params.append(category)
        if min_amount is not None:
            where.append("monto >= %s")
            params.append(min_amount)
        if max_amount is not None:
            where.append("monto <= %s")
            params.append(max_amount)
        if txn_type in ('ingreso', 'gasto'):
            where.append("tipo = %s")
            params.append(txn_type)

        base = "FROM finanzas_empresa"
        where_clause = (" WHERE " + " AND ".join(where)) if where else ""

        # Total
        total_q = f"SELECT COUNT(*) AS c {base}{where_clause}"
        total_res = self.db.execute_query(total_q, tuple(params) if params else None)
        total = int(total_res[0]['c']) if total_res else 0

        # Page
        page_q = (
            f"SELECT id, fecha, tipo, monto, categoria, descripcion, contraparte "
            f"{base}{where_clause} "
            f"ORDER BY fecha DESC, id DESC LIMIT %s OFFSET %s"
        )
        page_params = params + [limit, offset]
        rows = self.db.execute_query(page_q, tuple(page_params))

        items = [
            {
                'id': r.get('id'),
                'fecha': r.get('fecha').isoformat() if r.get('fecha') else None,
                'tipo': r.get('tipo'),
                'monto': float(r.get('monto') or 0),
                'categoria': r.get('categoria'),
                'descripcion': r.get('descripcion'),
                'contraparte': r.get('contraparte'),
            }
            for r in rows
        ]
        return {
            'items': items,
            'total': total,
        }

    def get_top_categories(
        self,
        entity_type: str,
        entity_id: str | None,
        start_date: datetime | None,
        end_date: datetime | None,
        direction: str = 'gasto',  # 'gasto' | 'ingreso'
        top_n: int = 5,
    ) -> List[Dict[str, Any]]:
        where = []
        params: list[Any] = []
        where.append("tipo = %s")
        params.append(direction)
        if entity_type == 'company' and entity_id:
            where.append("empresa_id = %s")
            params.append(entity_id)
        elif entity_type == 'personal' and entity_id:
            where.append("usuario_id = %s")
            params.append(entity_id)
        if start_date:
            where.append("fecha >= %s")
            params.append(start_date)
        if end_date:
            where.append("fecha <= %s")
            params.append(end_date)

        q = (
            "SELECT categoria, SUM(monto) AS total, COUNT(*) AS n "
            "FROM finanzas_empresa "
            + (" WHERE " + " AND ".join(where) if where else "")
            + " GROUP BY categoria ORDER BY total DESC LIMIT %s"
        )
        params.append(top_n)
        rows = self.db.execute_query(q, tuple(params))
        return [
            {
                'categoria': r['categoria'],
                'total': float(r['total'] or 0),
                'transacciones': int(r['n'] or 0),
            }
            for r in rows
        ]

    def get_monthly_summary(
        self,
        entity_type: str,
        entity_id: str | None,
        month: int | None,
        year: int | None,
        start_date: datetime | None,
        end_date: datetime | None,
    ) -> Dict[str, Any]:
        """Resumen de ingresos, gastos y balance del periodo, y comparación con periodo previo del mismo tamaño."""
        # Determinar ventana
        if start_date and end_date:
            window_days = (end_date - start_date).days + 1
            prev_start = start_date - timedelta(days=window_days)
            prev_end = start_date - timedelta(days=1)
        else:
            # Si se pasa mes/año, usar el mes calendario
            if not (month and year):
                today = datetime.now()
                month = today.month
                year = today.year
            start_date = datetime(year, month, 1)
            # fin de mes
            if month == 12:
                end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = datetime(year, month + 1, 1) - timedelta(days=1)
            prev_end = start_date - timedelta(days=1)
            prev_start = (start_date - timedelta(days=(end_date - start_date).days + 1))

        def sum_by_type(tipo: str, a: datetime, b: datetime) -> float:
            where = ["tipo = %s"]
            params: list[Any] = [tipo]
            if entity_type == 'company' and entity_id:
                where.append("empresa_id = %s")
                params.append(entity_id)
            elif entity_type == 'personal' and entity_id:
                where.append("usuario_id = %s")
                params.append(entity_id)
            where.append("fecha >= %s")
            where.append("fecha <= %s")
            params.extend([a, b])
            q = (
                "SELECT SUM(monto) AS total FROM finanzas_empresa WHERE "
                + " AND ".join(where)
            )
            res = self.db.execute_query(q, tuple(params))
            return float(res[0]['total'] or 0) if res else 0.0

        ingresos = sum_by_type('ingreso', start_date, end_date)
        gastos = sum_by_type('gasto', start_date, end_date)
        balance = ingresos - gastos

        prev_ingresos = sum_by_type('ingreso', prev_start, prev_end)
        prev_gastos = sum_by_type('gasto', prev_start, prev_end)
        prev_balance = prev_ingresos - prev_gastos

        def var_pct(curr: float, prev: float) -> float:
            return round(((curr - prev) / prev * 100) if prev else (100.0 if curr > 0 else 0.0), 2)

        return {
            'periodo': {
                'inicio': start_date.date().isoformat(),
                'fin': end_date.date().isoformat(),
            },
            'ingresos': round(ingresos, 2),
            'gastos': round(gastos, 2),
            'balance': round(balance, 2),
            'variacion_vs_anterior': {
                'ingresos_pct': var_pct(ingresos, prev_ingresos),
                'gastos_pct': var_pct(gastos, prev_gastos),
                'balance_pct': var_pct(balance, prev_balance),
            },
        }

    def get_recent_burn_rate(
        self,
        entity_type: str,
        entity_id: str | None,
        months: int = 3,
    ) -> Tuple[float, float]:
        """Retorna (avg_monthly_expenses, avg_monthly_income) de últimos N meses."""
        where = []
        params: list[Any] = []
        if entity_type == 'company' and entity_id:
            where.append("empresa_id = %s")
            params.append(entity_id)
        elif entity_type == 'personal' and entity_id:
            where.append("usuario_id = %s")
            params.append(entity_id)
        where_clause = (" WHERE " + " AND ".join(where)) if where else ""
        # Gastos por mes últimos N
        q = (
            "SELECT DATE_FORMAT(fecha, '%Y-%m-01') AS mes, "
            "SUM(CASE WHEN tipo='gasto' THEN monto ELSE 0 END) AS gastos, "
            "SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) AS ingresos "
            "FROM finanzas_empresa"
            f"{where_clause} "
            "GROUP BY mes ORDER BY mes DESC LIMIT %s"
        )
        params2 = params + [months]
        rows = self.db.execute_query(q, tuple(params2))
        if not rows:
            return 0.0, 0.0
        avg_exp = sum(float(r['gastos'] or 0) for r in rows) / len(rows)
        avg_inc = sum(float(r['ingresos'] or 0) for r in rows) / len(rows)
        return avg_exp, avg_inc

    def get_monthly_totals_by_category(
        self,
        entity_type: str,
        entity_id: str | None,
        category: str,
        months_back: int = 12,
    ) -> List[Dict[str, Any]]:
        """Devuelve totales mensuales históricos para una categoría, últimos N meses."""
        where = ["categoria = %s"]
        params: list[Any] = [category]
        if entity_type == 'company' and entity_id:
            where.append("empresa_id = %s")
            params.append(entity_id)
        elif entity_type == 'personal' and entity_id:
            where.append("usuario_id = %s")
            params.append(entity_id)
        q = (
            "SELECT DATE_FORMAT(fecha, '%Y-%m-01') AS mes, SUM(monto) AS total "
            "FROM finanzas_empresa WHERE tipo = 'gasto' AND " + " AND ".join(where) + " "
            "GROUP BY mes ORDER BY mes DESC LIMIT %s"
        )
        params.append(months_back)
        rows = self.db.execute_query(q, tuple(params))
        # Devolver en orden cronológico ascendente
        return [
            {
                'mes': r['mes'],
                'total': float(r['total'] or 0),
            }
            for r in reversed(rows)
        ]

    def detect_recurring_payments(
        self,
        user_id: str,
        months_back: int = 12,
        min_occurrences: int = 3,
    ) -> List[Dict[str, Any]]:
        """Heurística simple de pagos recurrentes por 'contraparte' o 'descripcion'."""
        # Tomar últimos N meses para el usuario personal
        q = (
            "SELECT contraparte, descripcion, DATE_FORMAT(fecha, '%Y-%m') AS ym, "
            "ROUND(AVG(monto), 2) AS avg_monto, COUNT(*) AS n "
            "FROM finanzas_empresa "
            "WHERE usuario_id = %s AND tipo='gasto' "
            "GROUP BY contraparte, descripcion, ym"
        )
        rows = self.db.execute_query(q, (user_id,))
        # Agregar por contraparte/descripcion y contar meses únicos
        from collections import defaultdict
        groups = defaultdict(lambda: {'months': set(), 'sum_monto': 0.0, 'count': 0})
        for r in rows:
            key = r.get('contraparte') or r.get('descripcion') or 'N/A'
            ym = r['ym']
            groups[key]['months'].add(ym)
            groups[key]['sum_monto'] += float(r['avg_monto'] or 0)
            groups[key]['count'] += 1
        result = []
        for key, g in groups.items():
            occ = len(g['months'])
            if occ >= min_occurrences:
                avg_monthly = g['sum_monto'] / occ
                result.append({
                    'comercio': key,
                    'ocurrencias_mensuales': occ,
                    'costo_mensual_estimado': round(avg_monthly, 2),
                })
        # Ordenar por costo
        result.sort(key=lambda x: x['costo_mensual_estimado'], reverse=True)
        return result
    
    def get_company_balance(self, company_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get current balance for a company.
        
        Args:
            company_id: Optional company ID filter
        
        Returns:
            Dictionary with income, expenses, and balance
        """
        try:
            # Usar el nombre real de la tabla según los datos mostrados
            query = """
                SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM finanzas_empresa
            """
            
            params = None
            if company_id:
                query += " WHERE empresa_id = %s"
                params = (company_id,)
            
            result = self.db.execute_query(query, params)
            
            if result:
                return {
                    'ingresos': float(result[0]['total_ingresos'] or 0),
                    'gastos': float(result[0]['total_gastos'] or 0),
                    'balance': float(result[0]['balance'] or 0)
                }
            
            return {'ingresos': 0, 'gastos': 0, 'balance': 0}
            
        except Exception as e:
            logger.error(f"Error getting company balance: {e}")
            raise
    
    def get_expenses_by_category(
        self, 
        company_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get expenses grouped by category.
        
        Args:
            company_id: Optional company ID filter
            start_date: Start date for filtering
            end_date: End date for filtering
        
        Returns:
            List of categories with their total expenses
        """
        try:
            query = """
                SELECT 
                    categoria,
                    SUM(monto) as total,
                    COUNT(*) as cantidad_transacciones
                FROM finanzas_empresa
                WHERE tipo = 'gasto'
            """
            
            conditions = []
            params = []
            
            if company_id:
                conditions.append("empresa_id = %s")
                params.append(company_id)
            
            if start_date:
                conditions.append("fecha >= %s")
                params.append(start_date)
            
            if end_date:
                conditions.append("fecha <= %s")
                params.append(end_date)
            
            if conditions:
                query += " AND " + " AND ".join(conditions)
            
            query += " GROUP BY categoria ORDER BY total DESC"
            
            results = self.db.execute_query(query, tuple(params) if params else None)
            
            return [
                {
                    'categoria': r['categoria'],
                    'total': float(r['total']),
                    'transacciones': r['cantidad_transacciones']
                }
                for r in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting expenses by category: {e}")
            raise
    
    def get_cash_flow_projection(
        self,
        company_id: Optional[str] = None,
        months: int = 3
    ) -> Dict[str, Any]:
        """
        Project future cash flow based on historical data.
        
        Args:
            company_id: Optional company ID filter
            months: Number of months to project
        
        Returns:
            Dictionary with projected income, expenses, and balance
        """
        try:
            # Get last 6 months average
            query = """
                SELECT 
                    AVG(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as avg_ingresos,
                    AVG(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as avg_gastos
                FROM finanzas_empresa
                WHERE fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            """
            
            params = None
            if company_id:
                query += " AND empresa_id = %s"
                params = (company_id,)
            
            query += " GROUP BY MONTH(fecha)"
            
            results = self.db.execute_query(query, params)
            
            if not results:
                return {
                    'proyeccion_meses': months,
                    'ingreso_promedio_mensual': 0,
                    'gasto_promedio_mensual': 0,
                    'balance_proyectado': 0
                }
            
            avg_income = sum(float(r['avg_ingresos'] or 0) for r in results) / len(results)
            avg_expenses = sum(float(r['avg_gastos'] or 0) for r in results) / len(results)
            
            return {
                'proyeccion_meses': months,
                'ingreso_promedio_mensual': round(avg_income, 2),
                'gasto_promedio_mensual': round(avg_expenses, 2),
                'balance_proyectado': round((avg_income - avg_expenses) * months, 2),
                'balance_mensual_proyectado': round(avg_income - avg_expenses, 2)
            }
            
        except Exception as e:
            logger.error(f"Error projecting cash flow: {e}")
            raise
    
    def get_personal_balance(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get current balance for personal finances.
        
        Args:
            user_id: Optional user ID filter
        
        Returns:
            Dictionary with income, expenses, and balance
        """
        try:
            query = """
                SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM finanzas_personales
            """
            
            params = None
            if user_id:
                query += " WHERE id_usuario = %s"
                params = (user_id,)
            
            result = self.db.execute_query(query, params)
            
            if result:
                return {
                    'ingresos': float(result[0]['total_ingresos'] or 0),
                    'gastos': float(result[0]['total_gastos'] or 0),
                    'balance': float(result[0]['balance'] or 0)
                }
            
            return {'ingresos': 0, 'gastos': 0, 'balance': 0}
            
        except Exception as e:
            logger.error(f"Error getting personal balance: {e}")
            raise
    
    def compare_budget_vs_actual(
        self,
        company_id: Optional[str] = None,
        month: Optional[int] = None,
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Compare budgeted amounts vs actual spending.
        
        Args:
            company_id: Optional company ID filter
            month: Month to analyze (default: current month)
            year: Year to analyze (default: current year)
        
        Returns:
            Dictionary with budget comparison
        """
        try:
            if not month:
                month = datetime.now().month
            if not year:
                year = datetime.now().year
            
            # This assumes you have a budget table - adjust as needed
            query = """
                SELECT 
                    categoria,
                    SUM(monto) as gasto_real
                FROM finanzas_empresa
                WHERE tipo = 'gasto'
                    AND MONTH(fecha) = %s
                    AND YEAR(fecha) = %s
            """
            
            params = [month, year]
            
            if company_id:
                query += " AND empresa_id = %s"
                params.append(company_id)
            
            query += " GROUP BY categoria"
            
            results = self.db.execute_query(query, tuple(params))
            
            return {
                'mes': month,
                'año': year,
                'categorias': [
                    {
                        'categoria': r['categoria'],
                        'gasto_real': float(r['gasto_real'])
                    }
                    for r in results
                ]
            }
            
        except Exception as e:
            logger.error(f"Error comparing budget: {e}")
            raise
    
    def get_monthly_trends(
        self,
        company_id: Optional[str] = None,
        months_back: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Get monthly financial trends.
        
        Args:
            company_id: Optional company ID filter
            months_back: Number of months to analyze
        
        Returns:
            List of monthly summaries
        """
        try:
            query = """
                SELECT 
                    YEAR(fecha) as año,
                    MONTH(fecha) as mes,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM finanzas_empresa
                WHERE fecha >= DATE_SUB(NOW(), INTERVAL %s MONTH)
            """
            
            params = [months_back]
            
            if company_id:
                query += " AND empresa_id = %s"
                params.append(company_id)
            
            query += " GROUP BY YEAR(fecha), MONTH(fecha) ORDER BY año, mes"
            
            results = self.db.execute_query(query, tuple(params))
            
            return [
                {
                    'año': r['año'],
                    'mes': r['mes'],
                    'ingresos': float(r['ingresos'] or 0),
                    'gastos': float(r['gastos'] or 0),
                    'balance': float(r['balance'] or 0)
                }
                for r in results
            ]
            
        except Exception as e:
            logger.error(f"Error getting monthly trends: {e}")
            raise
    
    def detect_spending_anomalies(
        self,
        company_id: Optional[str] = None,
        threshold: float = 2.0
    ) -> List[Dict[str, Any]]:
        """
        Detect unusual spending patterns.
        
        Args:
            company_id: Optional company ID filter
            threshold: Standard deviation threshold
        
        Returns:
            List of anomalous transactions
        """
        try:
            # First, get average and standard deviation
            query = """
                SELECT 
                    AVG(monto) as promedio,
                    STDDEV(monto) as desviacion_std
                FROM finanzas_empresa
                WHERE tipo = 'gasto'
            """
            
            params = []
            if company_id:
                query += " AND empresa_id = %s"
                params.append(company_id)
            
            stats = self.db.execute_query(query, tuple(params) if params else None)
            
            if not stats or not stats[0]['promedio']:
                return []
            
            avg = float(stats[0]['promedio'])
            std_dev = float(stats[0]['desviacion_std'] or 0)
            
            # Find transactions beyond threshold
            query = """
                SELECT 
                    fecha,
                    concepto,
                    categoria,
                    monto
                FROM finanzas_empresa
                WHERE tipo = 'gasto'
                    AND monto > %s
            """
            
            params = [avg + (threshold * std_dev)]
            
            if company_id:
                query += " AND empresa_id = %s"
                params.append(company_id)
            
            query += " ORDER BY monto DESC LIMIT 10"
            
            results = self.db.execute_query(query, tuple(params))
            
            return [
                {
                    'fecha': r['fecha'].strftime('%Y-%m-%d') if r['fecha'] else None,
                    'concepto': r['concepto'],
                    'categoria': r['categoria'],
                    'monto': float(r['monto']),
                    'promedio': round(avg, 2),
                    'desviacion': round((float(r['monto']) - avg) / std_dev, 2) if std_dev > 0 else 0
                }
                for r in results
            ]
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            raise
    
    def get_period_summary(
        self,
        company_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get financial summary for a specific period.
        
        Args:
            company_id: Optional company ID filter
            start_date: Start date
            end_date: End date
        
        Returns:
            Dictionary with period summary
        """
        try:
            query = """
                SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                    SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as balance,
                    COUNT(*) as total_transacciones
                FROM finanzas_empresa
                WHERE 1=1
            """
            
            params = []
            
            if start_date:
                query += " AND fecha >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND fecha <= %s"
                params.append(end_date)
            
            if company_id:
                query += " AND empresa_id = %s"
                params.append(company_id)
            
            result = self.db.execute_query(query, tuple(params) if params else None)
            
            if result:
                return {
                    'ingresos': float(result[0]['ingresos'] or 0),
                    'gastos': float(result[0]['gastos'] or 0),
                    'balance': float(result[0]['balance'] or 0),
                    'transacciones': result[0]['total_transacciones']
                }
            
            return {'ingresos': 0, 'gastos': 0, 'balance': 0, 'transacciones': 0}
            
        except Exception as e:
            logger.error(f"Error getting period summary: {e}")
            raise

