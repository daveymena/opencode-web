#!/bin/bash

# Script para ejecutar OpenCode Platform localmente

set -e

echo "
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                    🚀 EJECUTANDO OPENCODE PLATFORM LOCALMENTE                  ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
"

# Cargar variables de entorno
if [ -f .env.local ]; then
    echo "📝 Cargando variables de entorno desde .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ Archivo .env.local no encontrado"
    exit 1
fi

echo ""
echo "🐳 Iniciando Docker Compose..."
echo ""

# Iniciar servicios
docker-compose up -d

echo ""
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 10

echo ""
echo "📦 Instalando dependencias de Node.js..."
cd opencode-server
npm install --production

echo ""
echo "🚀 Iniciando servidor..."
npm start

