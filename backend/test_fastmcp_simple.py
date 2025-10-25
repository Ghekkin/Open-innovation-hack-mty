"""
Servidor MCP simple para probar FastMCP.
"""

import logging
from fastmcp import FastMCP

# Configuración del registro
logging.basicConfig(format="[%(levelname)s]: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicialización del servidor MCP
mcp = FastMCP("Test MCP Server")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Suma dos números enteros."""
    logger.info(f"Sumando {a} + {b}")
    return a + b

@mcp.tool()
def subtract(a: int, b: int) -> int:
    """Resta dos números enteros."""
    logger.info(f"Restando {a} - {b}")
    return a - b

if __name__ == "__main__":
    logger.info("🚀 Iniciando servidor MCP de prueba en puerto 8080")
    mcp.run(transport="sse", host="0.0.0.0", port=8080)

