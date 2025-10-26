# Solución: Deployment Frontend Fallando en Coolify

## Problema
El deployment del frontend está fallando con el error:
```
Error response from daemon: container [...] is not running
```

El contenedor helper se cierra inmediatamente después de iniciarse.

## Causa
Coolify no puede encontrar los archivos del frontend porque:
1. El **Base Directory** no está configurado
2. O la configuración del build pack es incorrecta

## Solución Paso a Paso

### PASO 1: Verificar Configuración en Coolify

Ve a tu aplicación frontend en Coolify y verifica:

#### En la pestaña "General":

1. **Source → Base Directory**: 
   - ✅ DEBE estar configurado como: `frontend`
   - ❌ NO debe estar vacío

2. **Build Pack**:
   - Opción A (Recomendada): `dockerfile`
   - Opción B: `nixpacks`

3. **Dockerfile Location** (solo si usas dockerfile):
   - Debe ser: `Dockerfile`

4. **Port**:
   - Debe ser: `3000`

5. **Publish Directory**:
   - Déjalo vacío (Next.js no lo necesita)

### PASO 2: Configurar Variables de Entorno

En la pestaña "Environment Variables", agrega:

```bash
MCP_SERVER_URL=https://tu-backend-url.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Importante:** Reemplaza `https://tu-backend-url.com` con la URL real de tu backend.

### PASO 3: Verificar Archivos en el Repositorio

Asegúrate de que estos archivos existan en tu repositorio:

```
frontend/
├── Dockerfile              ← NUEVO (ya creado)
├── .dockerignore          ← NUEVO (ya creado)
├── next.config.ts         ← ACTUALIZADO con output: 'standalone'
├── nixpacks.toml          ← Existe
├── package.json           ← Existe
└── ... (otros archivos)
```

### PASO 4: Hacer Commit y Push

Si acabas de crear los archivos nuevos (Dockerfile, .dockerignore, next.config.ts actualizado):

```powershell
# Agregar archivos
git add frontend/Dockerfile
git add frontend/.dockerignore
git add frontend/next.config.ts
git add CONFIGURACION_COOLIFY.md
git add SOLUCION_DEPLOYMENT_FRONTEND.md

# Commit
git commit -m "fix: Agregar Dockerfile y configuración para deployment en Coolify"

# Push
git push origin main
```

### PASO 5: Redeploy en Coolify

1. Ve a tu aplicación frontend en Coolify
2. Click en **"Redeploy"**
3. Espera a que termine el deployment
4. Revisa los logs

## Configuración Detallada por Build Pack

### Opción A: Usando Dockerfile (RECOMENDADO)

**Ventajas:**
- Más control sobre el proceso de build
- Más confiable
- Mejor optimización de capas
- Más rápido en deployments subsecuentes

**Configuración en Coolify:**
```
Base Directory: frontend
Build Pack: dockerfile
Dockerfile Location: Dockerfile
Port: 3000
```

**Archivos necesarios:**
- ✅ `frontend/Dockerfile` (ya creado)
- ✅ `frontend/.dockerignore` (ya creado)
- ✅ `frontend/next.config.ts` con `output: 'standalone'` (ya actualizado)

### Opción B: Usando Nixpacks

**Ventajas:**
- Configuración más simple
- Detección automática

**Configuración en Coolify:**
```
Base Directory: frontend
Build Pack: nixpacks
Port: 3000
```

**Archivos necesarios:**
- ✅ `frontend/nixpacks.toml` (ya existe)
- ✅ `frontend/package.json` (ya existe)

## Verificación del Deployment

Después de hacer el redeploy, verifica:

### 1. Logs de Build
Deberías ver algo como:
```
[+] Building ...
 => [internal] load build definition from Dockerfile
 => [internal] load .dockerignore
 => [stage-0 1/5] FROM node:20-alpine
 => [stage-1 2/6] COPY package*.json ./
 => [stage-1 3/6] RUN npm ci
 => [stage-1 4/6] COPY . .
 => [stage-1 5/6] RUN npm run build
 ...
```

### 2. Logs de Runtime
Deberías ver:
```
> next start
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3. Acceso a la Aplicación
- Abre la URL de tu frontend en Coolify
- Deberías ver la página de inicio
- Verifica que el dashboard funcione

## Troubleshooting Adicional

### Error: "Base directory not found"
**Solución:** Verifica que en Coolify, el campo "Base Directory" esté configurado como `frontend` (sin `/` al inicio ni al final)

### Error: "Dockerfile not found"
**Solución:** 
1. Verifica que el archivo `frontend/Dockerfile` exista en el repositorio
2. Haz push de los cambios
3. En Coolify, verifica que "Dockerfile Location" sea `Dockerfile` (sin ruta)

### Error: "npm ci failed"
**Solución:**
1. Verifica que `package-lock.json` exista en el repositorio
2. Si no existe, genera uno localmente con `npm install` y haz commit

### Error: "Build failed" durante npm run build
**Solución:**
1. Revisa los logs específicos del error
2. Puede ser un error de TypeScript o ESLint
3. Prueba el build localmente: `cd frontend; npm run build`

### El deployment funciona pero la app no carga
**Solución:**
1. Verifica que el puerto sea `3000`
2. Verifica que la variable `MCP_SERVER_URL` esté configurada
3. Revisa los logs de runtime en Coolify

### Error de conexión con el backend
**Solución:**
1. Verifica que `MCP_SERVER_URL` apunte a la URL correcta del backend
2. Verifica que el backend esté corriendo
3. Verifica que no haya problemas de CORS

## Checklist Final

Antes de hacer redeploy, verifica:

- [ ] Base Directory configurado como `frontend`
- [ ] Build Pack seleccionado (dockerfile o nixpacks)
- [ ] Puerto configurado como `3000`
- [ ] Variable `MCP_SERVER_URL` configurada
- [ ] Archivos `Dockerfile` y `.dockerignore` existen (si usas dockerfile)
- [ ] Archivo `next.config.ts` tiene `output: 'standalone'`
- [ ] Cambios están en el repositorio (git push)
- [ ] Has hecho click en "Redeploy" en Coolify

## Comandos Útiles

### Verificar localmente que el build funciona:
```powershell
cd frontend
npm install
npm run build
npm run start
```

### Probar el Dockerfile localmente:
```powershell
cd frontend
docker build -t frontend-test .
docker run -p 3000:3000 -e MCP_SERVER_URL=http://localhost:8080 frontend-test
```

## Contacto

Si después de seguir todos estos pasos el problema persiste:
1. Copia los logs completos del deployment
2. Verifica que el Base Directory esté configurado
3. Intenta con la otra opción de Build Pack (dockerfile vs nixpacks)

