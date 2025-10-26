"""
Script de inicio para el servidor MCP.
Configura el PYTHONPATH y ejecuta el servidor.
"""

import sys
import os
from pathlib import Path

# Agregar el directorio src al PYTHONPATH
backend_dir = Path(__file__).parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(src_dir))

# Configurar variables de entorno
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Cambiar al directorio src
os.chdir(src_dir)

# Importar y ejecutar el servidor
if __name__ == "__main__":
    print("=" * 60)
    print("   MCP FINANCIERO - SERVIDOR BACKEND")
    print("   Reto Banorte - HackTec 2025")
    print("=" * 60)
    print()
    
    try:
        from mcp_server import main
        import asyncio
        
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nServidor detenido por el usuario.")
    except Exception as e:
        print(f"\nError al iniciar el servidor: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

