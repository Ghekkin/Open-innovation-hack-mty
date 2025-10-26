---
title: Arquitectura de la Solución
---

### Diagrama de Arquitectura y Flujo de Datos
La arquitectura está diseñada para ser modular, escalable y mantenible, separando claramente la presentación, la lógica de negocio y los datos.

**Diagrama de Flujo Lógico:**
<Code code={`
+-----------------------+      +-------------------------+      +--------------------------+      +--------------------+
|      Frontend         |      |     API Gateway         |      |      Backend (MCP)       |      |     Base de Datos  |
| (Next.js / React)     | <--> |  (Next.js API Route)    | <--> |    (Python / FastMCP)    | <--> |      (MySQL)       |
+-----------------------+      +-------------------------+      +--------------------------+      +--------------------+
           ^                             ^                                |
           |                             |                                v
           |                             |                  +--------------------------+
           +-----------------------------+                  | Herramientas Financieras |
                                                            | (Análisis, Proyección..) |
                                                            +--------------------------+
`} />

**Ciclo de Vida de una Solicitud (Ej: "Cuánto gasté este mes?"):**
1.  **Usuario**: Escribe la pregunta en la interfaz de chat (Frontend).
2.  **Frontend**: El componente React (`asistente/page.tsx`) captura el texto y realiza una petición `POST` a su propia API local: `/api/chat`.
3.  **API Gateway**: La ruta API de Next.js (`/api/chat/route.ts`) recibe la petición. Su rol es actuar como un proxy seguro, reenviando la solicitud al servidor backend de Python en `http://localhost:8080`.
4.  **Backend (MCP)**: El servidor `FastMCP` recibe la llamada JSON-RPC. Un modelo de lenguaje (o un router basado en intenciones) interpreta la pregunta y determina que la herramienta `get_current_month_spending` es la más adecuada.
5.  **Herramienta Financiera**: El servidor invoca la función `get_current_month_spending_summary()`.
6.  **Base de Datos**: La herramienta consulta la base de datos MySQL para obtener todas las transacciones del mes actual para el usuario especificado.
7.  **Respuesta**: La herramienta procesa los datos y devuelve un resultado estructurado (ej. `{"total_spent": 1500, "transactions": 42}`).
8.  **Flujo Inverso**: La respuesta viaja de vuelta a través del Backend -> API Gateway -> Frontend, donde la interfaz de usuario la formatea en un mensaje legible para el usuario.

### Principios de Diseño
- **Desacoplamiento Fuerte**: El frontend y el backend son aplicaciones completamente independientes. El frontend no sabe nada sobre la lógica de negocio interna del backend, solo cómo comunicarse con su API. Esto permite que los equipos trabajen en paralelo y que las tecnologías se actualicen de forma independiente.
- **Lógica de Negocio Centralizada**: Toda la inteligencia reside en el backend (las herramientas MCP). Esto asegura que las reglas de negocio sean consistentes y no estén duplicadas en el cliente.
- **Comunicación por Contrato (API)**: La comunicación se basa en un contrato estricto definido por las herramientas MCP (nombre, parámetros, tipo de retorno). Esto hace que la integración sea predecible y fácil de depurar.
- **Seguridad a través de Proxy**: El uso de una API Route de Next.js como gateway evita exponer el servidor de Python directamente a internet y simplifica la gestión de CORS y la posible adición de autenticación en el futuro.

### Diseño y Estructura de la Base de Datos
En el núcleo de MCP Financiero se encuentra una robusta arquitectura de base de datos implementada en MySQL 8.0+. La elección de MySQL no es casual: su combinación de rendimiento, confiabilidad y amplia adopción en la industria lo convierte en la opción ideal para nuestras necesidades.

La base de datos está diseñada con un enfoque dual, separando cuidadosamente los datos financieros empresariales de los personales. Esta separación nos permite implementar políticas de privacidad y seguridad específicas para cada tipo de dato, y facilita la implementación de análisis especializados.

### Tablas Principales
| Tabla | Campos Clave | Descripción |
|---|---|---|
| transacciones_empresa | id_empresa, fecha, tipo_operacion, categoria, monto | Almacena todas las transacciones empresariales con clasificación por categoría |
| transacciones_personales | id_usuario, fecha, categoria, monto | Registra transacciones individuales con enfoque en gestión personal |
| presupuestos | id_empresa, mes, año, categoria, monto_presupuestado | Define presupuestos planificados para comparativas con gastos reales |

**Importante:** Las fechas se almacenan en formato UTC para consistencia en análisis temporales, y los montos se guardan como DECIMAL(15,2) para precisión en cálculos financieros.