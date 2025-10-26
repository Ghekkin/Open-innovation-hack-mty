
from .shortcuts import get_current_month_spending_summary

# Exponer las funciones de los módulos para facilitar la importación
from .analytics import (
    get_spending_trends_tool,
    get_category_recommendations_tool,
    detect_anomalies_tool,
    compare_periods_tool,
)
from .balance import get_company_balance_tool, get_personal_balance_tool
from .budget import get_budget_comparison_tool
from .descriptive import (
    list_transactions_tool,
    top_categories_tool,
    monthly_summary_tool,
)
from .expense import get_expenses_by_category_tool
from .planning import (
    goal_based_plan_tool,
    budget_allocator_tool,
    debt_paydown_optimizer_tool,
)
from .predictive import (
    predict_cash_shortage_tool,
    cash_runway_tool,
    forecast_expenses_by_category_tool,
    bill_forecaster_tool,
)
from .projection import get_cash_flow_projection_tool, simulate_scenario_tool
from .risk import (
    get_financial_health_score_tool,
    assess_financial_risk_tool,
    get_alerts_tool,
    get_stress_test_tool,
)
from .orchestrator import get_business_health_check, get_personal_monthly_review, create_debt_reduction_plan
from .financial_plan import generate_financial_plan_tool

