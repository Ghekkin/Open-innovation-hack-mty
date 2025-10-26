"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  FormGroup,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface FinancialEntry {
  id: number;
  description: string;
  amount: number;
  frequency: "unica" | "semanal" | "quincenal" | "mensual" | "anual";
  startDate: string;
  endDate: string | null;
  isIndefinite: boolean;
}

export default function FinancialPlanPage() {
  const router = useRouter();
  const [planOption, setPlanOption] = useState<"saved" | "custom">("saved");
  const [customIncomes, setCustomIncomes] = useState<FinancialEntry[]>([]);
  const [customExpenses, setCustomExpenses] = useState<FinancialEntry[]>([]);
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeAmount, setIncomeAmount] = useState<number | "">("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number | "">("");
  const [incomeFrequency, setIncomeFrequency] = useState<FinancialEntry["frequency"]>("mensual");
  const [incomeStartDate, setIncomeStartDate] = useState("");
  const [incomeEndDate, setIncomeEndDate] = useState<string | null>(null);
  const [incomeIsIndefinite, setIncomeIsIndefinite] = useState(false);
  const [expenseFrequency, setExpenseFrequency] = useState<FinancialEntry["frequency"]>("mensual");
  const [expenseStartDate, setExpenseStartDate] = useState("");
  const [expenseEndDate, setExpenseEndDate] = useState<string | null>(null);
  const [expenseIsIndefinite, setExpenseIsIndefinite] = useState(false);
  const [planGoal, setPlanGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddEntry = (type: "income" | "expense") => {
    setError(null);
    if (type === "income") {
      if (!incomeDescription || incomeAmount === "" || isNaN(Number(incomeAmount))) {
        setError("Por favor, ingresa una descripción y un monto válido para el ingreso.");
        return;
      }
      if (!incomeStartDate) {
        setError("Por favor, ingresa una fecha de inicio para el ingreso.");
        return;
      }
      if (!incomeIsIndefinite && !incomeEndDate) {
        setError("Por favor, ingresa una fecha de fin o marca como indefinido para el ingreso.");
        return;
      }
      setCustomIncomes((prev) => [
        ...prev,
        {
          id: Date.now(),
          description: incomeDescription,
          amount: Number(incomeAmount),
          frequency: incomeFrequency,
          startDate: incomeStartDate,
          endDate: incomeIsIndefinite ? null : incomeEndDate,
          isIndefinite: incomeIsIndefinite,
        },
      ]);
      setIncomeDescription("");
      setIncomeAmount("");
      setIncomeFrequency("mensual");
      setIncomeStartDate("");
      setIncomeEndDate(null);
      setIncomeIsIndefinite(false);
    } else {
      if (!expenseDescription || expenseAmount === "" || isNaN(Number(expenseAmount))) {
        setError("Por favor, ingresa una descripción y un monto válido para el gasto.");
        return;
      }
      if (!expenseStartDate) {
        setError("Por favor, ingresa una fecha de inicio para el gasto.");
        return;
      }
      if (!expenseIsIndefinite && !expenseEndDate) {
        setError("Por favor, ingresa una fecha de fin o marca como indefinido para el gasto.");
        return;
      }
      setCustomExpenses((prev) => [
        ...prev,
        {
          id: Date.now(),
          description: expenseDescription,
          amount: Number(expenseAmount),
          frequency: expenseFrequency,
          startDate: expenseStartDate,
          endDate: expenseIsIndefinite ? null : expenseEndDate,
          isIndefinite: expenseIsIndefinite,
        },
      ]);
      setExpenseDescription("");
      setExpenseAmount("");
      setExpenseFrequency("mensual");
      setExpenseStartDate("");
      setExpenseEndDate(null);
      setExpenseIsIndefinite(false);
    }
  };

  const handleDeleteEntry = (type: "income" | "expense", id: number) => {
    if (type === "income") {
      setCustomIncomes((prev) => prev.filter((entry) => entry.id !== id));
    } else {
      setCustomExpenses((prev) => prev.filter((entry) => entry.id !== id));
    }
  };

  const handleGeneratePlan = async () => {
    setError(null);
    
    if (!planGoal.trim()) {
      setError("Por favor, describe la meta de tu plan financiero.");
      return;
    }

    if (planOption === "custom" && customIncomes.length === 0 && customExpenses.length === 0) {
      setError("Si seleccionas 'Tomar en cuenta otros gastos e ingresos', debes agregar al menos un ingreso o gasto adicional.");
      return;
    }

    setIsGenerating(true);

    try {
      // Obtener información del usuario del localStorage
      const userInfo = JSON.parse(localStorage.getItem("banorte_user") || "{}");

      // Validar que tengamos la información del usuario si se van a usar datos guardados
      if (planOption === "saved" && (!userInfo.userId || !userInfo.type)) {
        setError("No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.");
        return;
      }

      const response = await fetch("/api/financial-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planOption,
          customIncomes,
          customExpenses,
          planGoal,
          userInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al generar el plan financiero");
      }

      // Guardar el plan en localStorage y redirigir a la página de resultados
      localStorage.setItem("financialPlan", JSON.stringify(data.plan));
      router.push("/dashboard/plan-financiero/resultado");

    } catch (err) {
      console.error("Error al generar plan:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al generar el plan");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main", mb: 3 }}>
        Plan Financiero
      </Typography>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          ¿Cómo deseas elaborar tu plan financiero?
        </Typography>
        <RadioGroup
          row
          value={planOption}
          onChange={(e) => setPlanOption(e.target.value as "saved" | "custom")}
          sx={{ mb: 3 }}
        >
          <FormControlLabel
            value="saved"
            control={<Radio sx={{ color: "primary.main" }} />}
            label="Solo con mis datos guardados"
          />
          <FormControlLabel
            value="custom"
            control={<Radio sx={{ color: "primary.main" }} />}
            label="Tomar en cuenta otros gastos e ingresos"
          />
        </RadioGroup>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {planOption === "custom" && (
          <Box>
            <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600, color: "primary.main" }}>
              Ingresos Adicionales
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
              <TextField
                label="Descripción del Ingreso"
                variant="outlined"
                fullWidth
                value={incomeDescription}
                onChange={(e) => setIncomeDescription(e.target.value)}
                sx={{ 
                  "& .MuiOutlinedInput-root": { 
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                }}
              />
              <TextField
                label="Monto"
                variant="outlined"
                type="number"
                fullWidth
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(Number(e.target.value))}
                sx={{ 
                  "& .MuiOutlinedInput-root": { 
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
              <FormControl fullWidth variant="outlined" sx={{ 
                "& .MuiOutlinedInput-root": { 
                  "&.Mui-focused fieldset": { borderColor: "primary.main" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
              }}>
                <InputLabel id="income-frequency-label">Frecuencia</InputLabel>
                <Select
                  labelId="income-frequency-label"
                  value={incomeFrequency}
                  label="Frecuencia"
                  onChange={(e) => setIncomeFrequency(e.target.value as FinancialEntry["frequency"])}
                >
                  <MenuItem value="unica">Única</MenuItem>
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="quincenal">Quincenal</MenuItem>
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="anual">Anual</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Fecha de Inicio"
                variant="outlined"
                type="date"
                fullWidth
                value={incomeStartDate}
                onChange={(e) => setIncomeStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ 
                  "& .MuiOutlinedInput-root": { 
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                }}
              />
              {!incomeIsIndefinite && (
                <TextField
                  label="Fecha de Fin"
                  variant="outlined"
                  type="date"
                  fullWidth
                  value={incomeEndDate || ""}
                  onChange={(e) => setIncomeEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ 
                    "& .MuiOutlinedInput-root": { 
                      "&.Mui-focused fieldset": { borderColor: "primary.main" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                  }}
                />
              )}
              <FormGroup sx={{ justifyContent: "center", minWidth: { xs: "100%", sm: 150 } }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={incomeIsIndefinite}
                      onChange={(e) => setIncomeIsIndefinite(e.target.checked)}
                      sx={{ color: "primary.main" }}
                    />
                  }
                  label="Indefinido"
                />
              </FormGroup>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAddEntry("income")}
                sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" }, minWidth: { xs: "100%", sm: 150 } }}
              >
                Agregar
              </Button>
            </Box>
            {customIncomes.length > 0 && (
              <TableContainer component={Paper} elevation={1} sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "primary.light" }}>
                    <TableRow>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Descripción</TableCell>
                      <TableCell align="right" sx={{ color: "white", fontWeight: "bold" }}>Monto</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Frecuencia</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Inicio</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fin</TableCell>
                      <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customIncomes.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell align="right">${entry.amount.toFixed(2)}</TableCell>
                        <TableCell>{entry.frequency}</TableCell>
                        <TableCell>{entry.startDate}</TableCell>
                        <TableCell>{entry.isIndefinite ? "Indefinido" : entry.endDate}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleDeleteEntry("income", entry.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600, color: "primary.main" }}>
              Gastos Adicionales
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
              <TextField
                label="Descripción del Gasto"
                variant="outlined"
                fullWidth
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                sx={{ 
                  "& .MuiOutlinedInput-root": { 
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                }}
              />
              <TextField
                label="Monto"
                variant="outlined"
                type="number"
                fullWidth
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
                sx={{ 
                  "& .MuiOutlinedInput-root": { 
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
              <FormControl fullWidth variant="outlined" sx={{ 
                "& .MuiOutlinedInput-root": { 
                  "&.Mui-focused fieldset": { borderColor: "primary.main" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
              }}>
                <InputLabel id="expense-frequency-label">Frecuencia</InputLabel>
                <Select
                  labelId="expense-frequency-label"
                  value={expenseFrequency}
                  label="Frecuencia"
                  onChange={(e) => setExpenseFrequency(e.target.value as FinancialEntry["frequency"])}
                >
                  <MenuItem value="unica">Única</MenuItem>
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="quincenal">Quincenal</MenuItem>
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="anual">Anual</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Fecha de Inicio"
                variant="outlined"
                type="date"
                fullWidth
                value={expenseStartDate}
                onChange={(e) => setExpenseStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ 
                  "& .MuiOutlinedInput-root": { 
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                }}
              />
              {!expenseIsIndefinite && (
                <TextField
                  label="Fecha de Fin"
                  variant="outlined"
                  type="date"
                  fullWidth
                  value={expenseEndDate || ""}
                  onChange={(e) => setExpenseEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ 
                    "& .MuiOutlinedInput-root": { 
                      "&.Mui-focused fieldset": { borderColor: "primary.main" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
                  }}
                />
              )}
              <FormGroup sx={{ justifyContent: "center", minWidth: { xs: "100%", sm: 150 } }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={expenseIsIndefinite}
                      onChange={(e) => setExpenseIsIndefinite(e.target.checked)}
                      sx={{ color: "primary.main" }}
                    />
                  }
                  label="Indefinido"
                />
              </FormGroup>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAddEntry("expense")}
                sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" }, minWidth: { xs: "100%", sm: 150 } }}
              >
                Agregar
              </Button>
            </Box>
            {customExpenses.length > 0 && (
              <TableContainer component={Paper} elevation={1} sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "primary.light" }}>
                    <TableRow>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Descripción</TableCell>
                      <TableCell align="right" sx={{ color: "white", fontWeight: "bold" }}>Monto</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Frecuencia</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Inicio</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fin</TableCell>
                      <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customExpenses.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell align="right">${entry.amount.toFixed(2)}</TableCell>
                        <TableCell>{entry.frequency}</TableCell>
                        <TableCell>{entry.startDate}</TableCell>
                        <TableCell>{entry.isIndefinite ? "Indefinido" : entry.endDate}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleDeleteEntry("expense", entry.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          ¿Cuál es la meta de tu plan financiero?
        </Typography>
        <TextField
          label="Ej: Ahorrar $10,000 en 6 meses..."
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          value={planGoal}
          onChange={(e) => setPlanGoal(e.target.value)}
          sx={{ 
            mb: 3,
            "& .MuiOutlinedInput-root": { 
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
            "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
          }}
        />

        <Button
          variant="contained"
          sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" }, py: 1.5, fontSize: "1.1rem" }}
          fullWidth
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isGenerating ? "Generando Plan..." : "Generar Plan Financiero"}
        </Button>
      </Paper>
    </Box>
  );
}
