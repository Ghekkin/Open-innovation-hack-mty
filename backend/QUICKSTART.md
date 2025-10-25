# 🚀 Quick Start - MCP Financiero

Guía rápida para poner en marcha el servidor MCP Financiero en minutos.

## ⚡ Inicio Rápido (3 minutos)

### 1️⃣ Clonar y Configurar

```bash
# Navegar al backend
cd backend

# Crear archivo .env con credenciales
cp .env.example .env
# (El archivo .env ya tiene las credenciales configuradas)
```

### 2️⃣ Instalar Dependencias

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3️⃣ Probar Conexión a BD

```bash
python scripts/test_connection.py
```

**Salida esperada:**
```
=== Test de Conexión a Base de Datos ===
✓ Conexión exitosa a la base de datos
✓ Base de datos: oi_banorte
✓ Versión MySQL: 8.0.x
✓ Tablas encontradas: X
=== Test completado exitosamente ===
```

### 4️⃣ (Opcional) Cargar Datos Iniciales

```bash
python scripts/load_data.py
```

### 5️⃣ Iniciar Servidor MCP

```bash
cd src
python mcp_server.py
```

**Salida esperada:**
```
=== MCP Financiero Server ===
Servidor MCP para análisis financiero inteligente
Conexión a base de datos establecida exitosamente
Ready to accept connections...
```

---

## 🐳 Inicio con Docker (1 minuto)

```bash
# Desde el directorio backend
docker-compose up -d

# Ver logs
docker-compose logs -f
```

---

## 🧪 Probar el Servidor

### Desde un cliente MCP

```python
from mcp import Client

client = Client("stdio", command=["python", "mcp_server.py"])

# Obtener balance
result = await client.call_tool("get_company_balance", {})
print(result)
```

### Herramientas disponibles

Ejecutar para ver todas las herramientas:
```python
tools = await client.list_tools()
for tool in tools:
    print(f"- {tool.name}: {tool.description}")
```

---

## 📦 Estructura de Archivos Importante

```
backend/
├── src/
│   ├── mcp_server.py       ← Servidor principal
│   ├── database/           ← Conexión a BD
│   ├── tools/              ← Herramientas MCP
│   └── utils/              ← Utilidades
├── scripts/
│   ├── test_connection.py  ← Test de BD
│   └── load_data.py        ← Carga de datos
├── requirements.txt        ← Dependencias
├── .env                    ← Configuración
└── Dockerfile             ← Para deployment
```

---

## 🔧 Configuración

### Variables de Entorno (.env)

Ya están configuradas las credenciales de BD:
```env
DB_HOST=72.60.123.201
DB_PORT=5441
DB_USER=mysql
DB_PASSWORD=KPZhjmEQTnbNE8ZRLUT6Z3kYS8hHfcebD8b4VlkbQZB3iiIdhCXEa9FGLeJhL2RO
DB_NAME=oi_banorte
```

---

## 🛠️ Troubleshooting

### Error: "No module named 'mcp'"

```bash
pip install mcp
```

### Error: "Cannot connect to database"

1. Verificar credenciales en `.env`
2. Verificar conectividad de red
3. Verificar firewall

```bash
# Test de conexión manual
python -c "import mysql.connector; print('OK')"
```

### Error: "Port 8080 already in use"

Cambiar puerto en `.env`:
```env
MCP_SERVER_PORT=8081
```

---

## 📚 Próximos Pasos

1. ✅ Lee `README.md` para entender el proyecto completo
2. ✅ Lee `ARCHITECTURE.md` para entender la arquitectura
3. ✅ Lee `DEPLOYMENT.md` para deployment en Coolify
4. ✅ Explora las herramientas MCP disponibles
5. ✅ Conecta con el frontend

---

## 💡 Consejos

- Usa `LOG_LEVEL=DEBUG` en `.env` para ver más detalles
- Los logs se muestran en la consola en desarrollo
- El servidor MCP usa stdio por defecto
- Para producción, usar Docker + Coolify

---

## 🆘 Ayuda

Si encuentras problemas:
1. Revisa los logs
2. Verifica la conexión a BD
3. Asegúrate que todas las dependencias estén instaladas
4. Consulta `ARCHITECTURE.md` y `DEPLOYMENT.md`

---

**¡Listo! Tu servidor MCP Financiero está corriendo 🎉**

