from database import get_db_connection
from utils import setup_logger
import logging
import pandas as pd
from statsmodels.tsa.api import SimpleExpSmoothing

logger = setup_logger('predictive_tools', logging.INFO)

def predict_cash_shortage_tool(company_id: str = None, months_ahead: int = 6) -> dict:
    """
    Predice si habrá escasez de efectivo en los próximos meses.
    """
    try:
        db = get_db_connection()
        
        balance_query = "SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) FROM transacciones"
        balance_params = []
        if company_id:
            balance_query += " WHERE empresa_id = %s"
            balance_params.append(company_id)
        current_balance = db.execute_query(balance_query, tuple(balance_params), fetch='one')[0] or 0
        
        flow_query = """
            SELECT 
                DATE_TRUNC('month', fecha) as month,
                SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as net_flow
            FROM transacciones
            WHERE 1=1
        """
        flow_params = []
        if company_id:
            flow_query += " AND empresa_id = %s"
            flow_params.append(company_id)
        flow_query += " GROUP BY month ORDER BY month DESC LIMIT 12"
        
        monthly_flow = db.execute_query(flow_query, tuple(flow_params), fetch='all')
        if len(monthly_flow) < 3:
            return {"message": "No hay suficientes datos históricos para una predicción fiable."}
            
        avg_monthly_flow = sum(f[1] for f in monthly_flow) / len(monthly_flow)
        
        if avg_monthly_flow >= 0:
            return {"success": True, "prediction": "No se predice escasez de efectivo con las tendencias actuales."}
            
        months_to_shortage = -current_balance / avg_monthly_flow
        
        if months_to_shortage > months_ahead:
            return {"success": True, "prediction": f"No se predice escasez en los próximos {months_ahead} meses."}
        else:
            return {
                "success": True,
                "prediction": "ALERTA: Posible escasez de efectivo.",
                "estimated_months_to_shortage": round(months_to_shortage, 1),
                "recommendation": "Revisar gastos urgentemente y buscar formas de incrementar ingresos para evitar una crisis de liquidez."
            }
            
    except Exception as e:
        logger.error(f"Error en predict_cash_shortage_tool: {e}")
        return {"success": False, "error": str(e)}

def cash_runway_tool(
    entity_type: str = "company",
    entity_id: str = None,
    current_cash: float = None,
    burn_method: str = "avg_3m"
) -> dict:
    """
    Calcula el 'cash runway' o tiempo de supervivencia.
    """
    try:
        db = get_db_connection()
        table = "transacciones" if entity_type == "company" else "transacciones_personales"
        id_column = "empresa_id" if entity_type == "company" else "usuario_id"

        if current_cash is None:
            balance_query = f"SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) FROM {table}"
            params = []
            if entity_id:
                balance_query += f" WHERE {id_column} = %s"
                params.append(entity_id)
            current_cash = float(db.execute_query(balance_query, tuple(params), fetch='one')[0] or 0)

        months = int(burn_method.replace('avg_', '').replace('m', ''))
        
        burn_query = f"""
            SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END) as net_flow
            FROM {table}
            WHERE fecha >= NOW() - INTERVAL '{months} months'
        """
        params = []
        if entity_id:
            burn_query += f" AND {id_column} = %s"
            params.append(entity_id)
        
        net_flow_period = db.execute_query(burn_query, tuple(params), fetch='one')[0]
        
        if net_flow_period is None:
            return {"success": False, "message": f"No hay datos de los últimos {months} meses para calcular el burn rate."}

        avg_monthly_net_flow = float(net_flow_period) / months
        
        if avg_monthly_net_flow >= 0:
            return {
                "success": True,
                "cash_runway_months": float('inf'),
                "burn_rate": -avg_monthly_net_flow,
                "message": "El flujo de caja es positivo. ¡No hay burn rate!"
            }

        burn_rate = -avg_monthly_net_flow
        runway_months = current_cash / burn_rate

        return {
            "success": True,
            "current_cash": current_cash,
            "burn_rate_calculation_period_months": months,
            "average_monthly_burn_rate": burn_rate,
            "cash_runway_months": round(runway_months, 1)
        }
    except Exception as e:
        logger.error(f"Error en cash_runway_tool: {e}")
        return {"success": False, "error": str(e)}


def forecast_expenses_by_category_tool(
    entity_type: str = "company",
    entity_id: str = None,
    category: str = None,
    months_ahead: int = 6,
    method: str = "sma"
) -> dict:
    """
    Pronostica gastos futuros para una categoría específica.
    """
    try:
        db = get_db_connection()
        table = "transacciones" if entity_type == "company" else "transacciones_personales"
        id_column = "empresa_id" if entity_type == "company" else "usuario_id"

        query = f"""
            SELECT DATE_TRUNC('month', fecha) as month, SUM(monto) as total
            FROM {table}
            WHERE tipo = 'gasto' AND categoria = %s
        """
        params = [category]
        if entity_id:
            query += f" AND {id_column} = %s"
            params.append(entity_id)
        
        query += " GROUP BY month ORDER BY month"
        
        df_data = db.execute_query(query, tuple(params), fetch='all')
        if len(df_data) < 3:
            return {"success": False, "message": "Se necesitan al menos 3 meses de datos para un pronóstico."}

        df = pd.DataFrame(df_data, columns=['month', 'total'])
        df.set_index('month', inplace=True)
        
        df = df.resample('MS').sum()
        
        if method == 'sma':
            forecast_value = df['total'].rolling(window=3).mean().iloc[-1]
            forecast_values = [forecast_value] * months_ahead
        elif method == 'ema':
            model = SimpleExpSmoothing(df['total'], initialization_method="estimated").fit()
            forecast = model.forecast(months_ahead)
            forecast_values = forecast.tolist()
        else:
            return {"success": False, "error": "Método de pronóstico no válido."}

        return {
            "success": True,
            "category": category,
            "method": method,
            "forecast_months": months_ahead,
            "forecast": {f"month_{i+1}": round(val, 2) for i, val in enumerate(forecast_values)}
        }
    except Exception as e:
        logger.error(f"Error en forecast_expenses_by_category_tool: {e}")
        return {"success": False, "error": str(e)}


def bill_forecaster_tool(
    user_id: str = None,
    months_ahead: int = 3
) -> dict:
    """
    Predice próximas facturas y suscripciones recurrentes.
    """
    try:
        db = get_db_connection()
        query = """
            SELECT descripcion, monto, fecha 
            FROM transacciones_personales 
            WHERE usuario_id = %s AND tipo = 'gasto' AND fecha >= NOW() - INTERVAL '4 months'
            ORDER BY descripcion, fecha
        """
        transactions = db.execute_query(query, (user_id,), fetch='all')
        if not transactions:
            return {"success": True, "recurring_bills": []}

        df = pd.DataFrame(transactions, columns=['descripcion', 'monto', 'fecha'])
        df['fecha'] = pd.to_datetime(df['fecha'])

        potential_bills = []
        df['monto_rounded'] = df['monto'].round(0)
        
        for _, group in df.groupby(['descripcion', 'monto_rounded']):
            if len(group) > 1:
                group = group.sort_values('fecha')
                diffs = group['fecha'].diff().dt.days.dropna()
                
                if all(28 <= d <= 32 for d in diffs):
                    last_transaction = group.iloc[-1]
                    potential_bills.append({
                        "description": last_transaction['descripcion'],
                        "amount": float(last_transaction['monto']),
                        "last_date": last_transaction['fecha'].strftime('%Y-%m-%d'),
                        "frequency_days": round(diffs.mean())
                    })
        
        forecasted_bills = []
        from datetime import timedelta
        today = pd.to_datetime('today')

        for bill in potential_bills:
            next_date = pd.to_datetime(bill['last_date']) + timedelta(days=int(bill['frequency_days']))
            for _ in range(months_ahead * 2): # Check more to ensure we get enough
                if next_date > today:
                    if len(forecasted_bills) < months_ahead * len(potential_bills): # Heuristic limit
                         forecasted_bills.append({
                            "description": bill['description'],
                            "amount": bill['amount'],
                            "predicted_date": next_date.strftime('%Y-%m-%d')
                        })
                next_date += timedelta(days=int(bill['frequency_days']))
        
        # Deduplicate and limit
        final_forecast = sorted(list({frozenset(item.items()): item for item in forecasted_bills}.values()), key=lambda x: x['predicted_date'])


        return {
            "success": True,
            "forecasted_recurring_bills": final_forecast
        }
    except Exception as e:
        logger.error(f"Error en bill_forecaster_tool: {e}")
        return {"success": False, "error": str(e)}
