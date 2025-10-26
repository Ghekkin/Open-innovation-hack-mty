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
  IconButton
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon
} from "@mui/icons-material";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  rawJson?: any;
}

export default function AsistentePage() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "¡Hola! Soy Maya, tu asistente virtual de Banorte. Estoy aquí para ayudarte con todas tus consultas financieras, desde saldos hasta recomendaciones personalizadas. ¿En qué puedo ayudarte hoy?",
      sender: "assistant",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content })
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
              Maya - Asistente Virtual Banorte
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
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: 1.6,
                        fontSize: { xs: "0.9rem", sm: "1rem" }
                      }}
                    >
                      {message.content}
                    </Typography>
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
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
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

