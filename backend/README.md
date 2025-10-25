# 🏦 MCP Financiero - Backend

Servidor MCP (Model Context Protocol) para análisis financiero inteligente del Reto Banorte.

## 📋 Descripción

Este servidor proporciona herramientas de análisis financiero a través del protocolo MCP, permitiendo:

- ✅ Consultar balances de empresas y personas
- ✅ Analizar gastos por categoría
- ✅ Proyectar flujos de caja futuros
- ✅ Simular escenarios "what-if"
- ✅ Comparar presupuestos vs gastos reales
- ✅ Generar recomendaciones financieras

## 🏗️ Arquitectura

```
backend/
├── src/
│   ├── database/          # Módulos de conexión a BD
│   │   ├── connection.py  # Gestión de conexiones MySQL
│   │   └── queries.py     # Consultas financieras
│   ├── tools/             # Herramientas MCP
│   │   ├── balance_tools.py    # Herramientas de balance
│   │   ├── expense_tools.py    # Análisis de gastos
│   │   ├── projection_tools.py # Proyecciones
│   │   └── budget_tools.py     # Comparaciones de presupuesto
│   ├── utils/             # Utilidades
│   │   ├── logger.py      # Configuración de logging
│   │   └── validators.py  # Validaciones de entrada
│   └── mcp_server.py      # Servidor MCP principal
├── Dockerfile             # Imagen Docker
├── docker-compose.yml     # Orquestación
├── requirements.txt       # Dependencias Python
└── .env.example          # Variables de entorno ejemplo
```

## 🚀 Instalación

### Requisitos Previos

- Python 3.11+
- MySQL 8.0+
- Docker (opcional, para deployment)

### Instalación Local

1. **Crear entorno virtual:**

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. **Instalar dependencias:**

```bash
pip install -r requirements.txt
```

3. **Configurar variables de entorno:**

Copiar `.env.example` a `.env` y configurar las credenciales de la base de datos.

4. **Ejecutar el servidor:**

```bash
cd src
python mcp_server.py
```

## 🐳 Deployment con Docker

### Construcción de la imagen

```bash
docker build -t mcp-financiero:latest .
```

### Ejecución con Docker Compose

```bash
docker-compose up -d
```

### Deployment en Coolify

1. Conectar el repositorio en Coolify
2. Configurar las variables de entorno
3. Seleccionar `Dockerfile` como método de build
4. Deploy automático

Variables de entorno requeridas en Coolify:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## 🛠️ Herramientas MCP Disponibles

### 1. get_company_balance
Obtiene el balance financiero de una empresa.

**Parámetros:**
- `company_id` (opcional): ID de la empresa

**Retorna:**
```json
{
  "success": true,
  "data": {
    "ingresos": 150000.00,
    "gastos": 85000.00,
    "balance": 65000.00
  }
}
```

### 2. get_personal_balance
Obtiene el balance financiero personal.

**Parámetros:**
- `user_id` (opcional): ID del usuario

### 3. analyze_expenses_by_category
Analiza gastos agrupados por categoría.

**Parámetros:**
- `company_id` (opcional): ID de la empresa
- `start_date` (opcional): Fecha inicio (YYYY-MM-DD)
- `end_date` (opcional): Fecha fin (YYYY-MM-DD)

**Retorna:**
```json
{
  "success": true,
  "data": {
    "categorias": [
      {
        "categoria": "Nómina",
        "total": 45000.00,
        "transacciones": 12,
        "porcentaje": 52.94
      }
    ],
    "total_gastos": 85000.00
  }
}
```

### 4. project_cash_flow
Proyecta el flujo de caja futuro.

**Parámetros:**
- `company_id` (opcional): ID de la empresa
- `months` (opcional): Meses a proyectar (1-24, default: 3)

**Retorna:**
```json
{
  "success": true,
  "data": {
    "proyeccion_meses": 3,
    "ingreso_promedio_mensual": 50000.00,
    "gasto_promedio_mensual": 28333.33,
    "balance_proyectado": 65000.01,
    "recomendaciones": [...]
  }
}
```

### 5. simulate_financial_scenario
Simula escenarios "what-if".

**Parámetros:**
- `current_balance`: Balance actual (requerido)
- `monthly_income_change`: Cambio en ingresos mensuales (default: 0)
- `monthly_expense_change`: Cambio en gastos mensuales (default: 0)
- `months`: Meses a simular (1-24, default: 6)

**Retorna:**
```json
{
  "success": true,
  "data": {
    "balance_inicial": 65000.00,
    "balance_final": 95000.00,
    "cambio_total": 30000.00,
    "proyecciones_mensuales": [...]
  }
}
```

### 6. compare_budget_vs_actual
Compara presupuesto vs gastos reales.

**Parámetros:**
- `company_id` (opcional): ID de la empresa
- `month` (opcional): Mes a analizar (1-12)
- `year` (opcional): Año a analizar

## 🔧 Configuración de Base de Datos

### Estructura de Tablas Esperada

**transacciones_empresa:**
- id_empresa (VARCHAR)
- fecha (DATE)
- tipo_operacion (VARCHAR): 'ingreso' o 'gasto'
- concepto (VARCHAR)
- categoria (VARCHAR)
- monto (DECIMAL)

**transacciones_personales:**
- id_usuario (VARCHAR)
- fecha (DATE)
- tipo_operacion (VARCHAR): 'ingreso' o 'gasto'
- descripcion (VARCHAR)
- categoria (VARCHAR)
- monto (DECIMAL)

## 📊 Logging

Los logs se almacenan en:
- Consola (desarrollo)
- `/app/logs/` (producción/Docker)

Niveles de log configurables mediante la variable de entorno `LOG_LEVEL`.

## 🔒 Seguridad

- Conexiones a BD mediante pooling
- Variables de entorno para credenciales
- Validación de entrada en todas las herramientas
- Healthchecks para monitoreo

## 🧪 Testing

```bash
# Probar conexión a BD
python -c "from src.database import get_db_connection; print(get_db_connection().test_connection())"

# Ejecutar servidor en modo debug
python src/mcp_server.py
```

## 📈 Monitoreo

El servidor incluye healthcheck que valida:
- Conexión a base de datos
- Estado del pool de conexiones
- Disponibilidad del servicio

## 👥 Contribución

Este proyecto fue desarrollado para el HackTec 2025 - Reto Banorte.

## 📄 Licencia

Proyecto educativo para hackathon.

