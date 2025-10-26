# Solución: Frontend No Despliega en Coolify

## Problema
El deployment falla con el error:
```
Error response from daemon: container [...] is not running
```

El contenedor helper se detiene inmediatamente sin llegar a la fase de build.

## Causa
Coolify está intentando hacer el build desde la raíz del repositorio (`/`), pero el código del frontend está en la carpeta `frontend/`.

## Solución 1: Configurar Base Directory (RECOMENDADO)

### Pasos en Coolify:

1. **Ve a tu aplicación frontend** → **Configuration** → **General**

2. **Busca el campo "Base Directory"**:
   - Si está visible, edítalo directamente
   - Si NO está visible, ve a **Advanced** y búscalo ahí
   - Algunos nombres alternativos: "Working Directory", "Source Directory"

3. **Establece el valor**: `frontend`

4. **Verifica otros campos**:
   - **Build Pack**: `Nixpacks` (como lo tienes ahora)
   - **Port**: `3000`
   - **Install Command**: (déjalo vacío o `npm ci`)
   - **Build Command**: (déjalo vacío o `npm run build`)
   - **Start Command**: (déjalo vacío o `npm run start`)

5. **Guarda los cambios** (botón **Save**)

6. **Redeploy** (botón **Redeploy**)

### Verificación:
En los logs del deployment, deberías ver algo como:
```
Cloning into '/app'...
cd /app/frontend
npm ci
npm run build
```

## Solución 2: Cambiar a Dockerfile

Si la Solución 1 no funciona o no encuentras el campo Base Directory:

### Pasos:

1. **Asegúrate de que los archivos estén en el repositorio**:
   - Ya creé `frontend/Dockerfile`
   - Ya creé `frontend/.dockerignore`
   - Ya actualicé `frontend/next.config.ts`

2. **En Coolify** → **Configuration** → **General**:
   - **Build Pack**: Cambia de `Nixpacks` a `Dockerfile`
   - **Base Directory**: `frontend`
   - **Dockerfile Location**: `Dockerfile` (o `./Dockerfile`)
   - **Port**: `3000`

3. **Guarda y Redeploy**

## Solución 3: Mover el Frontend a la Raíz (NO RECOMENDADO)

Si ninguna de las anteriores funciona, podrías mover el código del frontend a la raíz del repositorio, pero esto NO es recomendado porque:
- Rompe la estructura del proyecto
- Dificulta el mantenimiento
- No es una buena práctica

## Verificación de Variables de Entorno

Después de que el deployment funcione, verifica que tengas estas variables:

1. **Ve a** → **Environment Variables**

2. **Agrega**:
   ```bash
   MCP_SERVER_URL=https://tu-backend-url.com
   NODE_ENV=production
   ```

3. **Importante**: Reemplaza `https://tu-backend-url.com` con la URL real de tu backend

## Troubleshooting Adicional

### Si el build falla con errores de memoria:

En **Advanced** → **Resource Limits**:
- **Memory Limit**: `2048` (2GB)
- **Memory Swap**: `2048`

### Si el build es muy lento:

En **Advanced**:
- Habilita **Build Cache** si está disponible

### Si ves errores de npm:

Verifica que `frontend/package.json` tenga los scripts correctos:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## Comandos para Verificar Localmente

Antes de deployar, verifica que el build funcione localmente:

```powershell
# Ir a la carpeta frontend
cd frontend

# Instalar dependencias
npm ci

# Build de producción
npm run build

# Iniciar en modo producción
npm run start
```

Si esto funciona localmente, debería funcionar en Coolify.

## Logs Útiles para Debugging

Cuando hagas redeploy, revisa estos logs en Coolify:

1. **Deployment Logs**: Muestra el proceso de build
2. **Application Logs**: Muestra errores de runtime
3. **Terminal**: Puedes ejecutar comandos dentro del contenedor

### Comandos útiles en el Terminal de Coolify:

```bash
# Ver estructura de archivos
ls -la

# Ver si existe package.json
cat package.json

# Ver variables de entorno
env | grep MCP

# Ver logs de Next.js
cat .next/build-manifest.json
```

## Checklist Final

Antes de hacer redeploy, verifica:

- [ ] Base Directory está configurado como `frontend`
- [ ] Build Pack es `Nixpacks` o `Dockerfile`
- [ ] Port es `3000`
- [ ] Variables de entorno están configuradas
- [ ] El código está pusheado al repositorio en GitHub
- [ ] El branch correcto está seleccionado (main)

## Contacto

Si el problema persiste después de seguir estos pasos:

1. Toma captura de pantalla de:
   - La configuración General
   - Los logs completos del deployment
   - La sección Advanced

2. Verifica que el repositorio en GitHub tenga:
   - La carpeta `frontend/` con todo el código
   - El archivo `frontend/package.json`
   - El archivo `frontend/Dockerfile` (si usas esa opción)

3. Intenta hacer un deployment manual desde la terminal de Coolify para ver errores más detallados

## Notas Importantes

- **NO** modifiques el código durante el deployment
- **NO** hagas múltiples redeploys simultáneos
- **ESPERA** a que cada deployment termine (exitoso o fallido) antes de hacer otro
- **REVISA** los logs completos, no solo el final
- **VERIFICA** que el backend esté corriendo antes de probar el frontend

## Arquitectura Correcta

```
Repositorio GitHub: Ghekkin/Open-innovation-hack-mty
│
├── backend/          ← Backend separado en Coolify
│   ├── src/
│   ├── requirements.txt
│   └── ...
│
└── frontend/         ← Frontend (ESTE es el Base Directory)
    ├── app/
    ├── package.json  ← Coolify necesita encontrar ESTE archivo
    ├── next.config.ts
    ├── Dockerfile    ← Para opción Dockerfile
    └── ...
```

Coolify debe buscar en `frontend/` para encontrar el `package.json` y hacer el build correctamente.

