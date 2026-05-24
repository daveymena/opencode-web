@echo off
REM Script para ejecutar OpenCode Platform localmente en Windows

echo.
echo ╔════════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                                ║
echo ║                    🚀 EJECUTANDO OPENCODE PLATFORM LOCALMENTE                  ║
echo ║                                                                                ║
echo ╚════════════════════════════════════════════════════════════════════════════════╝
echo.

REM Verificar si Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado o no está en el PATH
    exit /b 1
)

echo ✅ Docker encontrado
echo.

REM Verificar si docker-compose.yml existe
if not exist docker-compose.yml (
    echo ❌ docker-compose.yml no encontrado
    exit /b 1
)

echo ✅ docker-compose.yml encontrado
echo.

REM Iniciar Docker Compose
echo 🐳 Iniciando Docker Compose...
docker-compose up -d

if errorlevel 1 (
    echo ❌ Error al iniciar Docker Compose
    exit /b 1
)

echo.
echo ⏳ Esperando a que PostgreSQL esté listo...
timeout /t 10 /nobreak

echo.
echo 📦 Instalando dependencias de Node.js...
cd opencode-server
call npm install --production

if errorlevel 1 (
    echo ❌ Error al instalar dependencias
    exit /b 1
)

echo.
echo 🚀 Iniciando servidor...
call npm start

