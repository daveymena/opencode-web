#!/bin/bash
set -e

export PATH="/home/opencode/.opencode/bin:/home/opencode/.local/bin:$PATH"

echo "==> Iniciando OpenCode Web Server v$(opencode --version 2>/dev/null || echo 'desconocida')"

if [ -n "$OPENCODE_SERVER_PASSWORD" ]; then
  echo "==> Autenticación habilitada"
else
  echo "==> ADVERTENCIA: OPENCODE_SERVER_PASSWORD no configurado — acceso sin contraseña"
fi

if [ -n "$DATABASE_URL" ]; then
  echo "==> Base de datos: $DATABASE_URL" | sed 's|//.*:.*@|//***:***@|'
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "==> Proveedor activo: Anthropic (Claude)"
fi
if [ -n "$OPENAI_API_KEY" ]; then
  echo "==> Proveedor activo: OpenAI"
fi
if [ -n "$GEMINI_API_KEY" ]; then
  echo "==> Proveedor activo: Google Gemini"
fi

PORT="${OPENCODE_PORT:-4096}"
echo "==> Arrancando interfaz web en 0.0.0.0:$PORT ..."

exec opencode web \
  --port "$PORT" \
  --hostname 0.0.0.0
