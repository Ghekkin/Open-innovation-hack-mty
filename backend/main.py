"""
Punto de entrada principal para el servidor MCP Financiero.
Inicia el servidor HTTP para que pueda ser usado con Gemini y otros clientes.
"""

import os
import sys
from pathlib import Path

# Agregar el directorio src al PYTHONPATH
backend_dir = Path(__file__).parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(src_dir))

if __name__ == "__main__":
    import uvicorn
    from utils import setup_logger
    import logging
    
    logger = setup_logger('main', logging.INFO)
    
    port = int(os.getenv("PORT", 8080))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info("=" * 60)
    logger.info("🚀 INICIANDO SERVIDOR MCP FINANCIERO")
    logger.info("=" * 60)
    logger.info(f"Puerto: {port}")
    logger.info(f"Host: {host}")
    logger.info(f"Entorno: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"DB Host: {os.getenv('DB_HOST', 'no configurado')}")
    logger.info("=" * 60)
    
    # Importar la app después de configurar el path
    from http_server import app
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )