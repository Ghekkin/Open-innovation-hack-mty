"""Database connection management."""
import os
import logging
from typing import Optional
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Manages MySQL database connections with connection pooling."""
    
    _instance: Optional['DatabaseConnection'] = None
    _pool: Optional[pooling.MySQLConnectionPool] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._pool is None:
            self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize the connection pool."""
        try:
            db_config = {
                'host': os.getenv('DB_HOST', '72.60.123.201'),
                'port': int(os.getenv('DB_PORT', 5441)),
                'user': os.getenv('DB_USER', 'mysql'),
                'password': os.getenv('DB_PASSWORD'),
                'database': os.getenv('DB_NAME', 'oi_banorte'),
                'pool_name': 'mcp_pool',
                'pool_size': 5,
                'pool_reset_session': True,
                'charset': 'utf8mb4',
                'use_unicode': True
            }
            
            self._pool = pooling.MySQLConnectionPool(**db_config)
            logger.info("Database connection pool initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing database pool: {e}")
            raise
    
    def get_connection(self):
        """Get a connection from the pool."""
        try:
            return self._pool.get_connection()
        except Exception as e:
            logger.error(f"Error getting connection from pool: {e}")
            raise
    
    def execute_query(self, query: str, params: tuple = None, fetch: bool = True):
        """
        Execute a query and return results.
        
        Args:
            query: SQL query to execute
            params: Query parameters
            fetch: Whether to fetch results (SELECT) or just execute (INSERT/UPDATE)
        
        Returns:
            Query results or affected rows count
        """
        connection = None
        cursor = None
        
        try:
            connection = self.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            cursor.execute(query, params or ())
            
            if fetch:
                results = cursor.fetchall()
                return results
            else:
                connection.commit()
                return cursor.rowcount
                
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            if connection:
                connection.rollback()
            raise
            
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def test_connection(self) -> bool:
        """Test database connection."""
        try:
            connection = self.get_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            connection.close()
            logger.info("Database connection test successful")
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False


def get_db_connection() -> DatabaseConnection:
    """Get the database connection singleton."""
    return DatabaseConnection()

