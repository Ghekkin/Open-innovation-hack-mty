# Configuración en Coolify

## Configuración del Frontend

### Opción 1: Usando Dockerfile (RECOMENDADO)

1. En Coolify, ve a tu aplicación frontend
2. En **General**:
   - **Base Directory**: `frontend`
   - **Build Pack**: `dockerfile`
   - **Dockerfile Location**: `Dockerfile`
   - **Port**: `3000`

3. En **Environment Variables**, agrega:
   ```bash
   MCP_SERVER_URL=https://tu-backend-url.com
   NODE_ENV=production
   ```

### Opción 2: Usando Nixpacks

1. En Coolify, ve a tu aplicación frontend
2. En **General**:
   - **Base Directory**: `frontend`
   - **Build Pack**: `nixpacks`
   - **Port**: `3000`

3. Asegúrate de que el archivo `frontend/nixpacks.toml` exista

## Variables de Entorno Requeridas

### Frontend (Next.js)

En la configuración del frontend en Coolify, necesitas agregar la siguiente variable de entorno:

```bash
MCP_SERVER_URL=https://tu-backend-url.com
```

**Importante:** 
- Reemplaza `https://tu-backend-url.com` con la URL real de tu backend desplegado en Coolify
- NO incluyas `/mcp` al final, el código ya lo agrega automáticamente
- Debe ser la URL completa con `https://`

Ejemplo:
```bash
MCP_SERVER_URL=https://backend-banorte.coolify.app
```

### Backend (Python/FastMCP)

El backend ya está configurado para usar las variables de entorno de Coolify:

```python
port = int(os.getenv("PORT", 8080))  # Coolify asigna el puerto automáticamente
host = os.getenv("HOST", "0.0.0.0")
```

Variables de entorno necesarias en el backend:
```bash
# Base de datos (ya configuradas según tu código)
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/database

# Puerto (Coolify lo asigna automáticamente)
PORT=8080

# Host
HOST=0.0.0.0
```

## Pasos para Configurar en Coolify

### 1. Backend

1. Ve a tu aplicación backend en Coolify
2. Ve a la sección "Environment Variables"
3. Asegúrate de que estén configuradas:
   - `DATABASE_URL` (con la conexión a tu base de datos)
   - `PORT` (opcional, Coolify lo asigna automáticamente)
   - `HOST` (opcional, por defecto es 0.0.0.0)

4. Guarda y redeploy el backend

### 2. Frontend

1. Ve a tu aplicación frontend en Coolify
2. Ve a la sección "Environment Variables"
3. Agrega:
   ```
   MCP_SERVER_URL=https://[URL-DE-TU-BACKEND]
   ```
   
4. Ejemplo real:
   ```
   MCP_SERVER_URL=https://backend-banorte-mcp.coolify.app
   ```

5. Guarda y redeploy el frontend

### 3. Verificación

Después de desplegar ambos:

1. Verifica que el backend esté corriendo:
   ```bash
   curl https://tu-backend-url.com/health
   ```

2. Verifica los logs del frontend en Coolify:
   - Busca: `[Financial Plan API] URL del servidor MCP:`
   - Debe mostrar la URL correcta de tu backend

3. Prueba la funcionalidad:
   - Ve a "Plan Financiero" en el dashboard
   - Intenta generar un plan
   - Revisa los logs en Coolify si hay errores

## Troubleshooting

### Error 404 al generar plan financiero

**Causa:** La variable `MCP_SERVER_URL` no está configurada o está mal configurada.

**Solución:**
1. Verifica que `MCP_SERVER_URL` esté en las variables de entorno del frontend
2. Verifica que la URL sea correcta (sin `/mcp` al final)
3. Verifica que el backend esté corriendo y accesible
4. Redeploy el frontend después de cambiar las variables

### Error de conexión

**Causa:** El backend no está accesible o hay problemas de red.

**Solución:**
1. Verifica que el backend esté desplegado y corriendo
2. Verifica que el puerto esté abierto en Coolify
3. Verifica que no haya problemas de CORS
4. Revisa los logs del backend en Coolify

### El plan no se genera pero no hay error

**Causa:** El backend está respondiendo pero hay un error en la lógica.

**Solución:**
1. Revisa los logs del backend en Coolify
2. Busca errores de Python o de la base de datos
3. Verifica que la base de datos esté accesible desde el backend
4. Verifica que el usuario tenga datos históricos (si usa datos guardados)

## Verificación Rápida

Ejecuta este comando para verificar que todo esté configurado:

```bash
# En el frontend (local o en Coolify)
echo $MCP_SERVER_URL
# Debe mostrar: https://tu-backend-url.com

# Verifica que el backend responda
curl https://tu-backend-url.com/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## Arquitectura de Despliegue

```
┌─────────────────────────────────────────┐
│         Coolify (Producción)            │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   Backend    │  │
│  │   (Next.js)  │    │  (FastMCP)   │  │
│  │              │    │              │  │
│  │ MCP_SERVER_  │    │   PORT=8080  │  │
│  │ URL=backend  │    │   HOST=0.0.0 │  │
│  └──────────────┘    └──────┬───────┘  │
│                             │           │
│                      ┌──────▼───────┐   │
│                      │  PostgreSQL  │   │
│                      │  (Database)  │   │
│                      └──────────────┘   │
└─────────────────────────────────────────┘
```

## Notas Importantes

1. **Seguridad:** Asegúrate de que las URLs usen HTTPS en producción
2. **CORS:** El backend debe permitir requests del frontend
3. **Timeouts:** Los planes financieros pueden tardar unos segundos en generarse
4. **Logs:** Siempre revisa los logs en Coolify para debugging
5. **Cache:** Si cambias variables de entorno, haz un redeploy completo

## Contacto

Si tienes problemas con la configuración:
1. Revisa los logs en Coolify (tanto frontend como backend)
2. Verifica las variables de entorno
3. Prueba la conexión manualmente con curl
4. Contacta al equipo de desarrollo con los logs

