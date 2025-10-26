"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ExpandMore,
  Lightbulb,
  AttachMoney,
  Savings,
  AccountBalance,
  Timeline,
  ArrowBack,
} from "@mui/icons-material";
import "../resultado.css";

interface FinancialPlan {
  success: boolean;
  plan_id: string;
  generated_at: string;
  entity_type: string;
  goal: string;
  goal_analysis: {
    type: string;
    description: string;
    target_amount: number | null;
    timeframe: number | null;
  };
  current_situation: {
    current_balance: number;
    monthly_income: number;
    monthly_expense: number;
    monthly_net: number;
    from_historical: boolean;
    additional_incomes_count: number;
    additional_expenses_count: number;
  };
  metrics: {
    savings_rate: number;
    expense_ratio: number;
    months_to_goal: number | null;
    emergency_fund_months: number;
  };
  projections: Array<{
    month: number;
    date: string;
    income: number;
    expense: number;
    net: number;
    balance: number;
  }>;
  recommendations: Array<{
    priority: string;
    category: string;
    title: string;
    description: string;
    action: string;
  }>;
  improvement_areas: Array<{
    category: string;
    current_spending: number;
    percentage_of_total: number;
    potential_savings: number;
    priority: string;
    frequency: number;
  }>;
  savings_strategies: Array<{
    name: string;
    type: string;
    description: string;
    impact: number | null;
    difficulty: string;
    steps: string[];
  }>;
  alerts: Array<{
    type: string;
    message: string;
  }>;
  planning_horizon_months: number;
}

export default function FinancialPlanResultPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedPlan = localStorage.getItem("financialPlan");
    
    if (storedPlan) {
      try {
        const parsedPlan = JSON.parse(storedPlan);
        setPlan(parsedPlan);
      } catch (error) {
        console.error("Error al parsear el plan:", error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Typography>Cargando plan financiero...</Typography>
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box sx={{ pb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          No se encontró ningún plan financiero. Por favor, genera uno primero.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => router.push("/dashboard/plan-financiero")}
          sx={{ bgcolor: "primary.main" }}
        >
          Volver a Plan Financiero
        </Button>
      </Box>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "success";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger":
        return <ErrorIcon color="error" />;
      case "warning":
        return <Warning color="warning" />;
      default:
        return <CheckCircle color="success" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getGoalTypeLabel = (type?: string) => {
    if (!type) return "General";
    const labels: { [key: string]: string } = {
      savings: "Ahorro",
      debt_payoff: "Pago de Deudas",
      investment: "Inversión",
      purchase: "Compra",
      general: "General",
    };
    return labels[type] || type;
  };

  return (
    <Box className="financial-plan-result">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push("/dashboard/plan-financiero")}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main", mb: 1 }}>
          Tu Plan Financiero Personalizado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generado el {plan.generated_at && !isNaN(new Date(plan.generated_at).getTime()) 
            ? new Date(plan.generated_at).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Fecha no disponible"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ID del Plan: {plan.plan_id || "N/A"}
        </Typography>
      </Box>

      {/* Alertas */}
      {plan.alerts && plan.alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {plan.alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.type === "danger" ? "error" : "warning"}
              icon={getAlertIcon(alert.type)}
              sx={{ mb: 2 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Meta del Plan */}
      <Paper elevation={3} className="goal-section" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Lightbulb sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Tu Meta Financiera
            </Typography>
            <Chip
              label={getGoalTypeLabel(plan.goal_analysis?.type)}
              color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>
        <Typography variant="body1" sx={{ mb: 2, fontSize: "1.1rem" }}>
          {plan.goal_analysis?.description || plan.goal}
        </Typography>
        {plan.goal_analysis?.target_amount && (
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Monto Objetivo
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
                {formatCurrency(plan.goal_analysis?.target_amount || 0)}
              </Typography>
            </Box>
            {plan.goal_analysis?.timeframe && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Plazo
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {plan.goal_analysis.timeframe} meses
                </Typography>
              </Box>
            )}
            {plan.metrics?.months_to_goal !== null && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tiempo Estimado
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: (plan.metrics?.months_to_goal || 0) <= (plan.goal_analysis?.timeframe || 0) ? "success.main" : "warning.main" }}>
                  {plan.metrics.months_to_goal} meses
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Métricas Clave */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 3, mb: 4 }}>
        <Box>
          <Card className="metric-card">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccountBalance sx={{ color: "primary.main", mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Balance Actual
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {formatCurrency(plan.current_situation?.current_balance || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card className="metric-card">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Savings sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Tasa de Ahorro
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: (plan.metrics?.savings_rate || 0) >= 20 ? "success.main" : (plan.metrics?.savings_rate || 0) >= 10 ? "warning.main" : "error.main" }}>
                {(plan.metrics?.savings_rate || 0).toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(plan.metrics?.savings_rate || 0, 100)}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color={(plan.metrics?.savings_rate || 0) >= 20 ? "success" : (plan.metrics?.savings_rate || 0) >= 10 ? "warning" : "error"}
              />
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card className="metric-card">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AttachMoney sx={{ color: "info.main", mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Ahorro Mensual
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: (plan.current_situation?.monthly_net || 0) >= 0 ? "success.main" : "error.main" }}>
                {formatCurrency(plan.current_situation?.monthly_net || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card className="metric-card">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Timeline sx={{ color: "warning.main", mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Fondo de Emergencia
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {(plan.metrics?.emergency_fund_months || 0).toFixed(1)} meses
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(plan.metrics?.emergency_fund_months || 0) >= 6 ? "Excelente" : (plan.metrics?.emergency_fund_months || 0) >= 3 ? "Adecuado" : "Insuficiente"}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Situación Actual */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          Situación Financiera Actual
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
          <Box>
            <Box className="situation-item">
              <Typography variant="body2" color="text.secondary">
                Ingresos Mensuales
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "success.main" }}>
                <TrendingUp sx={{ verticalAlign: "middle", mr: 0.5 }} />
                {formatCurrency(plan.current_situation?.monthly_income || 0)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Box className="situation-item">
              <Typography variant="body2" color="text.secondary">
                Gastos Mensuales
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>
                <TrendingDown sx={{ verticalAlign: "middle", mr: 0.5 }} />
                {formatCurrency(plan.current_situation?.monthly_expense || 0)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Box className="situation-item">
              <Typography variant="body2" color="text.secondary">
                Balance Mensual
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: (plan.current_situation?.monthly_net || 0) >= 0 ? "success.main" : "error.main" }}>
                {formatCurrency(plan.current_situation?.monthly_net || 0)}
              </Typography>
            </Box>
          </Box>
        </Box>
        {plan.current_situation?.from_historical && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Este análisis incluye tus datos históricos guardados
            {(plan.current_situation?.additional_incomes_count || 0) > 0 && ` + ${plan.current_situation?.additional_incomes_count} ingreso(s) adicional(es)`}
            {(plan.current_situation?.additional_expenses_count || 0) > 0 && ` + ${plan.current_situation?.additional_expenses_count} gasto(s) adicional(es)`}
          </Alert>
        )}
      </Paper>

      {/* Proyección Financiera */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          Proyección a {plan.planning_horizon_months || 12} Meses
        </Typography>
        {plan.projections && plan.projections.length > 0 ? (
          <>
            <Box className="projection-chart">
              {plan.projections.map((proj, index) => (
                <Box key={index} className="projection-bar">
                  <Box
                    className={`bar ${proj.balance >= 0 ? "positive" : "negative"}`}
                    sx={{
                      height: `${Math.min(Math.abs(proj.balance) / Math.max(...plan.projections.map(p => Math.abs(p.balance))) * 100, 100)}%`,
                      minHeight: "20px",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "white", fontWeight: "bold" }}>
                      {formatCurrency(proj.balance)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    Mes {proj.month}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Balance proyectado al final del período: 
                <Typography component="span" sx={{ fontWeight: "bold", ml: 1, color: plan.projections[plan.projections.length - 1].balance >= 0 ? "success.main" : "error.main" }}>
                  {formatCurrency(plan.projections[plan.projections.length - 1].balance)}
                </Typography>
              </Typography>
            </Box>
          </>
        ) : (
          <Alert severity="info">
            No hay proyecciones disponibles en este momento.
          </Alert>
        )}
      </Paper>

      {/* Recomendaciones */}
      {plan.recommendations && plan.recommendations.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Recomendaciones Personalizadas
          </Typography>
          <List>
            {plan.recommendations.map((rec, index) => (
              <Box key={index}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Chip
                      label={rec.priority.toUpperCase()}
                      color={getPriorityColor(rec.priority) as any}
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        {rec.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {rec.description}
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: "italic", color: "primary.main" }}>
                          Acción: {rec.action}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < plan.recommendations.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {/* Áreas de Mejora */}
      {plan.improvement_areas && plan.improvement_areas.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Áreas de Mejora Identificadas
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
            {plan.improvement_areas.map((area, index) => (
              <Box key={index}>
                <Card variant="outlined" className="improvement-card">
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        {area.category}
                      </Typography>
                      <Chip
                        label={area.priority.toUpperCase()}
                        size="small"
                        color={getPriorityColor(area.priority) as any}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Gasto actual: {formatCurrency(area.current_spending)} ({area.percentage_of_total.toFixed(1)}% del total)
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: "bold" }}>
                      Ahorro potencial: {formatCurrency(area.potential_savings)}/mes
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Ahorro total potencial: {formatCurrency(plan.improvement_areas.reduce((sum, area) => sum + area.potential_savings, 0))}/mes
            </Typography>
          </Alert>
        </Paper>
      )}

      {/* Estrategias de Ahorro */}
      {plan.savings_strategies && plan.savings_strategies.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Estrategias de Ahorro Recomendadas
          </Typography>
          {plan.savings_strategies.map((strategy, index) => (
            <Accordion key={index} className="strategy-accordion">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", flex: 1 }}>
                    {strategy.name}
                  </Typography>
                  <Chip label={strategy.difficulty} size="small" />
                  {strategy.impact && (
                    <Chip
                      label={`+${formatCurrency(strategy.impact)}/mes`}
                      size="small"
                      color="success"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {strategy.description}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Pasos a seguir:
                </Typography>
                <List dense>
                  {strategy.steps.map((step, stepIndex) => (
                    <ListItem key={stepIndex}>
                      <ListItemIcon>
                        <CheckCircle color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={step} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}

      {/* Botones de Acción */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => router.push("/dashboard/plan-financiero")}
        >
          Crear Nuevo Plan
        </Button>
        <Button
          variant="contained"
          onClick={() => router.push("/dashboard/asistente")}
          sx={{ bgcolor: "primary.main" }}
        >
          Hablar con el Asistente
        </Button>
      </Box>
    </Box>
  );
}

