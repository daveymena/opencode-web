#!/bin/bash
set -e

export PATH="/home/opencode/.opencode/bin:/home/opencode/.local/bin:$PATH"

echo "==> Iniciando OpenCode Platform Server"
echo "==> Node.js: $(node --version)"
echo "==> npm: $(npm --version)"

# Verificar variables críticas
if [ -z "$DATABASE_URL" ] && [ -z "$PGHOST" ]; then
  echo "❌ ERROR: DATABASE_URL o PGHOST no configurados"
  exit 1
fi

if [ -n "$DATABASE_URL" ]; then
  echo "==> Base de datos: $(echo $DATABASE_URL | sed 's|//.*:.*@|//***:***@|')"
else
  echo "==> Base de datos: $PGUSER@$PGHOST:$PGPORT/$PGDATABASE"
fi

echo "==> Puerto: ${PORT:-4096}"
echo "==> Entorno: ${NODE_ENV:-development}"

# Crear directorios necesarios
mkdir -p "${WORKSPACE_ROOT:-/workspace}"
mkdir -p "${CONFIG_ROOT:-/home/opencode/.config/opencode/users}"
mkdir -p "${DATA_ROOT:-/home/opencode/.local/share/opencode/users}"

echo "==> Iniciando servidor..."
exec node server/index.js
