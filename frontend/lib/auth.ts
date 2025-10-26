// Utilidades de autenticación para el sistema Banorte
import { clearChatHistory } from './chat-storage';

export interface UserInfo {
  username: string;
  type: 'empresa' | 'personal';
  userId: string;
  loginTime: string;
}

/**
 * Valida si un usuario es válido
 */
export const validateUser = (username: string): { 
  valid: boolean; 
  type: 'empresa' | 'personal' | null; 
  error?: string 
} => {
  const trimmedUsername = username.trim().toUpperCase();
  
  // Validar usuarios de empresa (E001 - E025)
  const empresaRegex = /^E0(0[1-9]|1[0-9]|2[0-5])$/;
  if (empresaRegex.test(trimmedUsername)) {
    return { valid: true, type: 'empresa' };
  }
  
  // Validar usuarios personales (1 - 25)
  const personalNumber = parseInt(trimmedUsername);
  if (!isNaN(personalNumber) && personalNumber >= 1 && personalNumber <= 25) {
    return { valid: true, type: 'personal' };
  }
  
  return { 
    valid: false, 
    type: null, 
    error: 'Usuario inválido. Use E001-E025 para empresas o 1-25 para cuentas personales.' 
  };
};

/**
 * Obtiene la información del usuario actual desde localStorage
 */
export const getCurrentUser = (): UserInfo | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('banorte_user');
    if (!userStr) return null;
    
    return JSON.parse(userStr) as UserInfo;
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * Obtiene el tipo de usuario actual
 */
export const getUserType = (): 'empresa' | 'personal' | null => {
  const user = getCurrentUser();
  return user?.type || null;
};

/**
 * Obtiene el ID del usuario para hacer consultas al backend
 */
export const getUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.userId || null;
};

/**
 * Cierra la sesión del usuario y limpia el historial de chat
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  // Obtener el ID del usuario antes de borrar la sesión
  const user = getCurrentUser();
  if (user) {
    // Limpiar el historial de conversación del usuario
    clearChatHistory(user.userId);
    console.log(`[Auth] Historial de chat eliminado para usuario: ${user.userId}`);
  }
  
  // Limpiar datos de sesión
  localStorage.removeItem('banorte_user');
  localStorage.removeItem('banorte_username');
  localStorage.removeItem('banorte_user_type');
  localStorage.removeItem('banorte_user_id');
  localStorage.removeItem('banorte_login_time');
  
  console.log('[Auth] Sesión cerrada exitosamente');
};

/**
 * Guarda la información del usuario en localStorage
 */
export const saveUserInfo = (username: string, type: 'empresa' | 'personal'): void => {
  const userInfo: UserInfo = {
    username: username.trim().toUpperCase(),
    type: type,
    loginTime: new Date().toISOString(),
    userId: type === 'empresa' ? username.trim().toUpperCase() : username.trim()
  };
  
  localStorage.setItem('banorte_user', JSON.stringify(userInfo));
  localStorage.setItem('banorte_username', userInfo.username);
  localStorage.setItem('banorte_user_type', type);
  localStorage.setItem('banorte_user_id', userInfo.userId);
  localStorage.setItem('banorte_login_time', userInfo.loginTime);
};

/**
 * Formatea el nombre del usuario para mostrar
 */
export const formatUsername = (username: string, type: 'empresa' | 'personal'): string => {
  if (type === 'empresa') {
    return `Empresa ${username}`;
  }
  return `Usuario ${username}`;
};

