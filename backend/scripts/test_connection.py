"""
Script para probar la conexión a la base de datos.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from database import get_db_connection
from utils import setup_logger
import logging

logger = setup_logger('test_connection', logging.INFO)


def test_database_connection():
    """Prueba la conexión a la base de datos."""
    try:
        logger.info("=== Test de Conexión a Base de Datos ===")
        
        # Get database connection
        db = get_db_connection()
        
        # Test connection
        if db.test_connection():
            logger.info("✓ Conexión exitosa a la base de datos")
            
            # Test query
            result = db.execute_query("SELECT DATABASE() as db_name, VERSION() as version")
            if result:
                logger.info(f"✓ Base de datos: {result[0]['db_name']}")
                logger.info(f"✓ Versión MySQL: {result[0]['version']}")
            
            # Check tables
            tables_result = db.execute_query("SHOW TABLES")
            if tables_result:
                logger.info(f"✓ Tablas encontradas: {len(tables_result)}")
                for table in tables_result:
                    table_name = list(table.values())[0]
                    logger.info(f"  - {table_name}")
            else:
                logger.info("ℹ No hay tablas en la base de datos")
            
            logger.info("=== Test completado exitosamente ===")
            return True
        else:
            logger.error("✗ Fallo en la conexión a la base de datos")
            return False
            
    except Exception as e:
        logger.error(f"✗ Error durante el test: {e}")
        return False


if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)

