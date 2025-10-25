"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material";
import {
  Login as LoginIcon
} from "@mui/icons-material";

// Create a custom theme with red and white colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#FF0000",
      light: "#FF3333",
      dark: "#CC0000",
    },
    background: {
      default: "#FFFFFF",
    },
  },
});

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Por ahora solo redirige al dashboard
    router.push("/dashboard");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        flexGrow: 1,
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: "center"
            }}
          >
            {/* Logo/Header */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  mb: 1
                }}
              >
                Banorte
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary"
                }}
              >
                Asistente Virtual
              </Typography>
            </Box>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
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
                  fontSize: "1.1rem",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  }
                }}
              >
                Iniciar Sesión
              </Button>
            </form>

            {/* Footer */}
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 3
              }}
            >
              ¿Olvidaste tu contraseña?
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}