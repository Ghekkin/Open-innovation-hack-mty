/**
 * Utilidad para gestionar el historial de conversaciones del chat
 * Cada usuario tiene su propio historial almacenado en localStorage
 */

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  rawJson?: any;
}

const CHAT_HISTORY_PREFIX = "banorte_chat_history_";

/**
 * Obtiene la clave de localStorage para un usuario específico
 */
function getChatStorageKey(userId: string): string {
  return `${CHAT_HISTORY_PREFIX}${userId}`;
}

/**
 * Guarda el historial de conversación de un usuario
 */
export function saveChatHistory(userId: string, messages: ChatMessage[]): void {
  try {
    const key = getChatStorageKey(userId);
    const serializedMessages = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString() // Convertir Date a string
    }));
    localStorage.setItem(key, JSON.stringify(serializedMessages));
    console.log(`[ChatStorage] Historial guardado para usuario ${userId}: ${messages.length} mensajes`);
  } catch (error) {
    console.error("[ChatStorage] Error al guardar historial:", error);
  }
}

/**
 * Carga el historial de conversación de un usuario
 */
export function loadChatHistory(userId: string): ChatMessage[] {
  try {
    const key = getChatStorageKey(userId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      console.log(`[ChatStorage] No hay historial para usuario ${userId}`);
      return [];
    }
    
    const parsed = JSON.parse(stored);
    const messages = parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp) // Convertir string a Date
    }));
    
    console.log(`[ChatStorage] Historial cargado para usuario ${userId}: ${messages.length} mensajes`);
    return messages;
  } catch (error) {
    console.error("[ChatStorage] Error al cargar historial:", error);
    return [];
  }
}

/**
 * Elimina el historial de conversación de un usuario específico
 */
export function clearChatHistory(userId: string): void {
  try {
    const key = getChatStorageKey(userId);
    localStorage.removeItem(key);
    console.log(`[ChatStorage] Historial eliminado para usuario ${userId}`);
  } catch (error) {
    console.error("[ChatStorage] Error al eliminar historial:", error);
  }
}

/**
 * Elimina todo el historial de conversaciones (todos los usuarios)
 */
export function clearAllChatHistories(): void {
  try {
    const keys = Object.keys(localStorage);
    const chatKeys = keys.filter(key => key.startsWith(CHAT_HISTORY_PREFIX));
    
    chatKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[ChatStorage] Todos los historiales eliminados (${chatKeys.length} usuarios)`);
  } catch (error) {
    console.error("[ChatStorage] Error al eliminar todos los historiales:", error);
  }
}

/**
 * Obtiene el tamaño del historial en KB
 */
export function getChatHistorySize(userId: string): number {
  try {
    const key = getChatStorageKey(userId);
    const stored = localStorage.getItem(key);
    
    if (!stored) return 0;
    
    // Calcular tamaño en KB
    const sizeInBytes = new Blob([stored]).size;
    const sizeInKB = sizeInBytes / 1024;
    
    return Math.round(sizeInKB * 100) / 100; // Redondear a 2 decimales
  } catch (error) {
    console.error("[ChatStorage] Error al calcular tamaño:", error);
    return 0;
  }
}

/**
 * Verifica si hay espacio suficiente en localStorage
 * Retorna true si hay espacio, false si está cerca del límite
 */
export function hasStorageSpace(): boolean {
  try {
    // Intentar estimar el uso de localStorage
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    // localStorage típicamente tiene ~5MB = 5242880 bytes
    // Alertar si está usando más del 80%
    const limitBytes = 5242880;
    const usagePercent = (totalSize / limitBytes) * 100;
    
    console.log(`[ChatStorage] Uso de localStorage: ${usagePercent.toFixed(2)}%`);
    
    return usagePercent < 80;
  } catch (error) {
    console.error("[ChatStorage] Error al verificar espacio:", error);
    return true; // Asumir que hay espacio en caso de error
  }
}

