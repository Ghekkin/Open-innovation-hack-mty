"""Financial data queries for the MCP server."""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .connection import get_db_connection

logger = logging.getLogger(__name__)


class FinancialDataQueries:
    """Handles all financial data queries."""
    
    def __init__(self):
        self.db = get_db_connection()
    
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

