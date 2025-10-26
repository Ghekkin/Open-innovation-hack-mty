# Debug de Conversación por Voz

## Cómo probar:

1. Abre http://localhost:3000/dashboard/asistente
2. **Abre la consola del navegador** (F12 o clic derecho -> Inspeccionar -> Console)
3. Presiona el **botón verde de teléfono** (está junto al botón de enviar)
4. Dale permiso al navegador para usar el micrófono
5. Habla tu pregunta en español
6. Observa los logs en la consola

## Logs que deberías ver:

Cuando hablas:
```
[Llamada] Enviando mensaje: tu pregunta aquí
[Llamada] Haciendo fetch a API...
[Llamada] Respuesta recibida: respuesta de Maya...
[Llamada] Reproduciendo audio de respuesta...
[Audio] Limpiando texto para TTS...
[Audio] Texto limpio: ...
[Audio] Llamando a ElevenLabs API...
[Audio] Audio recibido de ElevenLabs, creando blob...
[Audio] Configurando eventos del audio...
[Audio] Iniciando reproducción...
[Audio] Reproducción iniciada exitosamente
[Audio] Audio terminado
[Llamada] Audio completado, reiniciando escucha...
[Llamada] Reiniciando escucha...
Escuchando...
```

## Si no escuchas el audio, revisa:

1. **Permisos del navegador**: Asegúrate de que el navegador tenga permiso para reproducir audio
2. **Volumen**: Verifica que el volumen del sistema esté activado
3. **ElevenLabs API**: Revisa si hay errores relacionados con la API en la consola:
   - Error 401: Problema con la API key
   - Error 429: Límite de uso excedido
   - Error 500: Problema del servidor

4. **Consola del navegador**: Busca cualquier línea que diga "Error" o errores en rojo

## Botones disponibles:

- 🎤 **Gris (Micrófono)**: Graba un solo mensaje (modo tradicional)
- 📞 **Verde (Teléfono)**: Inicia conversación continua
- ❌ **Rojo (Colgar)**: Termina conversación continua
- ➤ **Enviar**: Envía mensaje escrito

## Estados visuales:

Cuando estás en conversación:
- Barra verde con punto parpadeante = 🎤 Escuchando (habla ahora)
- Barra gris = ⏳ Procesando respuesta (espera)
- Botón verde con animación = Está escuchando activamente

