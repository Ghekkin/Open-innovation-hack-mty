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
  Alert
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon
} from "@mui/icons-material";

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
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [showAiResponse, setShowAiResponse] = useState(false);

  useEffect(() => {
    // Obtener nombre de usuario del localStorage
    const storedUsername = localStorage.getItem("banorte_username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
    // Cargar datos financieros reales
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Obtener company_id del localStorage o usar EMPRESA001 por defecto
      const companyId = localStorage.getItem("banorte_company_id") || "E039";
      
      // Llamar al endpoint de la API
      const response = await fetch(`/api/financial_data?company_id=${companyId}`);
      
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
          mb: { xs: 2, sm: 3 },
          background: "linear-gradient(135deg, #EC0029 0%, #C00020 100%)",
          p: { xs: 2, sm: 3 },
          borderRadius: 3
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", mr: 1.5, width: 40, height: 40 }}>
            <AutoAwesomeIcon sx={{ color: "white" }} />
          </Avatar>
          <Box>
          <Typography
            variant="h6"
              sx={{ 
                color: "white", 
                fontWeight: "bold",
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}
            >
              Asistente Financiero IA
          </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: "rgba(255,255,255,0.9)",
                fontSize: { xs: "0.7rem", sm: "0.75rem" }
              }}
            >
              Pregunta sobre tus finanzas y obtén análisis instantáneos
          </Typography>
          </Box>
        </Box>

        <form onSubmit={handleAiAnalysis}>
          <Box sx={{
            display: "flex",
            gap: { xs: 1, sm: 1.5 },
            alignItems: "center",
            bgcolor: "white",
            borderRadius: 3,
            p: { xs: 0.5, sm: 1 }
          }}>
            <TextField
              fullWidth
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ej: ¿Cómo puedo reducir mis gastos? ¿Cuál es mi categoría con más gastos?"
              disabled={isAnalyzing}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  px: { xs: 1, sm: 1.5 },
                  "& input::placeholder": {
                    color: "grey.500",
                    opacity: 1,
                    fontSize: { xs: "0.85rem", sm: "0.95rem" }
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
                width: { xs: 36, sm: 42 },
                height: { xs: 36, sm: 42 },
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
                <SendIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              )}
            </IconButton>
          </Box>
        </form>
        </Paper>

      {/* Respuesta de IA */}
      {showAiResponse && (
        <Alert 
          severity="info"
          icon={<AutoAwesomeIcon />}
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
              mb: 1,
              fontSize: { xs: "0.9rem", sm: "1rem" }
            }}
          >
            Análisis Financiero
          </Typography>
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
        </Alert>
      )}

      {/* Tarjetas de resumen */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)"
          },
          gap: { xs: 1.5, sm: 2, md: 3 },
          mb: { xs: 2, sm: 3, md: 4 }
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
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1, sm: 1.5 } }}>
              <Avatar sx={{ 
                bgcolor: "rgba(255,255,255,0.2)", 
                mr: { xs: 1, sm: 1.5 },
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 }
              }}>
                <AccountBalanceIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "0.9rem", sm: "1.25rem" } }}>
                Balance Total
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" }
              }}
            >
              {balance && formatCurrency(balance.balance)}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {balance && balance.balance >= 0 ? (
                <TrendingUpIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              )}
              <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {balance && balance.balance >= 0 ? "Positivo" : "Negativo"}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Ingresos */}
        <Card elevation={2} sx={{ height: "100%" }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1, sm: 1.5 } }}>
              <Avatar sx={{ 
                bgcolor: "#4CAF50", 
                mr: { xs: 1, sm: 1.5 },
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 }
              }}>
                <TrendingUpIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary", fontSize: { xs: "0.9rem", sm: "1.25rem" } }}>
                Ingresos
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                color: "#4CAF50",
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" }
              }}
            >
              {balance && formatCurrency(balance.ingresos)}
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.500", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
              Total de ingresos
            </Typography>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card elevation={2} sx={{ height: "100%" }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1, sm: 1.5 } }}>
              <Avatar sx={{ 
                bgcolor: "#FF5722", 
                mr: { xs: 1, sm: 1.5 },
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 }
              }}>
                <TrendingDownIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary", fontSize: { xs: "0.9rem", sm: "1.25rem" } }}>
                Gastos
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                color: "#FF5722",
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" }
              }}
            >
              {balance && formatCurrency(balance.gastos)}
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.500", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
              Total de gastos
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Gastos por categoría */}
      <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1.5, sm: 2, md: 3 } }}>
          <AssessmentIcon sx={{ color: "primary.main", mr: { xs: 0.5, sm: 1 }, fontSize: { xs: 20, sm: 24, md: 28 } }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "text.primary",
              fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" }
            }}
          >
            Gastos por Categoría
          </Typography>
        </Box>

        {/* Gráfica de barras */}
        <Box sx={{ 
          width: "100%", 
          height: { xs: 200, sm: 250, md: 300 }, 
          mb: { xs: 2, sm: 3 },
          display: { xs: "block", sm: "block" }
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expensesByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="categoria" 
                stroke="#C00020" 
                tick={{ fontSize: 11, fontWeight: 600 }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#C00020" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Tabla resumen debajo de la gráfica */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2 } }}>
          {expensesByCategory.map((category, index) => (
            <Box key={category.categoria}>
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: { xs: 0.5, sm: 0.75 },
                flexWrap: { xs: "wrap", sm: "nowrap" }
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flex: 1 }}>
                  <ShoppingCartIcon
                    sx={{
                      color: getCategoryColor(index),
                      fontSize: { xs: 16, sm: 20, md: 24 }
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" }
                    }}
                  >
                    {category.categoria}
                  </Typography>
                  <Chip
                    label={`${category.transacciones}`}
                    size="small"
                    sx={{
                      fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
                      height: { xs: 18, sm: 20, md: 24 },
                      "& .MuiChip-label": {
                        px: { xs: 0.5, sm: 1 }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: "right", ml: { xs: 1, sm: 0 } }}>
          <Typography
            variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: getCategoryColor(index),
                      fontSize: { xs: "0.85rem", sm: "1rem", md: "1.25rem" }
                    }}
                  >
                    {formatCurrency(category.total)}
          </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "grey.500",
                      fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" }
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
                  height: { xs: 4, sm: 6, md: 8 },
                  borderRadius: 4,
                  bgcolor: "grey.200",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: getCategoryColor(index),
                    borderRadius: 4
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
          p: { xs: 1.5, sm: 2, md: 3 },
          bgcolor: "#F5F5F5",
          borderLeft: { xs: "3px solid", sm: "4px solid" },
          borderColor: "primary.main"
          }}
        >
          <Typography
            variant="h6"
          sx={{
            fontWeight: "bold",
            mb: { xs: 1, sm: 1.5 },
            fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" }
          }}
        >
          💡 Consejo Financiero
          </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            lineHeight: 1.6,
            fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" }
          }}
        >
          {balance && balance.balance > 0
            ? "¡Excelente! Tu balance es positivo. Considera invertir parte de tus ahorros para hacer crecer tu patrimonio."
            : "Tu balance es negativo. Te recomendamos revisar tus gastos y crear un plan de ahorro. Nuestro asistente puede ayudarte a optimizar tus finanzas."}
          </Typography>
        </Paper>
    </Box>
  );
}