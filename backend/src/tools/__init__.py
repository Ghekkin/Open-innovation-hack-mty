"""MCP Tools for financial analysis."""
from .balance_tools import get_balance_tool, get_company_balance_tool, get_personal_balance_tool
from .expense_tools import get_expenses_by_category_tool
from .projection_tools import get_cash_flow_projection_tool, simulate_scenario_tool
from .budget_tools import get_budget_comparison_tool
from .analytics_tools import (
    get_financial_health_score_tool,
    get_spending_trends_tool,
    get_category_recommendations_tool,
    detect_anomalies_tool,
    compare_periods_tool
)
from .risk_tools import (
    assess_financial_risk_tool,
    get_alerts_tool,
    predict_cash_shortage_tool,
    get_stress_test_tool
)

__all__ = [
    'get_balance_tool',
    'get_company_balance_tool',
    'get_personal_balance_tool',
    'get_expenses_by_category_tool',
    'get_cash_flow_projection_tool',
    'simulate_scenario_tool',
    'get_budget_comparison_tool',
    'get_financial_health_score_tool',
    'get_spending_trends_tool',
    'get_category_recommendations_tool',
    'detect_anomalies_tool',
    'compare_periods_tool',
    'assess_financial_risk_tool',
    'get_alerts_tool',
    'predict_cash_shortage_tool',
    'get_stress_test_tool'
]

