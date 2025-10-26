# Configuración de Coolify - Paso a Paso

## 🚨 PROBLEMA ACTUAL

El deployment falla porque Coolify no sabe que el código está en la carpeta `frontend/`.

## ✅ SOLUCIÓN RÁPIDA

### Paso 1: Configurar Base Directory

En la pantalla de **Configuration** → **General** que estás viendo:

1. **Busca un campo llamado uno de estos**:
   - `Base Directory`
   - `Working Directory`
   - `Source Directory`
   - `Root Directory`

2. **Si NO lo ves en "General"**:
   - Haz clic en **"Advanced"** (en el menú lateral izquierdo)
   - Busca ahí el campo

3. **Establece el valor**: `frontend`

4. **Haz clic en "Save"** (botón en la parte superior)

### Paso 2: Verificar Configuración

Asegúrate de que estos campos tengan estos valores:

```
Name: front
Build Pack: Nixpacks
Base Directory: frontend  ← IMPORTANTE
Port: 3000
```

### Paso 3: Redeploy

1. Haz clic en el botón **"Redeploy"** (arriba a la derecha)
2. Espera a que termine el deployment
3. Revisa los logs

## 📋 CONFIGURACIÓN COMPLETA

### General Settings

| Campo | Valor | Descripción |
|-------|-------|-------------|
| **Name** | `front` | Nombre de la aplicación |
| **Build Pack** | `Nixpacks` | Sistema de build |
| **Base Directory** | `frontend` | ⚠️ MUY IMPORTANTE |
| **Port** | `3000` | Puerto de Next.js |
| **Is it a static site?** | ❌ NO | Next.js es dinámico |

### Environment Variables

Agrega estas variables en **Environment Variables**:

```bash
MCP_SERVER_URL=https://tu-backend-url.com
NODE_ENV=production
```

⚠️ **Importante**: Reemplaza `https://tu-backend-url.com` con la URL real de tu backend desplegado.

### Domains

Ya tienes configurado:
```
https://msc0o8cgkks4cgk4o0s844s0.72.60.123.201.sslip.io
https://banortemaya.tech
```

Esto está correcto. ✅

### Direction

Ya tienes configurado:
```
Allow www & non-www
```

Esto está correcto. ✅

## 🔍 VERIFICACIÓN

### Logs que Deberías Ver (Deployment Exitoso)

```
Starting deployment of Ghekkin/Open-innovation-hack-mty:main
Cloning repository...
Changing to directory: /app/frontend  ← Debe mostrar esto
Installing dependencies...
npm ci
Building application...
npm run build
✓ Compiled successfully
Starting application...
npm run start
Server running on port 3000
```

### Logs de Error (Si falta Base Directory)

```
Starting deployment...
Error: Could not find package.json  ← Este es el problema
Container is not running
```

## 🐛 TROUBLESHOOTING

### Problema 1: No encuentro "Base Directory"

**Solución**: Puede estar en diferentes lugares según la versión de Coolify:

1. **General** → Busca en todos los campos
2. **Advanced** → Busca ahí
3. Si no existe, usa la **Solución 2** (Dockerfile)

### Problema 2: El campo Base Directory no funciona

**Solución**: Cambia a usar Dockerfile:

1. En **General** → **Build Pack**: Cambia a `Dockerfile`
2. En **Base Directory**: `frontend`
3. En **Dockerfile Location**: `Dockerfile`
4. **Save** y **Redeploy**

### Problema 3: Build falla con error de memoria

**Solución**: En **Advanced** → **Resource Limits**:
- Memory Limit: `2048` MB
- Memory Swap: `2048` MB

### Problema 4: Variables de entorno no se aplican

**Solución**: 
1. Después de agregar variables, haz un **Redeploy completo**
2. NO uses solo "Restart", usa "Redeploy"

## 📝 CHECKLIST ANTES DE REDEPLOY

Marca cada item antes de hacer redeploy:

- [ ] Base Directory = `frontend`
- [ ] Build Pack = `Nixpacks` o `Dockerfile`
- [ ] Port = `3000`
- [ ] Variable `MCP_SERVER_URL` configurada
- [ ] Variable `NODE_ENV=production` configurada
- [ ] Código pusheado a GitHub
- [ ] Branch = `main`

## 🎯 SIGUIENTE PASO

Una vez que el frontend despliegue correctamente:

1. **Verifica que cargue**: Abre https://banortemaya.tech
2. **Revisa los logs de aplicación**: Configuration → Logs
3. **Prueba la funcionalidad**: Ve al dashboard y prueba el asistente
4. **Verifica la conexión con el backend**: Intenta generar un plan financiero

## 🆘 SI NADA FUNCIONA

Si después de seguir todos estos pasos el deployment sigue fallando:

### Opción A: Deployment Manual con Docker

Puedes deployar manualmente usando Docker:

```bash
# En el servidor de Coolify
cd /path/to/repo
cd frontend
docker build -t frontend-app .
docker run -d -p 3000:3000 \
  -e MCP_SERVER_URL=https://tu-backend-url.com \
  -e NODE_ENV=production \
  frontend-app
```

### Opción B: Verificar Permisos

Verifica que Coolify tenga acceso al repositorio:
1. Configuration → Git Source
2. Verifica que el token de GitHub sea válido
3. Verifica que el repositorio sea accesible

### Opción C: Logs Detallados

Habilita logs detallados:
1. Configuration → Advanced
2. Busca "Debug" o "Verbose Logging"
3. Habilítalo
4. Redeploy y revisa los logs

## 📞 INFORMACIÓN ADICIONAL

### Estructura del Proyecto

```
Open-innovation-hack-mty/
├── backend/              ← Deployment separado
│   └── ...
├── frontend/             ← Este es el Base Directory
│   ├── app/
│   ├── package.json      ← Coolify busca este archivo
│   ├── next.config.ts
│   ├── Dockerfile        ← Para opción Dockerfile
│   └── ...
└── README.md
```

### Archivos Importantes Creados

Ya he creado estos archivos en tu repositorio:

1. ✅ `frontend/Dockerfile` - Para deployment con Docker
2. ✅ `frontend/.dockerignore` - Optimización de build
3. ✅ `frontend/next.config.ts` - Configuración con output standalone
4. ✅ `SOLUCION_DEPLOYMENT_FRONTEND.md` - Guía detallada
5. ✅ Este archivo - Paso a paso

### Próximos Pasos Después del Deployment

1. Configurar SSL/HTTPS (si no está ya)
2. Configurar variables de entorno de producción
3. Probar todas las funcionalidades
4. Configurar monitoring y logs
5. Configurar backups automáticos

## ⚡ RESUMEN EJECUTIVO

**El problema**: Coolify busca `package.json` en la raíz, pero está en `frontend/`

**La solución**: Configurar `Base Directory = frontend` en Coolify

**Dónde**: Configuration → General (o Advanced) → Base Directory

**Valor**: `frontend`

**Después**: Save → Redeploy → Verificar logs

---

**¿Necesitas ayuda?** Comparte:
1. Captura de la configuración General
2. Captura de la configuración Advanced
3. Logs completos del deployment

