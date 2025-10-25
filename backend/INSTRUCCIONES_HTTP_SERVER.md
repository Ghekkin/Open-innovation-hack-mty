# 🚀 Servidor HTTP REST API - Banorte

## Descripción
Este servidor HTTP expone las herramientas MCP como endpoints REST para que el frontend pueda consumirlos.

## 📋 Requisitos Previos

1. **Base de Datos MySQL configurada** con las tablas:
   - `finanzas_empresa`
   - `finanzas_personales`

2. **Variables de entorno** configuradas en `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=nombre_base_datos
   ```

3. **Dependencias instaladas**:
   ```bash
   pip install -r requirements.txt
   ```

## 🏃 Cómo Iniciar el Servidor

### Opción 1: Script de Python
```bash
python start_http_server.py
```

### Opción 2: Directamente con uvicorn
```bash
cd src
uvicorn http_server:app --reload --host 0.0.0.0 --port 8000
```

### Opción 3: PowerShell (Windows)
```powershell
python start_http_server.py
```

## 📍 Endpoints Disponibles

### 1. Balance de Empresa
```
GET http://localhost:8000/api/balance/company?company_id=EMPRESA001
```

**Respuesta:**
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

### 2. Gastos por Categoría
```
GET http://localhost:8000/api/expenses/category?company_id=EMPRESA001
```

**Respuesta:**
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

### 3. Proyección de Flujo de Caja
```
GET http://localhost:8000/api/projection/cash-flow?company_id=EMPRESA001&months=3
```

## 📖 Documentación Interactiva

Una vez iniciado el servidor, accede a:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔧 Configuración del Frontend

En el frontend (Next.js), asegúrate de tener configurada la variable de entorno:

```env
# frontend/.env
BACKEND_URL=http://localhost:8000
```

## ✅ Verificar que Funciona

1. Inicia el servidor HTTP
2. Abre tu navegador en http://localhost:8000
3. Deberías ver un mensaje de bienvenida con los endpoints disponibles

## 🐛 Troubleshooting

### Error: "No module named 'tools'"
**Solución:** Asegúrate de estar en el directorio correcto:
```bash
cd backend
python start_http_server.py
```

### Error: "Can't connect to MySQL server"
**Solución:** Verifica que:
1. MySQL esté corriendo
2. Las credenciales en `.env` sean correctas
3. La base de datos exista

### Error: "Port 8000 is already in use"
**Solución:** Cambia el puerto en `start_http_server.py`:
```python
uvicorn.run(..., port=8001)
```

## 📊 Datos de Prueba

El sistema usa la empresa `EMPRESA001` por defecto. Asegúrate de tener datos en la base de datos para esta empresa.

## 🔐 CORS

El servidor está configurado para aceptar peticiones desde:
- http://localhost:3000
- http://localhost:3001

Si necesitas agregar más orígenes, edita `src/http_server.py`:
```python
allow_origins=["http://localhost:3000", "http://localhost:3001", "tu_url_aqui"]
```

