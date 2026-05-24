#!/bin/bash

# Script de validación pre-despliegue
# Ejecutar: bash validate-deployment.sh

set -e

echo "🔍 Validando configuración de despliegue..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# Función para verificar archivo
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 existe"
  else
    echo -e "${RED}✗${NC} $1 NO EXISTE"
    ((errors++))
  fi
}

# Función para verificar contenido
check_content() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contiene '$2'"
  else
    echo -e "${RED}✗${NC} $1 NO contiene '$2'"
    ((errors++))
  fi
}

# Función para advertencia
warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((warnings++))
}

echo "📋 Verificando archivos críticos..."
check_file "Dockerfile"
check_file "package.json"
check_file "package-lock.json"
check_file ".dockerignore"
check_file ".env.example"
check_file "easypanel.yml"
check_file "entrypoint.sh"
check_file "server/index.js"
check_file "server/db.js"
check_file "server/instances.js"
check_file "public/login.html"
check_file "public/register.html"
check_file "public/loading.html"
echo ""

echo "🔐 Verificando seguridad..."
if grep -r "6715320D" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null; then
  warn "Credenciales hardcodeadas encontradas (6715320D)"
fi

if grep -r "tecnovariedades_opencode-db" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null; then
  warn "Nombre de host específico encontrado (tecnovariedades_opencode-db)"
fi

if [ -f ".env" ]; then
  warn ".env existe — asegúrate de que NO está en .gitignore"
fi
echo ""

echo "📦 Verificando dependencias..."
check_content "package.json" "express"
check_content "package.json" "pg"
check_content "package.json" "bcryptjs"
check_content "package.json" "cookie-parser"
check_content "package.json" "http-proxy-middleware"
echo ""

echo "🐳 Verificando Dockerfile..."
check_content "Dockerfile" "FROM node"
check_content "Dockerfile" "npm ci"
check_content "Dockerfile" "EXPOSE 4096"
check_content "Dockerfile" "HEALTHCHECK"
echo ""

echo "⚙️ Verificando configuración..."
check_content "easypanel.yml" "type: app"
check_content "easypanel.yml" "DATABASE_URL"
check_content "easypanel.yml" "OPENCODE_BASE_PORT"
check_content "easypanel.yml" "mounts:"
echo ""

echo "🔌 Verificando puertos..."
check_content "easypanel.yml" "4096"
check_content "server/index.js" "4096"
echo ""

echo "📝 Verificando código..."
check_content "server/index.js" "requireAuth"
check_content "server/index.js" "createProxyMiddleware"
check_content "server/db.js" "CREATE TABLE IF NOT EXISTS"
check_content "server/instances.js" "spawn"
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✓ Validación completada sin errores${NC}"
else
  echo -e "${RED}✗ Se encontraron $errors errores${NC}"
fi

if [ $warnings -gt 0 ]; then
  echo -e "${YELLOW}⚠ Se encontraron $warnings advertencias${NC}"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $errors -gt 0 ]; then
  exit 1
fi

echo "✅ Listo para desplegar en EasyPanel"
echo ""
echo "Próximos pasos:"
echo "1. Cambiar 'CHANGE_ME' en easypanel.yml por credenciales reales"
echo "2. Subir a GitHub: git push origin main"
echo "3. En EasyPanel: crear servicio PostgreSQL y App"
echo "4. Configurar variables de entorno en EasyPanel"
echo "5. Asignar dominio y habilitar HTTPS"
echo ""
