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
  IconButton
} from "@mui/material";
import {
  Login as LoginIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guardar usuario en localStorage
    if (username.trim()) {
      localStorage.setItem("banorte_username", username.trim());
      localStorage.setItem("banorte_login_time", new Date().toISOString());
      
      // Redirigir al dashboard
      router.push("/dashboard");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
                mb: 4
              }}
            >
              Ingresa tus credenciales para continuar
            </Typography>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
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

          {/* Info adicional */}
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