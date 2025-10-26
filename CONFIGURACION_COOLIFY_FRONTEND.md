# 🚀 Configuración Frontend en Coolify - GUÍA RÁPIDA

## ⚠️ PROBLEMA ACTUAL
El deployment falla porque **falta configurar el Base Directory en Coolify**.

## ✅ SOLUCIÓN INMEDIATA

### 1️⃣ Hacer Push de los Nuevos Archivos

Primero, sube los archivos que acabo de crear:

```powershell
git add frontend/Dockerfile
git add frontend/.dockerignore
git add frontend/next.config.ts
git add CONFIGURACION_COOLIFY.md
git add SOLUCION_DEPLOYMENT_FRONTEND.md
git add CONFIGURACION_COOLIFY_FRONTEND.md
git commit -m "fix: Agregar Dockerfile y configuración para Coolify"
git push origin main
```

### 2️⃣ Configurar en Coolify

Ve a: **Coolify → Tu Aplicación Frontend → Configuration → General**

Configura EXACTAMENTE así:

```
┌─────────────────────────────────────────────┐
│ General Configuration                        │
├─────────────────────────────────────────────┤
│                                              │
│ Source                                       │
│ ├─ Repository: Ghekkin/Open-innovation...   │
│ ├─ Branch: main                              │
│ └─ Base Directory: frontend          ← ⚠️   │
│                                              │
│ Build Configuration                          │
│ ├─ Build Pack: dockerfile            ← ⚠️   │
│ ├─ Dockerfile Location: Dockerfile   ← ⚠️   │
│ └─ Port: 3000                        ← ⚠️   │
│                                              │
│ Publish Directory: [dejar vacío]            │
│                                              │
└─────────────────────────────────────────────┘
```

**⚠️ CRÍTICO:** El campo **"Base Directory"** DEBE ser `frontend`

### 3️⃣ Configurar Variables de Entorno

Ve a: **Coolify → Tu Aplicación Frontend → Configuration → Environment Variables**

Agrega estas variables:

```bash
MCP_SERVER_URL=https://tu-backend-url.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Importante:** Reemplaza `https://tu-backend-url.com` con la URL real de tu backend desplegado.

### 4️⃣ Redeploy

1. Click en **"Redeploy"**
2. Espera a que termine
3. Revisa los logs

## 📋 Checklist Antes de Redeploy

Marca cada item:

- [ ] Hice `git push` de los nuevos archivos
- [ ] En Coolify, configuré **Base Directory: `frontend`**
- [ ] En Coolify, configuré **Build Pack: `dockerfile`**
- [ ] En Coolify, configuré **Port: `3000`**
- [ ] Agregué la variable `MCP_SERVER_URL` con la URL correcta del backend
- [ ] Click en "Redeploy"

## 🎯 Lo Que Debería Pasar

### Durante el Build (en los logs):
```
[+] Building...
 => [internal] load build definition from Dockerfile
 => [stage-0 1/5] FROM node:20-alpine
 => [stage-1 2/6] COPY package*.json ./
 => [stage-1 3/6] RUN npm ci
 => [stage-1 4/6] COPY . .
 => [stage-1 5/6] RUN npm run build
 => exporting to image
 => => naming to docker.io/library/...
```

### Al Iniciar (en los logs):
```
> next start
ready - started server on 0.0.0.0:3000
```

## 🔍 Verificación

Después del deployment exitoso:

1. **Abre la URL de tu frontend** en Coolify
2. Deberías ver la página de inicio
3. Ve al Dashboard
4. Verifica que funcione correctamente

## ❌ Si Sigue Fallando

### Error: "Base directory not found"
- Verifica que escribiste `frontend` (sin `/` al inicio ni al final)
- No uses `./frontend` ni `/frontend`

### Error: "Dockerfile not found"
- Asegúrate de haber hecho `git push`
- Espera 1-2 minutos para que Coolify sincronice
- Verifica en GitHub que el archivo `frontend/Dockerfile` existe

### Error durante npm ci o npm run build
- Revisa el error específico en los logs
- Puede ser un problema de dependencias o TypeScript
- Prueba localmente: `cd frontend; npm install; npm run build`

## 🆘 Alternativa: Usar Nixpacks

Si el Dockerfile no funciona, puedes intentar con Nixpacks:

```
Base Directory: frontend
Build Pack: nixpacks
Port: 3000
```

Nixpacks usará el archivo `frontend/nixpacks.toml` que ya existe.

## 📊 Comparación de Opciones

| Característica | Dockerfile | Nixpacks |
|---------------|-----------|----------|
| Control | ✅ Total | ⚠️ Limitado |
| Velocidad | ✅ Rápido | ⚠️ Más lento |
| Confiabilidad | ✅ Alta | ✅ Alta |
| Configuración | ⚠️ Manual | ✅ Automática |
| **Recomendado** | **✅ SÍ** | Solo si Dockerfile falla |

## 🎓 Explicación del Problema

El error que estabas viendo:
```
Error response from daemon: container [...] is not running
```

Ocurría porque:

1. Coolify intentaba hacer el build en la raíz del repositorio
2. No encontraba los archivos `package.json`, `next.config.ts`, etc.
3. El contenedor fallaba inmediatamente

**Solución:** Configurar `Base Directory: frontend` le dice a Coolify que los archivos están en la carpeta `frontend/`.

## 📞 Siguiente Paso

**AHORA:** 
1. Ejecuta los comandos git para hacer push
2. Ve a Coolify y configura el Base Directory
3. Haz Redeploy
4. Avísame si funciona o si hay algún error nuevo

¡El deployment debería funcionar después de estos cambios! 🎉

