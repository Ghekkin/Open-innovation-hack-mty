# Solución: Error "denied: requested access to the resource is denied"

## 🚨 PROBLEMA

El deployment falla con:
```
Failed to push image to docker registry.
denied: requested access to the resource is denied
```

## ✅ CAUSA

Coolify está intentando hacer push de la imagen Docker a Docker Hub público (`docker.io`), pero no tienes permisos porque:
1. No estás autenticado en Docker Hub
2. No tienes permisos para pushear a `docker.io/library/`
3. No necesitas un registry externo para deployments locales

## 🔧 SOLUCIÓN 1: Deshabilitar Docker Registry (RECOMENDADO)

### Pasos en Coolify:

1. **Ve a tu aplicación frontend** → **Configuration** → **Advanced**

2. **Busca la sección "Registry" o "Docker Registry"**

3. **Deshabilita el registry**:
   - Si ves un toggle **"Use Registry"** → Desactívalo (OFF)
   - Si ves un toggle **"Push to Registry"** → Desactívalo (OFF)
   - Si ves un dropdown **"Registry Type"** → Selecciona `None` o `Local`
   - Si ves un campo **"Registry URL"** → Déjalo vacío

4. **Guarda los cambios** (botón **Save**)

5. **Redeploy** (botón **Redeploy**)

### Verificación:

En los logs del deployment, NO deberías ver:
```
Pushing image to docker registry...
```

Debería ir directo a:
```
Building docker image completed.
Starting container...
```

## 🔧 SOLUCIÓN 2: Configurar Registry Local

Si Coolify requiere un registry obligatoriamente:

### Pasos:

1. **Configuration** → **Advanced** → **Registry**

2. **Configura**:
   - **Registry Type**: `Local` o `Self-hosted`
   - **Registry URL**: `localhost:5000` (o déjalo vacío)
   - **Username**: (vacío)
   - **Password**: (vacío)

3. **Save** y **Redeploy**

## 🔧 SOLUCIÓN 3: Usar Coolify Registry Interno

Coolify tiene su propio registry interno:

### Pasos:

1. **Configuration** → **Advanced** → **Registry**

2. **Configura**:
   - **Registry Type**: `Coolify Internal`
   - O busca una opción que diga **"Use Coolify's internal registry"**

3. **Save** y **Redeploy**

## 🔧 SOLUCIÓN 4: Modificar Configuración de Build

Si ninguna de las anteriores funciona, podemos forzar que no haga push:

### Opción A: Variables de Entorno

En **Environment Variables**, agrega:
```bash
COOLIFY_SKIP_REGISTRY_PUSH=true
COOLIFY_LOCAL_BUILD=true
```

### Opción B: Configuración en el Servidor

Si tienes acceso SSH al servidor de Coolify:

```bash
# Conectar al servidor
ssh usuario@tu-servidor

# Editar configuración de Coolify
sudo nano /data/coolify/source/.env

# Agregar o modificar:
DOCKER_REGISTRY_ENABLED=false

# Reiniciar Coolify
sudo systemctl restart coolify
```

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de redeploy, verifica:

- [ ] Registry está deshabilitado o configurado como Local
- [ ] Base Directory = `frontend`
- [ ] Build Pack = `Dockerfile`
- [ ] Port = `3000`
- [ ] Variables de entorno configuradas
- [ ] Código pusheado a GitHub

## 🐛 TROUBLESHOOTING

### Problema: No encuentro la opción de Registry

**Ubicaciones posibles**:
1. Configuration → General → (busca "Registry")
2. Configuration → Advanced → Registry
3. Configuration → Build → Registry Settings
4. Configuration → Docker → Registry

### Problema: El toggle de Registry está deshabilitado (gris)

**Solución**: Puede ser una configuración global. Contacta al administrador de Coolify o:
1. Ve a Settings (del servidor, no de la app)
2. Busca Docker Registry Settings
3. Deshabilítalo globalmente

### Problema: Sigue intentando hacer push

**Solución**: Verifica los logs de build. Si ves:
```bash
docker push banorte-frontend:...
```

Entonces el registry sigue activo. Intenta:
1. Eliminar la aplicación y crearla de nuevo
2. Asegurarte de que NO hay variables de entorno relacionadas con registry
3. Verificar que no hay un `.coolify.yml` en el repositorio que fuerce el push

## 🎯 LOGS ESPERADOS (Deployment Exitoso)

```
Starting deployment of Ghekkin/Open-innovation-hack-mty:main
Cloning repository...
Building docker image started.
#1 [internal] load build definition from Dockerfile
#2 [internal] load metadata for docker.io/library/node:20-alpine
...
#14 [builder 5/5] RUN npm run build
✓ Compiled successfully
...
#19 exporting to image
#19 writing image sha256:a821139cc0dfef143788d1c43b6b1216b7d15ad2d0e2ce2d7eed58093b35988e done
Building docker image completed.
----------------------------------------
Starting container...
Container started successfully.
Application is running on port 3000.
```

**Nota**: NO debe aparecer "Pushing image to docker registry"

## 📞 INFORMACIÓN ADICIONAL

### ¿Por qué pasa esto?

Coolify por defecto intenta hacer push a un registry para:
1. Cachear las imágenes
2. Compartir imágenes entre servidores
3. Rollback rápido

Pero en deployments locales (un solo servidor), esto no es necesario.

### ¿Es seguro deshabilitar el registry?

Sí, es completamente seguro para deployments locales. La imagen se construye y se ejecuta directamente en el servidor.

### ¿Afecta el rendimiento?

No, de hecho puede ser más rápido porque no hay tiempo de push/pull.

## ⚡ RESUMEN EJECUTIVO

**El problema**: Coolify intenta hacer push a Docker Hub sin permisos

**La solución**: Deshabilitar el Docker Registry en la configuración

**Dónde**: Configuration → Advanced → Registry → Desactivar

**Después**: Save → Redeploy → Verificar que NO aparezca "Pushing image to docker registry"

---

## 🆘 SI NADA FUNCIONA

Si después de todas estas soluciones sigue fallando:

### Opción 1: Autenticarse en Docker Hub

Si Coolify requiere obligatoriamente un registry:

1. Crea una cuenta en Docker Hub (gratis): https://hub.docker.com
2. Crea un repositorio público: `tu-usuario/banorte-frontend`
3. En Coolify → Configuration → Advanced → Registry:
   - Registry Type: `Docker Hub`
   - Registry URL: `docker.io`
   - Username: `tu-usuario`
   - Password: `tu-password` (o token)
4. Modifica el nombre de la imagen en Coolify para que sea: `tu-usuario/banorte-frontend`

### Opción 2: Deployment Manual

Si Coolify no coopera, puedes deployar manualmente:

```powershell
# En tu máquina local
cd frontend

# Build de la imagen
docker build -t banorte-frontend:latest .

# Guardar la imagen
docker save banorte-frontend:latest -o banorte-frontend.tar

# Subir al servidor (reemplaza con tu servidor)
scp banorte-frontend.tar usuario@tu-servidor:/tmp/

# En el servidor
ssh usuario@tu-servidor
docker load -i /tmp/banorte-frontend.tar
docker run -d -p 3000:3000 \
  -e MCP_SERVER_URL=https://tu-backend-url.com \
  -e NODE_ENV=production \
  --name frontend-app \
  banorte-frontend:latest
```

### Opción 3: Cambiar a Nixpacks

Si el Dockerfile está causando problemas con el registry:

1. Configuration → General → Build Pack: `Nixpacks`
2. Base Directory: `frontend`
3. Save → Redeploy

Nixpacks a veces maneja el registry de manera diferente.

---

**Última actualización**: 26 de octubre de 2025

