"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  LinearProgress,
  Avatar,
  TextField,
  IconButton,
  Alert,
  Collapse
} from "@mui/material";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import { getCurrentUser, formatUsername } from "@/lib/auth";

interface BalanceData {
  ingresos: number;
  gastos: number;
  balance: number;
}

interface ExpenseCategory {
  categoria: string;
  total: number;
  transacciones: number;
  porcentaje: number;
  [key: string]: string | number; // Make it compatible with Recharts
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [userType, setUserType] = useState<'empresa' | 'personal'>('empresa');
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [isResponseExpanded, setIsResponseExpanded] = useState(true);

  useEffect(() => {
    // Obtener información del usuario del localStorage
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
      setUserType(user.type);
    }
    // Cargar datos financieros reales
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Obtener company_id del localStorage o usar EMPRESA001 por defecto
      const companyId = localStorage.getItem("banorte_username") || "E001";
      
      // Llamar al endpoint de la API
      const response = await fetch(`/api/financial_data/?company_id=${companyId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos financieros');
      }

      const data = await response.json();

      // Actualizar balance
      if (data.balance) {
        setBalance({
          ingresos: data.balance.ingresos_totales || 0,
          gastos: data.balance.gastos_totales || 0,
          balance: data.balance.balance_total || 0
        });
      }

      // Actualizar gastos por categoría
      if (data.expenses && Array.isArray(data.expenses.categorias)) {
        const totalGastos = data.expenses.total_gastos || 1;
        setExpensesByCategory(
          data.expenses.categorias.map((cat: any) => ({
            categoria: cat.categoria,
            total: cat.total,
            transacciones: cat.transacciones,
            porcentaje: totalGastos > 0 ? (cat.total / totalGastos) * 100 : 0
          }))
        );
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      
      // Usar datos de ejemplo en caso de error
      setBalance({
        ingresos: 150000,
        gastos: 85000,
        balance: 65000
      });

      setExpensesByCategory([
        { categoria: "Nómina", total: 45000, transacciones: 12, porcentaje: 52.94 },
        { categoria: "Servicios", total: 15000, transacciones: 8, porcentaje: 17.65 },
        { categoria: "Compras", total: 12000, transacciones: 25, porcentaje: 14.12 },
        { categoria: "Transporte", total: 8000, transacciones: 15, porcentaje: 9.41 },
        { categoria: "Otros", total: 5000, transacciones: 10, porcentaje: 5.88 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getCategoryColor = (index: number) => {
    const colors = ["#EC0029", "#FF3355", "#C00020", "#6A6867", "#C7C9C9"];
    return colors[index % colors.length];
  };

  const handleAiAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setShowAiResponse(false);

    try {
      // Crear contexto financiero para Gemini
      const financialContext = `
        Contexto financiero del usuario:
        - Balance total: ${balance ? formatCurrency(balance.balance) : 'N/A'}
        - Ingresos totales: ${balance ? formatCurrency(balance.ingresos) : 'N/A'}
        - Gastos totales: ${balance ? formatCurrency(balance.gastos) : 'N/A'}
        - Categorías de gastos: ${expensesByCategory.map(cat => 
          `${cat.categoria}: ${formatCurrency(cat.total)} (${cat.porcentaje.toFixed(1)}%)`
        ).join(', ')}
        
        Pregunta del usuario: ${inputValue}
        
        Por favor proporciona un análisis financiero claro, conciso y accionable en español.
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: financialContext })
      });

      const data = await response.json();
      setAiResponse(data.response || 'No se pudo generar un análisis');
      setShowAiResponse(true);
      setIsResponseExpanded(true);
      setInputValue("");
    } catch (error) {
      console.error('Error:', error);
      setAiResponse('Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.');
      setShowAiResponse(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        flexDirection: "column",
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: "primary.main" }} />
        <Typography variant="h6" sx={{ color: "grey.500" }}>
          Cargando tus datos financieros...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      
        <Paper
        elevation={3}
          sx={{
          mb: { xs: 1.5, sm: 2 },
          background: "linear-gradient(135deg, #EC0029 0%, #C00020 100%)",
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: 2
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1.5, sm: 2 } }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", mr: { xs: 1, sm: 1.5 }, width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}>
            <AutoAwesomeIcon sx={{ color: "white", fontSize: { xs: 18, sm: 20 } }} />
          </Avatar>
          <Box>
          <Typography
            variant="h6"
              sx={{
                color: "white",
                fontWeight: "bold",
                fontSize: { xs: "0.95rem", sm: "1.25rem" }
              }}
            >
              Maya - Tu Asistente Financiero IA
      </Typography>
            <Typography
              variant="caption"
        sx={{
                color: "rgba(255,255,255,0.9)",
                fontSize: { xs: "0.65rem", sm: "0.75rem" }
              }}
            >
              Pregunta sobre tus finanzas y obtén análisis instantáneos
          </Typography>
          </Box>
        </Box>

        <form onSubmit={handleAiAnalysis}>
          <Box sx={{
          display: "flex",
            gap: { xs: 0.8, sm: 1.5 },
            alignItems: "center",
            bgcolor: "white",
            borderRadius: 2,
            p: { xs: 0.4, sm: 1 }
          }}>
            <TextField
              fullWidth
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ej: ¿Cómo reducir mis gastos? ¿Categoría con más gastos?"
              disabled={isAnalyzing}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: { xs: "0.8rem", sm: "0.95rem" },
                  px: { xs: 0.8, sm: 1.5 },
                  "& input::placeholder": {
                    color: "grey.500",
                    opacity: 1,
                    fontSize: { xs: "0.8rem", sm: "0.95rem" }
                  }
                }
              }}
            />
            <IconButton
              type="submit"
              disabled={!inputValue.trim() || isAnalyzing}
              sx={{
                bgcolor: inputValue.trim() && !isAnalyzing ? "primary.main" : "grey.300",
                color: "white",
                width: { xs: 32, sm: 42 },
                height: { xs: 32, sm: 42 },
                "&:hover": {
                  bgcolor: inputValue.trim() && !isAnalyzing ? "primary.dark" : "grey.400",
                },
                "&:disabled": {
                  bgcolor: "grey.300",
                  color: "grey.500"
                }
              }}
            >
              {isAnalyzing ? (
                <CircularProgress size={20} sx={{ color: "grey.500" }} />
              ) : (
                <SendIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              )}
            </IconButton>
          </Box>
        </form>
        </Paper>

      {/* Respuesta de IA */}
      <Collapse in={showAiResponse} timeout={500}>
        {showAiResponse && (
          <Alert 
            severity="info"
            icon={<AutoAwesomeIcon />}
            action={
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton
                  aria-label="contraer"
                  color="inherit"
                  size="small"
                  onClick={() => setIsResponseExpanded(!isResponseExpanded)}
                  sx={{
                    mt: -0.5
                  }}
                >
                  {isResponseExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton
                  aria-label="cerrar"
                  color="inherit"
                  size="small"
                  onClick={() => setShowAiResponse(false)}
                  sx={{
                    mt: -0.5
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
            sx={{
              mb: { xs: 2, sm: 3 },
              borderRadius: 2,
              "& .MuiAlert-message": {
                width: "100%"
              }
            }}
          >
            <Typography
              variant="subtitle2" 
              sx={{ 
                fontWeight: "bold", 
                mb: isResponseExpanded ? 1 : 0,
                fontSize: { xs: "0.9rem", sm: "1rem" }
              }}
            >
              Análisis Financiero
            </Typography>
            {isResponseExpanded && (
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: { xs: "0.8rem", sm: "0.875rem" }
                }}
              >
                {aiResponse}
              </Typography>
            )}
          </Alert>
        )}
      </Collapse>

      {/* Layout principal: Stats a la izquierda, Gráfico a la derecha */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr", // Mobile: una columna
            sm: "repeat(2, 1fr)", // Tablet: dos columnas
            lg: "1fr 1fr" // Desktop: dos columnas (stats + gráfico)
          },
          gap: { xs: 2, sm: 3, lg: 4 },
          mb: 4,
          alignItems: "start"
        }}
      >
        {/* Panel izquierdo: Estadísticas principales */}
        <Box>
          {/* Header con saludo - más compacto */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: "primary.main",
                mb: 0.5,
                fontSize: { xs: "1.5rem", sm: "2rem" }
              }}
            >
              ¡Hola{username ? `, ${formatUsername(username, userType)}` : ""}! 👋
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "grey.500",
                fontSize: { xs: "0.85rem", sm: "1rem" }
              }}
            >
              Aquí está un resumen de tus finanzas
            </Typography>
          </Box>

          {/* Tarjetas de resumen - más compactas */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr",
                lg: "repeat(3, 1fr)"
              },
              gap: { xs: 1.5, sm: 2 },
              mb: { xs: 3, lg: 0 }
            }}
          >
            {/* Balance Total */}
            <Card
              elevation={2}
              sx={{
                background: "linear-gradient(135deg, #EC0029 0%, #C00020 100%)",
                color: "white",
                height: "100%"
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    mr: 1.5,
                    width: 36,
                    height: 36
                  }}>
                    <AccountBalanceIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    Balance Total
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    mb: 0.5,
                    fontSize: "1.5rem"
                  }}
                >
                  {balance && formatCurrency(balance.balance)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {balance && balance.balance >= 0 ? (
                    <TrendingUpIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 16 }} />
                  )}
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    {balance && balance.balance >= 0 ? "Positivo" : "Negativo"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Ingresos */}
            <Card elevation={2} sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar sx={{
                    bgcolor: "#4CAF50",
                    mr: 1.5,
                    width: 36,
                    height: 36
                  }}>
                    <TrendingUpIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.9rem" }}>
                    Ingresos
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    color: "#4CAF50",
                    mb: 0.5,
                    fontSize: "1.5rem"
                  }}
                >
                  {balance && formatCurrency(balance.ingresos)}
                </Typography>
                <Typography variant="caption" sx={{ color: "grey.500", fontSize: "0.75rem" }}>
                  Total de ingresos
                </Typography>
              </CardContent>
            </Card>

            {/* Gastos */}
            <Card elevation={2} sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar sx={{
                    bgcolor: "#FF5722",
                    mr: 1.5,
                    width: 36,
                    height: 36
                  }}>
                    <TrendingDownIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.9rem" }}>
                    Gastos
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    color: "#FF5722",
                    mb: 0.5,
                    fontSize: "1.5rem"
                  }}
                >
                  {balance && formatCurrency(balance.gastos)}
                </Typography>
                <Typography variant="caption" sx={{ color: "grey.500", fontSize: "0.75rem" }}>
                  Total de gastos
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Panel derecho: Gráfico circular */}
        <Box>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 2.5 }, height: "fit-content" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1.5, sm: 2 } }}>
              <AssessmentIcon sx={{ color: "primary.main", mr: 1, fontSize: { xs: 20, sm: 24 } }} />
              <Typography
                variant="h6"
          sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                  fontSize: { xs: "1rem", sm: "1.1rem" }
                }}
              >
                Distribución de Gastos
              </Typography>
            </Box>

            {/* Gráfico circular */}
            <Box sx={{
              width: "100%",
              height: { xs: 250, sm: 280, lg: 300 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="categoria"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${formatCurrency(value)}`, name]} 
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    formatter={(value, entry: any) => (
                      <span style={{ fontSize: "0.75rem", color: entry.color }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Análisis detallado de gastos - más compacto */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <AssessmentIcon sx={{ color: "primary.main", mr: 1, fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "text.primary",
              fontSize: "1rem"
            }}
          >
            Análisis Detallado de Gastos
          </Typography>
        </Box>

        {/* Lista compacta de categorías */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {expensesByCategory.map((category, index) => (
            <Box key={category.categoria}>
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
                flexWrap: "wrap"
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                  <ShoppingCartIcon
                    sx={{
                      color: getCategoryColor(index),
                      fontSize: 18
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.85rem"
                    }}
                  >
                    {category.categoria}
                  </Typography>
                  <Chip
                    label={`${category.transacciones}`}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      height: 20,
                      "& .MuiChip-label": {
                        px: 0.8
                      }
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      color: getCategoryColor(index),
                      fontSize: "0.9rem"
                    }}
                  >
                    {formatCurrency(category.total)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "grey.500",
                      fontSize: "0.7rem"
                    }}
                  >
                    {category.porcentaje.toFixed(1)}%
          </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={category.porcentaje}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: "grey.200",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: getCategoryColor(index),
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          ))}
        </Box>
        </Paper>



      {/* Información adicional */}
        <Paper
        elevation={2}
        sx={{
          p: { xs: 1.5, sm: 2 },
          bgcolor: "#F5F5F5",
          borderLeft: { xs: "3px solid", sm: "4px solid" },
          borderColor: "primary.main",
          borderRadius: 2
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: "bold",
            mb: 1,
            fontSize: { xs: "0.9rem", sm: "1rem" }
          }}
        >
          💡 Consejo Financiero
        </Typography>
          <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            lineHeight: 1.5,
            fontSize: { xs: "0.8rem", sm: "0.85rem" }
          }}
        >
          {balance && balance.balance > 0
            ? "¡Excelente! Tu balance es positivo. Considera invertir parte de tus ahorros para hacer crecer tu patrimonio."
            : "Tu balance es negativo. Te recomendamos revisar tus gastos y crear un plan de ahorro. Maya puede ayudarte a optimizar tus finanzas."}
          </Typography>
        </Paper>
    </Box>
  );
}