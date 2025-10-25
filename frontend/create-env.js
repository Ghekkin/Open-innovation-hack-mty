#!/usr/bin/env node

/**
 * Script para crear el archivo .env.local con la API key de Gemini
 * Uso: node create-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando API Key de Google Gemini...');
console.log('=====================================');

// API Key del usuario
const API_KEY = 'AIzaSyA7ulbb1wr_tv6imm8VlrhgARKH8RCRtOs';

const envPath = path.join(__dirname, '.env.local');
const envContent = `# Google Gemini API Configuration
# Tu API key de Gemini ya está configurada
GEMINI_API_KEY=${API_KEY}

# ¡Tu API key está configurada y lista para usar!
# El asistente virtual con IA ya debería funcionar
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env.local creado exitosamente!');
  console.log('📍 Ubicación:', envPath);
  console.log('');
  console.log('🔄 Pasos siguientes:');
  console.log('   1. Reinicia el servidor de desarrollo: npm run dev');
  console.log('   2. Ve a /dashboard para usar el asistente virtual');
  console.log('');
  console.log('🎉 ¡Tu asistente virtual con IA ya está listo!');
  console.log('');
  console.log('📝 Tu API Key:', API_KEY);
} catch (error) {
  console.error('❌ Error al crear el archivo:', error.message);
  console.log('');
  console.log('💡 Alternativa manual:');
  console.log('   1. Crea el archivo frontend/.env.local');
  console.log('   2. Agrega estas líneas:');
  console.log('      # Google Gemini API Configuration');
  console.log('      # Tu API key de Gemini ya está configurada');
  console.log(`      GEMINI_API_KEY=${API_KEY}`);
  console.log('   3. Reinicia el servidor');
}
