# 🏗️ Arquitectura del Sistema - MCP Financiero

## Vista General

El sistema MCP Financiero está diseñado siguiendo una arquitectura modular y escalable, utilizando el protocolo MCP (Model Context Protocol) como capa de comunicación entre el frontend y el análisis financiero inteligente.

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Simulador   │  │   Chatbot    │     │
│  │   Visual     │  │   What-If    │  │   AI         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    MCP Protocol
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                  BACKEND MCP SERVER                         │
│                          │                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │         MCP Server (mcp_server.py)                 │   │
│  │  - Tool Registration                               │   │
│  │  - Request Handling                                │   │
│  │  - Response Formatting                             │   │
│  └────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │              TOOLS LAYER                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ Balance  │ │ Expenses │ │Projection│           │   │
│  │  │  Tools   │ │  Tools   │ │  Tools   │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘           │   │
│  │  ┌──────────┐ ┌──────────┐                        │   │
│  │  │ Budget   │ │Simulator │                        │   │
│  │  │  Tools   │ │  Tools   │                        │   │
│  │  └──────────┘ └──────────┘                        │   │
│  └────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │           DATABASE LAYER                           │   │
│  │  ┌──────────────────┐ ┌──────────────────┐        │   │
│  │  │   Connection     │ │     Queries      │        │   │
│  │  │     Pool         │ │   (SQL Logic)    │        │   │
│  │  └──────────────────┘ └──────────────────┘        │   │
│  └────────────────────────────────────────────────────┘   │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    MySQL Connection
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    DATABASE (MySQL)                         │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ transacciones_       │  │ transacciones_       │        │
│  │    empresa           │  │   personales         │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## Componentes Principales

### 1. Frontend (React/Next.js)

**Responsabilidades:**
- Interfaz de usuario intuitiva
- Visualización de datos financieros
- Interacción con el usuario (chat, formularios, dashboards)
- Comunicación con el servidor MCP

**Tecnologías:**
- React/TypeScript
- Chart.js para visualizaciones
- MCP Client SDK

### 2. MCP Server (Backend)

**Responsabilidades:**
- Registro y exposición de herramientas financieras
- Procesamiento de solicitudes del cliente
- Ejecución de lógica de negocio
- Formateo de respuestas

**Componentes:**

#### a) mcp_server.py (Core)
- Inicialización del servidor MCP
- Registro de herramientas disponibles
- Routing de solicitudes
- Manejo de errores

#### b) Tools Layer (Herramientas)

**Balance Tools:**
- `get_company_balance`: Balance empresarial
- `get_personal_balance`: Balance personal
- `get_balance`: Herramienta universal

**Expense Tools:**
- `analyze_expenses_by_category`: Análisis por categoría
- Cálculo de porcentajes
- Filtrado por fechas

**Projection Tools:**
- `project_cash_flow`: Proyección de flujo de caja
- `simulate_scenario`: Simulador "what-if"
- Generación de recomendaciones

**Budget Tools:**
- `compare_budget_vs_actual`: Comparación presupuesto vs real
- Identificación de variaciones

### 3. Database Layer

**Responsabilidades:**
- Gestión de conexiones a MySQL
- Connection pooling para optimización
- Ejecución de queries
- Transacciones

**Componentes:**

#### a) connection.py
- Singleton pattern para conexión
- Pool de conexiones (5 conexiones por defecto)
- Health checks
- Manejo de reconexión automática

#### b) queries.py
- Todas las queries SQL organizadas
- Métodos específicos por tipo de análisis
- Parámetros opcionales para filtrado
- Validación de entrada

### 4. Database (MySQL)

**Esquema:**

```sql
-- Transacciones Empresariales
CREATE TABLE transacciones_empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa VARCHAR(50),
    fecha DATE,
    tipo_operacion VARCHAR(20),  -- 'ingreso' o 'gasto'
    concepto VARCHAR(255),
    categoria VARCHAR(100),
    monto DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_empresa (id_empresa),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo_operacion),
    INDEX idx_categoria (categoria)
);

-- Transacciones Personales
CREATE TABLE transacciones_personales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario VARCHAR(50),
    fecha DATE,
    tipo_operacion VARCHAR(20),  -- 'ingreso' o 'gasto'
    descripcion VARCHAR(255),
    categoria VARCHAR(100),
    monto DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (id_usuario),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo_operacion),
    INDEX idx_categoria (categoria)
);
```

---

## Flujo de Datos

### Ejemplo: Consulta de Balance

```
1. Frontend → MCP Client
   User click "Ver Balance" 
   ↓
2. MCP Client → MCP Server
   Request: { tool: "get_company_balance", args: { company_id: "EMP001" } }
   ↓
3. MCP Server → Tools Layer
   Call: get_company_balance_tool(company_id="EMP001")
   ↓
4. Tools Layer → Database Layer
   Call: queries.get_company_balance(company_id="EMP001")
   ↓
5. Database Layer → MySQL
   Execute: SELECT SUM(CASE ...) FROM transacciones_empresa WHERE id_empresa = 'EMP001'
   ↓
6. MySQL → Database Layer
   Returns: { ingresos: 150000, gastos: 85000, balance: 65000 }
   ↓
7. Database Layer → Tools Layer
   Returns: Query results
   ↓
8. Tools Layer → MCP Server
   Returns: { success: true, data: {...}, message: "..." }
   ↓
9. MCP Server → MCP Client
   Response: JSON formatted result
   ↓
10. MCP Client → Frontend
    Renders: Dashboard con gráficas y números
```

---

## Patrones de Diseño

### 1. Singleton Pattern
**Dónde:** `DatabaseConnection`
**Por qué:** Una única instancia de pool de conexiones

### 2. Factory Pattern
**Dónde:** Tool creation
**Por qué:** Creación dinámica de herramientas MCP

### 3. Repository Pattern
**Dónde:** `FinancialDataQueries`
**Por qué:** Abstracción de acceso a datos

### 4. Dependency Injection
**Dónde:** Tools reciben instancias de queries
**Por qué:** Testabilidad y flexibilidad

---

## Seguridad

### 1. Credenciales
- Variables de entorno para todas las credenciales
- No hardcodear passwords
- Archivos `.env` en `.gitignore`

### 2. SQL Injection Prevention
- Prepared statements en todas las queries
- Validación de entrada en tools
- Uso de parameterized queries

### 3. Connection Security
- Connection pooling con límites
- Timeouts configurados
- Reconexión automática con backoff

### 4. Error Handling
- No exponer detalles internos en errores
- Logging detallado server-side
- Mensajes user-friendly client-side

---

## Escalabilidad

### Horizontal Scaling
- Stateless server permite múltiples instancias
- Load balancer distribuye carga
- Connection pool por instancia

### Vertical Scaling
- Ajustar tamaño de connection pool
- Optimizar queries con índices
- Cachear resultados frecuentes (futuro)

### Database Optimization
- Índices en columnas frecuentemente consultadas
- Particionamiento de tablas por fecha (futuro)
- Read replicas para consultas (futuro)

---

## Performance

### Database
- **Connection pooling**: 5 conexiones pre-establecidas
- **Índices**: En campos de filtrado frecuente
- **Query optimization**: Uso de agregaciones en DB

### Backend
- **Async operations**: MCP server usa asyncio
- **Error handling**: Try-catch en cada capa
- **Logging eficiente**: No blocking I/O

### Frontend
- **Lazy loading**: Carga datos bajo demanda
- **Caching**: Cache de resultados en client (opcional)
- **Visualización optimizada**: Chart.js con datasets limitados

---

## Monitoreo y Observabilidad

### Logging
```python
# Niveles de log
- ERROR: Errores críticos
- WARNING: Situaciones anómalas
- INFO: Eventos importantes
- DEBUG: Información detallada de desarrollo
```

### Health Checks
- Database connectivity check
- Pool status monitoring
- Service availability check

### Métricas (Futuro)
- Response times
- Query performance
- Error rates
- Tool usage statistics

---

## Deployment

### Containerización
- **Docker**: Imagen basada en Python 3.11-slim
- **Multi-stage build**: Optimización de tamaño
- **Health checks**: Validación automática

### Orquestación
- **Docker Compose**: Para desarrollo local
- **Coolify**: Para producción
- **Environment variables**: Configuración flexible

---

## Extensibilidad

### Agregar Nueva Herramienta MCP

1. Crear función en `/tools/`:
```python
def new_tool(param1, param2):
    # Lógica
    return result
```

2. Registrar en `mcp_server.py`:
```python
Tool(name="new_tool", description="...", inputSchema={...})
```

3. Agregar handler en `call_tool()`:
```python
elif name == "new_tool":
    result = new_tool(...)
```

### Agregar Nueva Query

1. Agregar método en `queries.py`:
```python
def new_query(self, filters):
    query = "SELECT ..."
    return self.db.execute_query(query, params)
```

2. Usar en tool correspondiente

---

## Testing Strategy

### Unit Tests
- Tests para cada tool
- Tests para queries
- Mocking de database

### Integration Tests
- Tests end-to-end de flujos
- Tests de conexión a BD real
- Tests de MCP protocol

### Load Tests
- Simulación de múltiples requests
- Stress testing de connection pool
- Performance benchmarks

---

## Roadmap Técnico

### Fase 1 (Actual) ✅
- [x] MCP server básico
- [x] Herramientas financieras core
- [x] Conexión a MySQL
- [x] Deployment en Coolify

### Fase 2 (Próximo)
- [ ] Frontend React completo
- [ ] Integración con IA (OpenAI/Claude)
- [ ] Autenticación y autorización
- [ ] API REST adicional

### Fase 3 (Futuro)
- [ ] Caching con Redis
- [ ] Real-time updates con WebSockets
- [ ] Machine Learning para predicciones
- [ ] Multi-tenancy

---

## Tecnologías Utilizadas

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Runtime | Python | 3.11+ | Backend logic |
| Protocol | MCP | 1.0+ | Client-server communication |
| Database | MySQL | 8.0+ | Data persistence |
| ORM | SQLAlchemy | 2.0+ | Database abstraction |
| Connector | mysql-connector | 8.0+ | MySQL driver |
| Data Processing | Pandas | 2.0+ | Excel & data analysis |
| Server | FastAPI | 0.104+ | REST API (optional) |
| Container | Docker | Latest | Containerization |
| Deployment | Coolify | Latest | Cloud deployment |

---

## Contacto y Contribución

Para más información sobre la arquitectura o para contribuir, contactar al equipo de desarrollo.

