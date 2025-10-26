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
  Tooltip
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  VolumeUp as VolumeUpIcon,
  StopCircle as StopCircleIcon,
  Phone as PhoneIcon,
  CallEnd as CallEndIcon
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

const ELEVENLABS_API_KEY = "5ab2b24e65cff23cc1ef0da942133d90";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice

export default function AsistentePage() {
  const [inputValue, setInputValue] = useState("");
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false); // Nuevo: modo conversación
  const [isListening, setIsListening] = useState(false); // Nuevo: escuchando en llamada
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const conversationRecognitionRef = useRef<any>(null); // Para el modo llamada
  const isInCallRef = useRef<boolean>(false); // Ref para el estado de llamada (siempre actualizado)

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

  // Función para enviar mensaje y obtener respuesta (usada en modo llamada)
  const sendMessageAndGetResponse = async (messageText: string) => {
    console.log('[Llamada] Enviando mensaje:', messageText);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const user = getCurrentUser();
      
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      console.log('[Llamada] Haciendo fetch a API...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          conversationHistory: conversationHistory,
          userInfo: user ? {
            username: user.username,
            type: user.type,
            userId: user.userId
          } : null
        })
      });

      const data = await response.json();
      console.log('[Llamada] Respuesta recibida:', data.response?.substring(0, 50) + '...');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'No se pudo generar una respuesta',
        sender: "assistant",
        timestamp: new Date(),
        rawJson: data.rawJson
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      
      // Reproducir la respuesta automáticamente con audio
      console.log('[Llamada] Reproduciendo audio de respuesta...');
      
      // No usar await aquí para no bloquear
      playMessageAudioDirect(assistantMessage.content)
        .then(() => {
          console.log('[Llamada] Audio completado exitosamente');
          // Pequeño delay antes de reiniciar la escucha
          setTimeout(() => {
            if (isInCallRef.current) {
              console.log('[Llamada] Reiniciando escucha automáticamente...');
              startConversationListening();
            } else {
              console.log('[Llamada] No se reinicia escucha - llamada terminada');
            }
          }, 300);
        })
        .catch((audioError) => {
          console.error('[Llamada] Error al reproducir audio:', audioError);
          // Incluso si falla el audio, reiniciar la escucha
          setTimeout(() => {
            if (isInCallRef.current) {
              console.log('[Llamada] Reiniciando escucha después de error de audio...');
              startConversationListening();
            }
          }, 500);
        });
      
    } catch (error) {
      console.error('[Llamada] Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un error al procesar tu consulta.',
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      
      // Reintentar escuchar incluso si hay error
      setTimeout(() => {
        if (isInCallRef.current) {
          console.log('[Llamada] Reiniciando escucha después de error general...');
          startConversationListening();
        }
      }, 1000);
    }
  };

  // Función para iniciar el modo conversación (llamada)
  const startConversation = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari.');
      return;
    }

    console.log('[Conversación] Iniciando modo llamada');
    setIsInCall(true);
    isInCallRef.current = true;
    
    // Pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      startConversationListening();
    }, 100);
  };

  // Función para iniciar la escucha en modo conversación
  const startConversationListening = () => {
    // Verificar que aún estamos en llamada usando la ref
    if (!isInCallRef.current) {
      console.log('[Escucha] No se inicia porque ya no estamos en llamada');
      return;
    }
    
    // Si ya hay un recognition activo, detenerlo primero
    if (conversationRecognitionRef.current) {
      console.log('[Escucha] Deteniendo reconocimiento anterior...');
      try {
        conversationRecognitionRef.current.stop();
      } catch (e) {
        console.log('[Escucha] Error al detener reconocimiento anterior:', e);
      }
      conversationRecognitionRef.current = null;
    }
    
    console.log('[Escucha] Iniciando nuevo reconocimiento de voz...');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-MX';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('[Escucha] Reconocimiento iniciado - Puedes hablar ahora');
      setIsListening(true);
    };
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      console.log('[Escucha] Usuario dijo:', transcript, '(confianza:', confidence, ')');
      setIsListening(false);
      
      // Detener el reconocimiento inmediatamente
      recognition.stop();
      conversationRecognitionRef.current = null;
      
      // Enviar el mensaje automáticamente (esto manejará el reinicio de la escucha)
      await sendMessageAndGetResponse(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('[Escucha] Error en reconocimiento de voz:', event.error);
      setIsListening(false);
      conversationRecognitionRef.current = null;
      
      // Solo reintentar si es un error recuperable y aún estamos en llamada
      if (isInCallRef.current && event.error !== 'aborted' && event.error !== 'no-speech') {
        console.log('[Escucha] Reintentando en 1 segundo...');
        setTimeout(() => {
          if (isInCallRef.current) {
            startConversationListening();
          }
        }, 1000);
      } else if (event.error === 'no-speech' && isInCallRef.current) {
        // Si no se detectó voz, reiniciar inmediatamente
        console.log('[Escucha] No se detectó voz, reintentando...');
        setTimeout(() => {
          if (isInCallRef.current) {
            startConversationListening();
          }
        }, 500);
      }
    };
    
    recognition.onend = () => {
      console.log('[Escucha] Reconocimiento terminado');
      setIsListening(false);
    };
    
    conversationRecognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('[Escucha] Error al iniciar reconocimiento:', e);
      setIsListening(false);
      conversationRecognitionRef.current = null;
      // Reintentar
      setTimeout(() => {
        if (isInCallRef.current) {
          startConversationListening();
        }
      }, 1000);
    }
  };

  // Función para terminar el modo conversación
  const endConversation = () => {
    console.log('[Conversación] Terminando modo llamada');
    setIsInCall(false);
    isInCallRef.current = false;
    setIsListening(false);
    
    if (conversationRecognitionRef.current) {
      try {
        conversationRecognitionRef.current.stop();
      } catch (e) {
        console.log('[Conversación] Error al detener reconocimiento:', e);
      }
      conversationRecognitionRef.current = null;
    }
    
    stopAudio();
  };

  // Función para grabar mensaje individual (botón de micrófono en input)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'es-MX';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
          setIsRecording(true);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsRecording(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Error:', event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        alert('Tu navegador no soporta reconocimiento de voz.');
      }
    }
  };

  // Función para reproducir texto con ElevenLabs TTS (modo llamada)
  const playMessageAudioDirect = async (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      let resolved = false;
      
      try {
        console.log('[Audio] Limpiando texto para TTS...');
        const cleanText = text
          .replace(/<[^>]*>/g, '')
          .replace(/\*\*/g, '')
          .replace(/\n/g, ' ')
          .trim();

        if (!cleanText) {
          console.log('[Audio] Texto vacío, omitiendo reproducción');
          resolve();
          return;
        }

        console.log('[Audio] Texto limpio:', cleanText.substring(0, 100) + '...');
        console.log('[Audio] Llamando a ElevenLabs API...');
        
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text: cleanText,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Audio] Error de API:', response.status, errorText);
          throw new Error(`Error al generar audio: ${response.status}`);
        }

        console.log('[Audio] Audio recibido de ElevenLabs, creando blob...');
        const audioBlob = await response.blob();
        console.log('[Audio] Blob size:', audioBlob.size, 'bytes');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        console.log('[Audio] Configurando eventos del audio...');
        
        audio.onloadeddata = () => {
          console.log('[Audio] Audio cargado, duración:', audio.duration, 'segundos');
        };
        
        audio.onended = () => {
          console.log('[Audio] Evento onended disparado - Audio terminado');
          if (!resolved) {
            resolved = true;
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            resolve();
          }
        };
        
        audio.onerror = (e) => {
          console.error('[Audio] Error al reproducir:', e);
          if (!resolved) {
            resolved = true;
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            reject(new Error('Error al reproducir audio'));
          }
        };
        
        // Fallback: si el evento onended no se dispara por alguna razón
        audio.onpause = () => {
          console.log('[Audio] Audio pausado');
          // Si el audio termina naturalmente (currentTime === duration), resolver
          if (audio.ended && !resolved) {
            console.log('[Audio] Audio terminado (detectado en onpause)');
            resolved = true;
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            resolve();
          }
        };
        
        currentAudioRef.current = audio;
        console.log('[Audio] Iniciando reproducción...');
        
        try {
          await audio.play();
          console.log('[Audio] Reproducción iniciada exitosamente, esperando que termine...');
        } catch (playError) {
          console.error('[Audio] Error en play():', playError);
          if (!resolved) {
            resolved = true;
            reject(playError);
          }
        }
        
      } catch (error) {
        console.error('[Audio] Error general:', error);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      }
    });
  };

  // Función para reproducir mensaje con ElevenLabs TTS (botón en mensajes)
  const playMessageAudio = async (messageId: string, text: string) => {
    if (isPlayingAudio === messageId) {
      stopAudio();
      return;
    }

    stopAudio();

    try {
      setIsPlayingAudio(messageId);
      
      const cleanText = text
        .replace(/<[^>]*>/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n/g, ' ');

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlayingAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlayingAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      currentAudioRef.current = audio;
      await audio.play();
      
    } catch (error) {
      console.error('Error al reproducir audio:', error);
      setIsPlayingAudio(null);
    }
  };

  // Función para detener el audio actual
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsPlayingAudio(null);
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
                  <Box sx={{ position: 'relative' }}>
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
                    
                    {/* Botón de reproducir audio para mensajes del asistente */}
                    {message.sender === "assistant" && (
                      <Tooltip title={isPlayingAudio === message.id ? "Detener audio" : "Escuchar mensaje"}>
                        <IconButton
                          size="small"
                          onClick={() => playMessageAudio(message.id, message.content)}
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.3)',
                            },
                            width: 28,
                            height: 28
                          }}
                        >
                          {isPlayingAudio === message.id ? (
                            <StopCircleIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <VolumeUpIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

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
          {/* Indicador de estado de llamada */}
          {isInCall && (
            <Box sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 1.5,
              bgcolor: isListening ? "success.50" : "grey.50",
              p: 1.5,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: isListening ? "success.main" : "grey.300"
            }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: isListening ? "success.main" : "grey.500",
                animation: isListening ? "blink 1.5s infinite" : "none",
                "@keyframes blink": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.3 }
                }
              }} />
              <Typography
                variant="body2"
                sx={{
                  color: isListening ? "success.dark" : "grey.700",
                  fontWeight: 600
                }}
              >
                {isListening ? "🎤 Escuchando..." : isLoading ? "⏳ Procesando respuesta..." : "🔇 En espera"}
              </Typography>
            </Box>
          )}
          
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
                placeholder={isRecording ? "Escuchando..." : "Envía un mensaje a Maya..."}
                disabled={isLoading || isRecording || isInCall}
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
              
              {/* Botón de micrófono (mensaje individual) */}
              <Tooltip title={isRecording ? "Detener grabación" : "Grabar mensaje de voz"}>
                <IconButton
                  onClick={toggleRecording}
                  disabled={isLoading || isInCall}
                  sx={{
                    bgcolor: isRecording ? "error.main" : "grey.100",
                    color: isRecording ? "white" : "grey.600",
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    animation: isRecording ? "pulse 1.5s infinite" : "none",
                    "@keyframes pulse": {
                      "0%": {
                        boxShadow: "0 0 0 0 rgba(244, 67, 54, 0.7)"
                      },
                      "70%": {
                        boxShadow: "0 0 0 10px rgba(244, 67, 54, 0)"
                      },
                      "100%": {
                        boxShadow: "0 0 0 0 rgba(244, 67, 54, 0)"
                      }
                    },
                    "&:hover": {
                      bgcolor: isRecording ? "error.dark" : "grey.200",
                      transform: !isLoading ? "scale(1.05)" : "none"
                    },
                    "&:disabled": {
                      bgcolor: "grey.200",
                      color: "grey.400"
                    }
                  }}
                >
                  {isRecording ? (
                    <StopIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  ) : (
                    <MicIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Botón de llamada (conversación continua) */}
              <Tooltip title={isInCall ? "Terminar conversación" : "Iniciar conversación continua"}>
                <IconButton
                  onClick={isInCall ? endConversation : startConversation}
                  disabled={isLoading && !isInCall}
                  sx={{
                    bgcolor: isInCall ? "error.main" : "success.main",
                    color: "white",
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    animation: isListening ? "pulse-green 1.5s infinite" : "none",
                    "@keyframes pulse-green": {
                      "0%": {
                        boxShadow: "0 0 0 0 rgba(76, 175, 80, 0.7)"
                      },
                      "70%": {
                        boxShadow: "0 0 0 10px rgba(76, 175, 80, 0)"
                      },
                      "100%": {
                        boxShadow: "0 0 0 0 rgba(76, 175, 80, 0)"
                      }
                    },
                    "&:hover": {
                      bgcolor: isInCall ? "error.dark" : "success.dark",
                      transform: "scale(1.05)"
                    },
                    "&:disabled": {
                      bgcolor: "grey.200",
                      color: "grey.400"
                    }
                  }}
                >
                  {isInCall ? (
                    <CallEndIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  ) : (
                    <PhoneIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Botón de enviar */}
              <IconButton
                type="submit"
                disabled={!inputValue.trim() || isLoading || isInCall}
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

