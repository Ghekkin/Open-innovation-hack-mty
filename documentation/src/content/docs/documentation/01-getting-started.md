---
title: Guía de Inicio Rápido
---

### Prerrequisitos
Asegúrate de tener instalado el siguiente software:
- **Node.js**: v18 o superior.
- **Python**: v3.9 o superior.
- **Git**: Para clonar y gestionar el repositorio.
- **Docker y Docker Compose**: (Opcional pero recomendado) Para levantar la base de datos MySQL de forma aislada.

### Configuración de la Base de Datos
El backend requiere una base de datos MySQL.
- **Opción A (Recomendada - Docker):**
  1. Navega a la carpeta `backend`.
  2. Ejecuta `docker-compose up -d`. Esto levantará un servicio de MySQL preconfigurado.
- **Opción B (Manual):**
  1. Instala un servidor MySQL.
  2. Crea una base de datos.
  3. Carga los datos de los archivos `.xlsx` de la carpeta `recursos` en las tablas correspondientes.

### Configuración del Backend (Servidor MCP)
1. **Navega al directorio del backend:**
   ```bash
   cd backend
   ```
2. **Crea y activa un entorno virtual:**
   ```bash
   python -m venv .venv
   # En macOS/Linux:
   source .venv/bin/activate
   # En Windows:
   .venv\Scripts\activate
   ```
3. **Instala las dependencias:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configura las variables de entorno:**
   Crea un archivo `.env` en la raíz de la carpeta `backend` y configúralo. Si usaste Docker, las credenciales por defecto son:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=user
   DB_PASSWORD=password
   DB_NAME=financial_data
   DB_PORT=3306
   ```
5. **Ejecuta el servidor:**
   ```bash
   python src/mcp_http_server.py
   ```
   El servidor MCP estará escuchando en `http://localhost:8080`.

### Configuración del Frontend (Interfaz de Usuario)
1. **Abre una nueva terminal y navega al directorio del frontend:**
   ```bash
   cd frontend
   ```
2. **Instala las dependencias:**
   ```bash
   npm install
   ```
3. **Ejecuta el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación web estará disponible en `http://localhost:3000`.
