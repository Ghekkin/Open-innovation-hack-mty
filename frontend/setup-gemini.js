#!/usr/bin/env node

/**
 * Script para configurar Google Gemini API Key
 * Uso: node setup-gemini.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Configuración de Google Gemini API');
console.log('=====================================');

rl.question('Ingresa tu API Key de Google Gemini (o presiona Enter para cancelar): ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ Configuración cancelada');
    rl.close();
    return;
  }

  const envPath = path.join(__dirname, '.env.local');
  const envContent = `# Google Gemini API Configuration
# Obtén tu API key en: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=${apiKey.trim()}

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
    console.log('   2. Ve a /dashboard para usar el asistente');
    console.log('');
    console.log('🎉 ¡Tu asistente virtual con IA ya está listo!');
  } catch (error) {
    console.error('❌ Error al crear el archivo:', error.message);
    console.log('');
    console.log('💡 Alternativa manual:');
    console.log('   1. Crea el archivo frontend/.env.local');
    console.log('   2. Agrega esta línea:');
    console.log(`      GEMINI_API_KEY=${apiKey.trim()}`);
    console.log('   3. Reinicia el servidor');
  }

  rl.close();
});
