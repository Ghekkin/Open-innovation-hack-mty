"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
  InputAdornment,
  IconButton,
  Alert,
  Chip
} from "@mui/material";
import {
  Login as LoginIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Business as BusinessIcon,
  AccountCircle as AccountCircleIcon
} from "@mui/icons-material";

import { validateUser, saveUserInfo } from "@/lib/auth";

// Create a custom theme with Banorte colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#EC0029",
      light: "#FF3355",
      dark: "#C00020",
    },
    background: {
      default: "#F5F5F5",
    },
  },
});

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validar usuario
    const validation = validateUser(username);
    
    if (!validation.valid) {
      setError(validation.error || "Usuario inválido");
      return;
    }
    
    // Validar contraseña (mínimo 4 caracteres para este demo)
    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }
    
    // Guardar información del usuario
    saveUserInfo(username, validation.type!);
    
    // Redirigir al dashboard
    router.push("/dashboard");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="banorte">
        <header>
          <div className="header_top"></div>
        </header>
      </div>
      <Box sx={{
        flexGrow: 1,
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2
      }}>
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              textAlign: "center"
            }}
          >
            {/* Logo Banorte */}
            <Box sx={{ 
              mb: 4, 
              display: "flex", 
              justifyContent: "center",
              alignItems: "center"
            }}>
              <Image
                src="/Logo_de_Banorte.svg.png"
                alt="Banorte Logo"
                width={280}
                height={80}
                priority
                style={{ objectFit: "contain" }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                mb: 1
              }}
            >
              Plataforma en línea de Banorte
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 3
              }}
            >
              Ingresa tus credenciales para continuar
            </Typography>

            {/* Tipos de cuenta */}
            <Box sx={{ 
              display: "flex", 
              gap: 2, 
              justifyContent: "center",
              mb: 3,
              flexWrap: "wrap"
            }}>
              <Chip
                icon={<BusinessIcon />}
                label="Empresa: E001-E025"
                variant="outlined"
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  fontWeight: 500
                }}
              />
              <Chip
                icon={<AccountCircleIcon />}
                label="Personal: 1-25"
                variant="outlined"
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  fontWeight: 500
                }}
              />
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, textAlign: "left" }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Usuario"
                placeholder="Ej: E001 o 15"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                required
                error={!!error}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    }
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                    WebkitTextFillColor: "inherit",
                  },
                  "& input:-webkit-autofill:hover": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                  },
                  "& input:-webkit-autofill:focus": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                  },
                  "& input:-webkit-autofill:active": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                  }
                }}
              />
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { pl: 1.5 }
                }}
                sx={{ 
                  mb: 4,
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    }
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                    WebkitTextFillColor: "inherit",
                  },
                  "& input:-webkit-autofill:hover": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                  },
                  "& input:-webkit-autofill:focus": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                  },
                  "& input:-webkit-autofill:active": {
                    WebkitBoxShadow: "0 0 0 100px white inset",
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<LoginIcon />}
                sx={{
                  bgcolor: "primary.main",
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(236, 0, 41, 0.3)",
                  "&:hover": {
                    bgcolor: "primary.dark",
                    boxShadow: "0 6px 16px rgba(236, 0, 41, 0.4)",
                  }
                }}
              >
                Iniciar Sesión
              </Button>
            </form>

            {/* Footer */}
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline"
                  }
                }}
              >
                ¿Olvidaste tu contraseña?
              </Typography>
            </Box>
          </Paper>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              textAlign: "center",
              display: "block",
              mt: 3
            }}
          >
            © 2025 Banorte. Todos los derechos reservados.
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}