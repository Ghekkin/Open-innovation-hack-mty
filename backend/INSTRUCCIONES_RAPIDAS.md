# 🚀 Instrucciones Rápidas - MCP Financiero

## ✅ Todo está listo, solo sigue estos pasos:

### 1️⃣ Probar Conexión a Base de Datos

```powershell
cd C:\Open-innovation-hack-mty\backend
.\venv\Scripts\Activate.ps1
python scripts\test_connection.py
```

**Resultado esperado:** "Test completado exitosamente"

---

### 2️⃣ Iniciar el Servidor MCP

#### Opción A: PowerShell (Recomendado)

```powershell
cd C:\Open-innovation-hack-mty\backend
.\start_server.ps1
```

#### Opción B: CMD

```cmd
cd C:\Open-innovation-hack-mty\backend
start_server.bat
```

#### Opción C: Manualmente

```powershell
cd C:\Open-innovation-hack-mty\backend
.\venv\Scripts\Activate.ps1
$env:PYTHONPATH = "$PWD\src"
python run_server.py
```

---

### 3️⃣ El servidor debería mostrar:

```
=== MCP Financiero Server ===
Servidor MCP para análisis financiero inteligente
Conexión a base de datos establecida exitosamente
Ready to accept connections...
```

---

## 🎯 ¿Qué hacer después?

El servidor MCP ya está corriendo y listo para recibir conexiones.

Ahora puedes:
1. **Conectar un cliente MCP** desde tu aplicación
2. **Desarrollar el frontend** que use este servidor
3. **Probar las herramientas** directamente

---

## 🛠️ Herramientas Disponibles

1. `get_company_balance` - Balance empresarial
2. `get_personal_balance` - Balance personal
3. `analyze_expenses_by_category` - Análisis de gastos
4. `project_cash_flow` - Proyección de flujo de caja
5. `simulate_financial_scenario` - Simulador what-if
6. `compare_budget_vs_actual` - Comparación presupuesto

---

## ⚠️ Problemas Comunes

### Error: "No module named 'mcp'"

**Solución:**
```powershell
cd C:\Open-innovation-hack-mty\backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Error: No se puede conectar a la base de datos

**Solución:**
1. Verificar que el archivo `.env` existe en `backend/`
2. Verificar credenciales en `.env`
3. Probar con: `python scripts\test_connection.py`

### Error: "Cannot find path"

**Solución:**
Asegúrate de estar en el directorio correcto:
```powershell
cd C:\Open-innovation-hack-mty\backend
```

---

## 📚 Más Información

- **README.md** - Documentación completa
- **QUICKSTART.md** - Guía de inicio paso a paso
- **ARCHITECTURE.md** - Arquitectura del sistema
- **DEPLOYMENT.md** - Guía de deployment

---

## 💡 Tip Rápido

Para desarrollo, usa los scripts creados:
- **PowerShell:** `.\start_server.ps1`
- **CMD:** `start_server.bat`

Ambos configuran automáticamente todo lo necesario.

---

**¡El backend está completo y funcionando! 🚀**

