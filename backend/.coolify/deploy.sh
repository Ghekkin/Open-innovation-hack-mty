#!/bin/bash
# Script de deployment para Coolify

echo "=== Iniciando deployment MCP Financiero ==="

# Build Docker image
echo "Building Docker image..."
docker build -t mcp-financiero:latest .

# Run database migrations/setup if needed
echo "Checking database connection..."
python scripts/test_connection.py

# Optional: Load initial data
# echo "Loading initial data..."
# python scripts/load_data.py

echo "=== Deployment completado ==="

