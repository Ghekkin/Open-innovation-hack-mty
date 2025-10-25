# 🚀 Guía de Deployment - MCP Financiero

## Deployment en Coolify

### Pre-requisitos

1. Cuenta en Coolify
2. Repositorio Git conectado
3. Variables de entorno configuradas

### Pasos para Deploy

#### 1. Conectar Repositorio

En Coolify:
1. Ir a "Projects" → "New Project"
2. Conectar el repositorio de GitHub/GitLab
3. Seleccionar la rama `main`

#### 2. Configurar Variables de Entorno

En la sección de "Environment Variables", agregar:

```env
DB_HOST=72.60.123.201
DB_PORT=5441
DB_USER=mysql
DB_PASSWORD=KPZhjmEQTnbNE8ZRLUT6Z3kYS8hHfcebD8b4VlkbQZB3iiIdhCXEa9FGLeJhL2RO
DB_NAME=oi_banorte
ENVIRONMENT=production
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_PORT=8080
```

#### 3. Configurar Build

- **Build Method**: Dockerfile
- **Dockerfile Path**: `backend/Dockerfile`
- **Context**: `backend/`
- **Port**: 8080

#### 4. Health Check

Configurar health check en Coolify:
- **Path**: `/health` (si implementas endpoint) o usar el health check del Dockerfile
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 3

#### 5. Deploy

Hacer clic en "Deploy" y esperar a que el build se complete.

### Verificación Post-Deploy

#### Verificar que el contenedor esté corriendo:

```bash
docker ps | grep mcp-financiero
```

#### Verificar logs:

```bash
docker logs mcp-financiero-server
```

#### Probar conectividad a la base de datos:

Desde el contenedor:
```bash
docker exec -it mcp-financiero-server python scripts/test_connection.py
```

### Troubleshooting

#### Error de conexión a base de datos

1. Verificar que las variables de entorno estén correctas
2. Verificar que el servidor de BD sea accesible desde el contenedor
3. Revisar logs: `docker logs mcp-financiero-server`

#### Puerto no accesible

1. Verificar que el puerto 8080 esté expuesto correctamente
2. Verificar firewall/security groups
3. Revisar configuración de red en Coolify

#### Build fallido

1. Verificar que todas las dependencias estén en `requirements.txt`
2. Revisar logs de build en Coolify
3. Probar build localmente: `docker build -t mcp-financiero:latest .`

### Monitoreo

#### Logs en tiempo real:

```bash
docker logs -f mcp-financiero-server
```

#### Health check manual:

```bash
docker exec mcp-financiero-server python -c "from src.database import get_db_connection; print(get_db_connection().test_connection())"
```

### Rollback

En caso de problemas, Coolify permite hacer rollback a versiones anteriores:

1. Ir a "Deployments" en el proyecto
2. Seleccionar una versión anterior
3. Hacer clic en "Redeploy"

### Actualizaciones

Para actualizar la aplicación:

1. Hacer push a la rama `main`
2. Coolify detectará el cambio automáticamente
3. O manualmente hacer clic en "Redeploy"

### Escalamiento (Opcional)

Para escalar horizontalmente:

1. En Coolify, ir a "Scaling"
2. Aumentar el número de réplicas
3. Configurar load balancer si es necesario

### Backup de Datos

Asegurarse de tener backups de la base de datos:

```bash
# Ejemplo de backup manual
docker exec mysql-container mysqldump -u mysql -p oi_banorte > backup_$(date +%Y%m%d).sql
```

### Variables de Entorno Adicionales (Opcionales)

```env
# Para integraciones con IA
OPENAI_API_KEY=tu_api_key
ANTHROPIC_API_KEY=tu_api_key

# Para logs más detallados
LOG_LEVEL=DEBUG

# Para secret key (si se implementa autenticación)
SECRET_KEY=tu_secret_key_seguro
```

---

## Deployment Local para Desarrollo

### Con Docker Compose:

```bash
cd backend
docker-compose up -d
```

### Sin Docker:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd src
python mcp_server.py
```

---

## CI/CD Automático (Opcional)

Coolify soporta webhooks para deployment automático:

1. En Coolify, copiar el webhook URL
2. En GitHub/GitLab, configurar el webhook
3. Cada push a `main` desplegará automáticamente

---

## Contacto y Soporte

Para problemas durante el deployment, contactar al equipo de desarrollo.

