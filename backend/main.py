"""
Punto de entrada principal para el servidor MCP Financiero.
Inicia el servidor MCP sobre HTTP usando FastMCP.
"""

import os
import sys
from pathlib import Path

# Agregar el directorio src al PYTHONPATH
backend_dir = Path(__file__).parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(src_dir))

if __name__ == "__main__":
    from utils import setup_logger
    import logging
    import asyncio
    
    logger = setup_logger('main', logging.INFO)
    
    port = int(os.getenv("PORT", 8080))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info("=" * 60)
    logger.info("🚀 INICIANDO SERVIDOR MCP FINANCIERO SOBRE HTTP")
    logger.info("=" * 60)
    logger.info(f"Puerto: {port}")
    logger.info(f"Host: {host}")
    logger.info(f"Protocolo: MCP sobre HTTP (streamable-http)")
    logger.info(f"Entorno: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"DB Host: {os.getenv('DB_HOST', 'no configurado')}")
    logger.info("=" * 60)
    
    # Importar el servidor MCP sobre HTTP
    from mcp_http_server import mcp, initialize_server
    
    # Inicializar el servidor
    initialize_server()
    
    # Ejecutar el servidor MCP sobre HTTP
    # streamable-http es el transporte correcto para Coolify y despliegues HTTP
    asyncio.run(
        mcp.run_async(
            transport="streamable-http",
            host=host,
            port=port,
        )
    )