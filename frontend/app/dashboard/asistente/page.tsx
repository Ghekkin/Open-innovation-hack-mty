"use client";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Avatar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon
} from "@mui/icons-material";
import { getCurrentUser } from "@/lib/auth";
import { 
  saveChatHistory, 
  loadChatHistory, 
  type ChatMessage 
} from "@/lib/chat-storage";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  rawJson?: any;
}

export default function AsistentePage() {
  const [inputValue, setInputValue] = useState("");
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Cargar historial de conversación al montar el componente
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
      setUserId(user.userId);
      
      // Intentar cargar historial previo
      const history = loadChatHistory(user.userId);
      
      if (history.length > 0) {
        // Si hay historial, usarlo
        console.log(`[Asistente] Historial cargado: ${history.length} mensajes`);
        setMessages(history);
      } else {
        // Si no hay historial, crear mensaje de bienvenida
        const welcomeMessage: Message = {
          id: "welcome_" + Date.now(),
          content: `¡Hola ${user.username}! Soy Maya, tu asistente financiera de Banorte. Puedo ayudarte con análisis de balance, gastos, proyecciones y recomendaciones financieras ${user.type === 'empresa' ? 'para tu empresa' : 'personales'}. ¿En qué puedo ayudarte hoy?`,
          sender: "assistant",
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        // Guardar el mensaje de bienvenida
        saveChatHistory(user.userId, [welcomeMessage]);
      }
      
      setHistoryLoaded(true);
    }
  }, []);

  // Guardar automáticamente el historial cada vez que cambian los mensajes
  useEffect(() => {
    // Solo guardar después de que el historial inicial se haya cargado
    if (historyLoaded && userId && messages.length > 0) {
      saveChatHistory(userId, messages);
      console.log(`[Asistente] Historial guardado: ${messages.length} mensajes`);
    }
  }, [messages, userId, historyLoaded]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const user = getCurrentUser();
      
      // Preparar el historial de conversación (sin el mensaje actual que ya está en messages)
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          conversationHistory: conversationHistory,
          userInfo: user ? {
            username: user.username,
            type: user.type,
            userId: user.userId
          } : null
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'No se pudo generar una respuesta',
        sender: "assistant",
        timestamp: new Date(),
        rawJson: data.rawJson
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.',
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 64px)",
      bgcolor: "background.default",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Messages Area - Estilo burbujas */}
      <Box sx={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        px: { xs: 1, sm: 2 },
        py: { xs: 2, sm: 3 },
        pb: { xs: "90px", sm: "120px" },
        WebkitOverflowScrolling: "touch"
      }}>
        {messages.length === 1 && (
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            px: { xs: 2, sm: 4 }
          }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                mb: { xs: 2, sm: 3 }
              }}
            >
              <AssistantIcon sx={{ fontSize: { xs: 35, sm: 45 }, color: "white" }} />
            </Avatar>
            <Typography
              variant="h3"
              sx={{
                color: "primary.main",
                fontWeight: "bold",
                mb: 2,
                textAlign: "center",
                fontSize: { xs: "1.75rem", sm: "3rem" }
              }}
            >
              Maya - Tu Asistente Financiera
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "grey.500",
                textAlign: "center",
                maxWidth: 600,
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}
            >
              ¿En qué puedo ayudarte hoy? - Maya
            </Typography>
          </Box>
        )}

        <Box sx={{ maxWidth: { xs: "100%", sm: "900px" }, mx: "auto" }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: "flex",
                justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                mb: { xs: 2, sm: 3 },
                px: { xs: 1, sm: 2 }
              }}
            >
              <Box sx={{
                display: "flex",
                gap: { xs: 1, sm: 2 },
                maxWidth: { xs: "90%", sm: "75%" },
                alignItems: "flex-start",
                flexDirection: message.sender === "user" ? "row-reverse" : "row"
              }}>
                {/* Avatar */}
                <Avatar
                  sx={{
                    bgcolor: message.sender === "user" ? "grey.500" : "primary.main",
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    flexShrink: 0
                  }}
                >
                  {message.sender === "user" ? (
                    <PersonIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  ) : (
                    <AssistantIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  )}
                </Avatar>

                {/* Bubble */}
                <Box sx={{ flex: 1 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: message.sender === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                      bgcolor: message.sender === "user" ? "grey.200" : "primary.main",
                      color: message.sender === "user" ? "text.primary" : "white"
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: 1.6,
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        '& strong': {
                          fontWeight: 700,
                          textDecoration: message.sender === "user" ? "none" : "underline",
                          color: message.sender === "user" ? "primary.main" : "white"
                        }
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </Paper>

                  {/* JSON Accordion */}
                  {message.rawJson && (
                    <Accordion
                      sx={{
                        mt: 1,
                        boxShadow: "none",
                        border: "1px solid",
                        borderColor: "grey.200",
                        borderRadius: "12px",
                        "&:before": { display: "none" },
                        overflow: "hidden"
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          minHeight: "auto",
                          "& .MuiAccordionSummary-content": {
                            my: 1
                          }
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "grey.500", fontWeight: 500 }}>
                          📄 Ver respuesta JSON de la API
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <Box
                          sx={{
                            bgcolor: "#1E1E1E",
                            color: "#D4D4D4",
                            p: 2,
                            maxHeight: "300px",
                            overflowY: "auto",
                            fontFamily: "monospace",
                            fontSize: "0.7rem"
                          }}
                        >
                          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {JSON.stringify(message.rawJson, null, 2)}
                          </pre>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      color: "grey.500",
                      mt: 0.5,
                      display: "block",
                      textAlign: message.sender === "user" ? "right" : "left"
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{
              display: "flex",
              justifyContent: "flex-start",
              mb: 3,
              px: 2
            }}>
              <Box sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-start"
              }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 36,
                    height: 36
                  }}
                >
                  <AssistantIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2.5,
                    borderRadius: "20px 20px 20px 4px",
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <CircularProgress size={16} sx={{ color: "white" }} />
                  <Typography variant="body2" sx={{ color: "white" }}>
                    Escribiendo...
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Input Area - Fixed at bottom */}
      <Box sx={{
        position: { xs: "fixed", sm: "absolute" },
        bottom: { xs: '87px', sm: 0 },
        left: { xs: 0, sm: 'auto' },
        right: { xs: 0, sm: 0 },
        borderTop: "1px solid",
        borderColor: "grey.200",
        bgcolor: "background.paper",
        py: { xs: 1.5, sm: 2.5 },
        zIndex: 1000,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)"
      }}>
        <Box sx={{
          maxWidth: { xs: "100%", sm: "900px" },
          mx: "auto",
          px: { xs: 2, sm: 4 }
        }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{
              display: "flex",
              gap: { xs: 1, sm: 2 },
              alignItems: "flex-end",
              bgcolor: "white",
              borderRadius: { xs: "20px", sm: "24px" },
              p: { xs: 1, sm: 1.5 },
              border: "2px solid",
              borderColor: inputValue.trim() ? "primary.main" : "grey.200",
              boxShadow: inputValue.trim() ? "0 0 0 3px rgba(236, 0, 41, 0.1)" : "none",
              transition: "all 0.2s ease"
            }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Envía un mensaje a Maya..."
                disabled={isLoading}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: { xs: "0.9rem", sm: "0.95rem" },
                    px: { xs: 0.5, sm: 1 },
                    "& textarea": {
                      "&::placeholder": {
                        color: "grey.500",
                        opacity: 1
                      }
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <IconButton
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                sx={{
                  bgcolor: inputValue.trim() && !isLoading ? "primary.main" : "grey.200",
                  color: "white",
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: inputValue.trim() && !isLoading ? "primary.dark" : "grey.300",
                    transform: inputValue.trim() && !isLoading ? "scale(1.05)" : "none"
                  },
                  "&:disabled": {
                    bgcolor: "grey.200",
                    color: "grey.500"
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={18} sx={{ color: "grey.500" }} />
                ) : (
                  <SendIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                )}
              </IconButton>
            </Box>
          </form>
          <Typography
            variant="caption"
            sx={{
              color: "grey.500",
              textAlign: "center",
              display: { xs: "none", sm: "block" },
              mt: 1.5,
              fontSize: "0.75rem"
            }}
          >
            Maya puede cometer errores. Verifica información importante.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

