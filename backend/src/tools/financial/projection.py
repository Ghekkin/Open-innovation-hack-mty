from database import get_db_connection
from utils import setup_logger
import logging
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX

logger = setup_logger('projection_tools', logging.INFO)

def get_cash_flow_projection_tool(company_id: str = None, months: int = 6) -> dict:
    """
    Proyecta el flujo de caja para los próximos meses usando un modelo estadístico SARIMA.
    Este método es más avanzado que un promedio simple, ya que captura tendencias y estacionalidad.
    """
    try:
        db = get_db_connection()

        def get_monthly_series(transaction_type: str):
            # Necesitamos al menos 2 años de datos para un modelo estacional fiable (s=12)
            query = """
                SELECT DATE_TRUNC('month', fecha) as month, SUM(monto) as total
                FROM transacciones
                WHERE tipo = %s {company_filter} AND fecha >= NOW() - INTERVAL '24 months'
                GROUP BY month
                ORDER BY month
            """
            company_filter = "AND empresa_id = %s" if company_id else ""
            query = query.format(company_filter=company_filter)
            
            params = [transaction_type]
            if company_id:
                params.append(company_id)

            data = db.execute_query(query, tuple(params), fetch='all')
            
            if not data:
                return pd.Series()

            df = pd.DataFrame(data, columns=['month', 'total'])
            df['month'] = pd.to_datetime(df['month'])
            df.set_index('month', inplace=True)
            # Aseguramos una serie mensual continua, rellenando meses faltantes con 0
            df = df.resample('MS').sum()
            return df['total']

        income_series = get_monthly_series('ingreso')
        expense_series = get_monthly_series('gasto')

        if len(income_series) < 12 or len(expense_series) < 12:
            return {"success": False, "message": "Se necesitan al menos 12 meses de datos históricos para un pronóstico fiable."}

        # Configuración del modelo SARIMA (simple pero robusta para datos mensuales)
        sarima_order = (1, 1, 1)
        sarima_seasonal_order = (0, 1, 1, 12)

        # Pronóstico de Ingresos
        income_model = SARIMAX(income_series, order=sarima_order, seasonal_order=sarima_seasonal_order, enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
        income_forecast = income_model.get_forecast(steps=months).predicted_mean

        # Pronóstico de Gastos
        expense_model = SARIMAX(expense_series, order=sarima_order, seasonal_order=sarima_seasonal_order, enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
        expense_forecast = expense_model.get_forecast(steps=months).predicted_mean

        # Obtener balance actual
        balance_query = "SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) FROM transacciones"
        balance_params = []
        if company_id:
            balance_query += " WHERE empresa_id = %s"
            balance_params.append(company_id)
        current_balance = float(db.execute_query(balance_query, tuple(balance_params), fetch='one')[0] or 0)

        # Crear la proyección mes a mes
        projection = []
        balance = current_balance
        for i in range(months):
            proj_income = income_forecast.iloc[i]
            proj_expense = expense_forecast.iloc[i]
            balance += proj_income - proj_expense
            projection.append({
                "month": i + 1,
                "projected_income": round(proj_income, 2),
                "projected_expense": round(proj_expense, 2),
                "projected_net_flow": round(proj_income - proj_expense, 2),
                "projected_balance": round(balance, 2)
            })

        return {
            "success": True,
            "methodology": "SARIMA Time Series Forecast (Seasonal AutoRegressive Integrated Moving Average)",
            "current_balance": current_balance,
            "projection": projection,
            "recommendation": "Esta proyección se basa en tendencias y patrones estacionales de tus datos históricos. Es más fiable que un promedio simple."
        }

    except Exception as e:
        logger.error(f"Error en get_cash_flow_projection_tool (SARIMA): {e}")
        return {"success": False, "error": str(e), "message": "No se pudo generar el pronóstico. Puede que no haya suficientes datos históricos o que los datos no sean adecuados para un modelo predictivo."}


def simulate_scenario_tool(
    current_balance: float,
    monthly_income_change: float = 0,
    monthly_expense_change: float = 0,
    months: int = 6
) -> dict:
    """
    Simula un escenario financiero 'what-if'.
    """
    try:
        # En un caso real, se usarían promedios históricos como base
        base_monthly_income = 50000 
        base_monthly_expense = 40000
        
        new_monthly_income = base_monthly_income + monthly_income_change
        new_monthly_expense = base_monthly_expense + monthly_expense_change
        
        projection = []
        balance = current_balance
        for i in range(1, months + 1):
            balance += new_monthly_income - new_monthly_expense
            projection.append({
                "month": i,
                "projected_balance": round(balance, 2)
            })
            
        return {
            "success": True,
            "simulation_parameters": {
                "initial_balance": current_balance,
                "monthly_income_change": monthly_income_change,
                "monthly_expense_change": monthly_expense_change,
                "simulated_months": months
            },
            "projected_scenario": projection
        }
    except Exception as e:
        logger.error(f"Error en simulate_scenario_tool: {e}")
        return {"success": False, "error": str(e)}