"use client";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Container,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Refresh as RefreshIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from "@mui/icons-material";
import { geminiService } from "@/services/geminiService";
import { ChatMessage, GeminiResponse } from "@/types/chat";

export default function Dashboard() {
  // Verificar si la API key está configurada
  const isApiKeyConfigured = process.env.NEXT_PUBLIC_GEMINI_API_KEY &&
    process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key_here';

  if (!isApiKeyConfigured) {
  return (
      <Box sx={{
        flexGrow: 1,
        minHeight: "calc(100vh - 100px)",
        bgcolor: "#f5f5f5",
        py: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 4,
              border: "2px dashed",
              borderColor: "primary.main"
            }}
          >
            <Typography variant="h4" sx={{ color: "primary.main", mb: 3 }}>
              🔧 Configuración Requerida
            </Typography>
            <Typography variant="h6" gutterBottom>
              Google Gemini API Key no configurada
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Para usar el asistente virtual, necesitas configurar tu API key de Google Gemini.
            </Typography>

            <Box sx={{
              bgcolor: "grey.50",
              p: 3,
              borderRadius: 2,
              textAlign: "left",
              mb: 3
            }}>
              <Typography variant="subtitle2" gutterBottom>
                📝 Pasos para configurar:
              </Typography>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                1. Crea el archivo <code>.env.local</code> en la raíz del proyecto frontend
              </Typography>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                2. Agrega esta línea:
              </Typography>
      <Typography
                variant="body2"
                component="div"
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  p: 1,
                  borderRadius: 1,
                  fontFamily: "monospace"
                }}
              >
                NEXT_PUBLIC_GEMINI_API_KEY=tu_api_key_real_aqui
              </Typography>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                3. Reemplaza "tu_api_key_real_aqui" con tu API key de Google
              </Typography>
              <Typography variant="body2" component="div">
                4. Reinicia el servidor de desarrollo
      </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                sx={{ bgcolor: "primary.main" }}
              >
                🔗 Obtener API Key
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                🔄 Reintentar
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Estado del chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "¡Hola! Soy tu asistente virtual de Banorte. Estoy aquí para ayudarte con cualquier consulta sobre tus finanzas, productos bancarios, o cualquier otra duda que tengas. ¿En qué puedo ayudarte hoy?",
      sender: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generar sugerencias basadas en el último mensaje del usuario
  useEffect(() => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === "user");
    if (lastUserMessage && suggestions.length === 0) {
      generateSuggestions(lastUserMessage.content);
    }
  }, [messages]);

  const generateSuggestions = async (query: string) => {
    try {
      const newSuggestions = await geminiService.generateSuggestions(query);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error generando sugerencias:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Analizar sentimiento
      const sentiment = await geminiService.analyzeSentiment(userMessage.content);

      // Generar respuesta
      const response = await geminiService.generateBankingResponse(userMessage.content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "assistant",
        timestamp: new Date(),
        sentiment
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo en unos momentos.",
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        content: "¡Hola! Soy tu asistente virtual de Banorte. ¿En qué puedo ayudarte hoy?",
        sender: "assistant",
        timestamp: new Date()
      }
    ]);
    setSuggestions([]);
  };

  return (
    <Box sx={{
      flexGrow: 1,
      minHeight: "calc(100vh - 100px)",
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
          {/* Chat Header */}
          <Box sx={{
            p: 3,
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
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
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Asistente Banorte
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  En línea - Respuesta en tiempo real
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Limpiar conversación">
              <IconButton onClick={clearChat} sx={{ color: "white" }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Messages Container */}
          <Box sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            maxHeight: "400px"
          }}>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                  mb: 2
                }}
              >
                <Box sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  maxWidth: "70%"
                }}>
                  {message.sender === "assistant" && (
                    <Avatar
                      sx={{
                        bgcolor: "primary.main",
                        width: 32,
                        height: 32,
                        mr: 1,
                        mt: 0.5
                      }}
                    >
                      <AssistantIcon sx={{ fontSize: 16, color: "white" }} />
                    </Avatar>
                  )}
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: message.sender === "user" ? "primary.main" : "grey.100",
                      color: message.sender === "user" ? "white" : "text.primary",
                      borderRadius: message.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px"
                    }}
                  >
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        mt: 1,
                        display: "block",
                        color: message.sender === "user" ? "rgba(255,255,255,0.7)" : "text.secondary"
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Paper>
                  {message.sender === "user" && (
                    <Avatar
                      sx={{
                        bgcolor: "secondary.main",
                        width: 32,
                        height: 32,
                        ml: 1,
                        mt: 0.5
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "white", fontWeight: "bold" }}>
                        Tú
                      </Typography>
                    </Avatar>
                  )}
                </Box>
              </Box>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                mb: 2
              }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 32,
                    height: 32,
                    mr: 1
                  }}
                >
                  <AssistantIcon sx={{ fontSize: 16, color: "white" }} />
                </Avatar>
                <Paper sx={{
                  p: 2,
                  bgcolor: "grey.100",
                  borderRadius: "18px 18px 18px 4px"
                }}>
                  <CircularProgress size={20} sx={{ color: "primary.main" }} />
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                Sugerencias:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    variant="outlined"
                    size="small"
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "primary.light",
                        color: "white"
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Input Section */}
          <Box sx={{
            p: 3,
            borderTop: "1px solid",
            borderColor: "grey.200",
            bgcolor: "white"
          }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-start"
              }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu consulta aquí..."
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
                  disabled={!inputValue.trim() || isLoading}
                  sx={{
                    bgcolor: "primary.main",
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    minWidth: "auto",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "&:disabled": {
                      bgcolor: "grey.300",
                      color: "grey.500"
                    }
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    <SendIcon sx={{ fontSize: 20 }} />
                  )}
                </Button>
              </Box>
            </form>
          </Box>
        </Paper>

        {/* Additional Features Preview */}
        <Box sx={{
          mt: 4,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
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
              💡 Consultas Inteligentes
          </Typography>
            <Typography variant="body2" color="text.secondary">
              Preguntas frecuentes respondidas automáticamente
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
      </Box>
      </Container>
    </Box>
  );
}