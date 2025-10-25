"""
Script para iniciar el servidor HTTP REST API
"""
import sys
import os

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

if __name__ == "__main__":
    import uvicorn
    from src.http_server import app
    
    print("=" * 60)
    print("🚀 Iniciando API Financiera Banorte")
    print("=" * 60)
    print("📍 URL: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "src.http_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

