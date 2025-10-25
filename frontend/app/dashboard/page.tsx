"use client";
import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  ArrowForward as ArrowForwardIcon
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

export default function Dashboard() {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Funcionalidad pendiente - solo previene el submit por ahora
    console.log("Consulta:", inputValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        flexGrow: 1,
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        py: 4
      }}>
        <Container maxWidth="md">
          {/* Header Section */}
          <Box sx={{
            textAlign: "center",
            mb: 4,
            pt: 2
          }}>
            <Box sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2
            }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 60,
                  height: 60,
                  mr: 2
                }}
              >
                <AssistantIcon sx={{ fontSize: 35, color: "white" }} />
              </Avatar>
              <Typography
                variant="h3"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold"
                }}
              >
                Asistente Virtual
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                maxWidth: 600,
                mx: "auto"
              }}
            >
              ¿En qué puedo ayudarte hoy? Escribe tu consulta y te asistiré de la mejor manera posible.
            </Typography>
          </Box>

          {/* Chat Interface */}
          <Paper
            elevation={3}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              bgcolor: "white",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Welcome Message */}
            <Box sx={{
              p: 4,
              bgcolor: "primary.main",
              color: "white"
            }}>
              <Box sx={{
                display: "flex",
                alignItems: "center",
                mb: 2
              }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    width: 40,
                    height: 40,
                    mr: 2
                  }}
                >
                  <AssistantIcon sx={{ color: "white" }} />
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Asistente virtual Sayuri
                </Typography>
              </Box>
              <Typography variant="body1">
                ¡Hola! Soy Sayuri, tu asistente virtual de Banorte. Estoy aquí para ayudarte con cualquier consulta sobre tus finanzas, productos bancarios, o cualquier otra duda que tengas. ¿En qué puedo ayudarte hoy?
              </Typography>
            </Box>

            {/* Input Section */}
            <Box sx={{
              p: 4,
              bgcolor: "white"
            }}>
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  mb: 3,
                  textAlign: "center"
                }}
              >
                Escribe tu consulta
              </Typography>

              <Box sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-start"
              }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Por ejemplo: '¿Cómo puedo consultar mi saldo?', '¿Cuáles son los requisitos para una tarjeta de crédito?', '¿Cómo hago una transferencia?'..."
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
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
                  size="large"
                  disabled
                  sx={{
                    bgcolor: "primary.main",
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    minWidth: "auto",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    }
                  }}
                >
                  <SendIcon sx={{ fontSize: 20 }} />
                </Button>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  textAlign: "center",
                  mt: 2,
                  fontStyle: "italic"
                }}
              >
                Esta funcionalidad estará disponible próximamente
              </Typography>
            </Box>
          </Paper>

          {/* Features Section */}
          <Box sx={{
            mt: 4,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 3
          }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                textAlign: "center",
                border: "2px dashed",
                borderColor: "primary.light",
                bgcolor: "rgba(255,0,0,0.05)"
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}
              >
                💬 Chat Inteligente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Respuestas automáticas a tus preguntas
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                textAlign: "center",
                border: "2px dashed",
                borderColor: "primary.light",
                bgcolor: "rgba(255,0,0,0.05)"
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}
              >
                🔒 Seguridad Total
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tus datos protegidos con la más alta seguridad
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                textAlign: "center",
                border: "2px dashed",
                borderColor: "primary.light",
                bgcolor: "rgba(255,0,0,0.05)"
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}
              >
                ⚡ Respuesta Rápida
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Atención inmediata 24/7
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
