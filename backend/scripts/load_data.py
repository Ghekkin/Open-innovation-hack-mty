"""
Script para cargar datos de los archivos Excel a la base de datos.
Procesa los archivos de finanzas empresariales y personales.
"""

import os
import sys
import pandas as pd
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from database import get_db_connection
from utils import setup_logger

logger = setup_logger('data_loader', logging.INFO)


def load_company_data(excel_path: str) -> int:
    """
    Carga datos empresariales desde Excel a la base de datos.
    
    Args:
        excel_path: Ruta al archivo Excel de finanzas empresariales
    
    Returns:
        Número de registros insertados
    """
    try:
        # Leer Excel
        df = pd.read_excel(excel_path)
        logger.info(f"Leyendo archivo: {excel_path}")
        logger.info(f"Columnas encontradas: {df.columns.tolist()}")
        logger.info(f"Total de registros: {len(df)}")
        
        # Obtener conexión a BD
        db = get_db_connection()
        
        # Crear tabla si no existe
        create_table_query = """
        CREATE TABLE IF NOT EXISTS transacciones_empresa (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_empresa VARCHAR(50),
            fecha DATE,
            tipo_operacion VARCHAR(20),
            concepto VARCHAR(255),
            categoria VARCHAR(100),
            monto DECIMAL(15, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_empresa (id_empresa),
            INDEX idx_fecha (fecha),
            INDEX idx_tipo (tipo_operacion),
            INDEX idx_categoria (categoria)
        )
        """
        db.execute_query(create_table_query, fetch=False)
        logger.info("Tabla transacciones_empresa verificada/creada")
        
        # Insertar datos
        insert_query = """
        INSERT INTO transacciones_empresa 
        (id_empresa, fecha, tipo_operacion, concepto, categoria, monto)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        inserted = 0
        for _, row in df.iterrows():
            try:
                # Ajustar nombres de columnas según tu Excel
                # Esto es un ejemplo, ajusta según tus columnas reales
                params = (
                    row.get('id_empresa', 'EMP001'),
                    row.get('fecha'),
                    row.get('tipo_operacion', 'gasto'),
                    row.get('concepto', ''),
                    row.get('categoria', 'Otros'),
                    float(row.get('monto', 0))
                )
                
                db.execute_query(insert_query, params, fetch=False)
                inserted += 1
                
            except Exception as e:
                logger.warning(f"Error insertando fila: {e}")
                continue
        
        logger.info(f"Total de registros empresariales insertados: {inserted}")
        return inserted
        
    except Exception as e:
        logger.error(f"Error cargando datos empresariales: {e}")
        raise


def load_personal_data(excel_path: str) -> int:
    """
    Carga datos personales desde Excel a la base de datos.
    
    Args:
        excel_path: Ruta al archivo Excel de finanzas personales
    
    Returns:
        Número de registros insertados
    """
    try:
        # Leer Excel
        df = pd.read_excel(excel_path)
        logger.info(f"Leyendo archivo: {excel_path}")
        logger.info(f"Columnas encontradas: {df.columns.tolist()}")
        logger.info(f"Total de registros: {len(df)}")
        
        # Obtener conexión a BD
        db = get_db_connection()
        
        # Crear tabla si no existe
        create_table_query = """
        CREATE TABLE IF NOT EXISTS transacciones_personales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_usuario VARCHAR(50),
            fecha DATE,
            tipo_operacion VARCHAR(20),
            descripcion VARCHAR(255),
            categoria VARCHAR(100),
            monto DECIMAL(15, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_usuario (id_usuario),
            INDEX idx_fecha (fecha),
            INDEX idx_tipo (tipo_operacion),
            INDEX idx_categoria (categoria)
        )
        """
        db.execute_query(create_table_query, fetch=False)
        logger.info("Tabla transacciones_personales verificada/creada")
        
        # Insertar datos
        insert_query = """
        INSERT INTO transacciones_personales 
        (id_usuario, fecha, tipo_operacion, descripcion, categoria, monto)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        inserted = 0
        for _, row in df.iterrows():
            try:
                # Ajustar nombres de columnas según tu Excel
                params = (
                    row.get('id_usuario', 'USR001'),
                    row.get('fecha'),
                    row.get('tipo_operacion', 'gasto'),
                    row.get('descripcion', ''),
                    row.get('categoria', 'Otros'),
                    float(row.get('monto', 0))
                )
                
                db.execute_query(insert_query, params, fetch=False)
                inserted += 1
                
            except Exception as e:
                logger.warning(f"Error insertando fila: {e}")
                continue
        
        logger.info(f"Total de registros personales insertados: {inserted}")
        return inserted
        
    except Exception as e:
        logger.error(f"Error cargando datos personales: {e}")
        raise


def main():
    """Script principal."""
    logger.info("=== Cargador de Datos Financieros ===")
    
    # Rutas a los archivos Excel
    recursos_dir = Path(__file__).parent.parent.parent / 'recursos'
    empresa_file = recursos_dir / 'finanzas_empresa.xlsx'
    personal_file = recursos_dir / 'finanzas_personales.xlsx'
    
    try:
        # Verificar archivos
        if empresa_file.exists():
            logger.info(f"Procesando datos empresariales...")
            company_count = load_company_data(str(empresa_file))
            logger.info(f"✓ {company_count} registros empresariales cargados")
        else:
            logger.warning(f"Archivo no encontrado: {empresa_file}")
        
        if personal_file.exists():
            logger.info(f"Procesando datos personales...")
            personal_count = load_personal_data(str(personal_file))
            logger.info(f"✓ {personal_count} registros personales cargados")
        else:
            logger.warning(f"Archivo no encontrado: {personal_file}")
        
        logger.info("=== Carga completada ===")
        
    except Exception as e:
        logger.error(f"Error en la carga de datos: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

