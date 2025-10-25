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
            query = """
                SELECT 
                    SUM(CASE WHEN tipo_operacion = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo_operacion = 'gasto' THEN monto ELSE 0 END) as total_gastos,
                    SUM(CASE WHEN tipo_operacion = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM transacciones_empresa
            """
            
            params = None
            if company_id:
                query += " WHERE id_empresa = %s"
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
                FROM transacciones_empresa
                WHERE tipo_operacion = 'gasto'
            """
            
            conditions = []
            params = []
            
            if company_id:
                conditions.append("id_empresa = %s")
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
                    AVG(CASE WHEN tipo_operacion = 'ingreso' THEN monto ELSE 0 END) as avg_ingresos,
                    AVG(CASE WHEN tipo_operacion = 'gasto' THEN monto ELSE 0 END) as avg_gastos
                FROM transacciones_empresa
                WHERE fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            """
            
            params = None
            if company_id:
                query += " AND id_empresa = %s"
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
                    SUM(CASE WHEN tipo_operacion = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo_operacion = 'gasto' THEN monto ELSE 0 END) as total_gastos,
                    SUM(CASE WHEN tipo_operacion = 'ingreso' THEN monto ELSE -monto END) as balance
                FROM transacciones_personales
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
                FROM transacciones_empresa
                WHERE tipo_operacion = 'gasto'
                    AND MONTH(fecha) = %s
                    AND YEAR(fecha) = %s
            """
            
            params = [month, year]
            
            if company_id:
                query += " AND id_empresa = %s"
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

