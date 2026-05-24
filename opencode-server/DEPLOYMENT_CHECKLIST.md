# ✅ Checklist de Despliegue en EasyPanel

## Antes de subir a EasyPanel

### 1. Verificación de archivos
- [x] `Dockerfile` — Usa Node.js Alpine (optimizado)
- [x] `package.json` — Todas las dependencias listadas
- [x] `package-lock.json` — Presente para reproducibilidad
- [x] `.dockerignore` — Excluye archivos innecesarios
- [x] `.env.example` — Sin credenciales reales
- [x] `easypanel.yml` — Configuración correcta
- [x] `entrypoint.sh` — Script de inicio mejorado

### 2. Verificación de código
- [x] `server/index.js` — Express configurado correctamente
- [x] `server/db.js` — Conexión PostgreSQL robusta
- [x] `server/instances.js` — Gestión de procesos OpenCode
- [x] `public/login.html` — Página de login presente
- [x] `public/register.html` — Página de registro presente
- [x] `public/loading.html` — Página de carga presente

### 3. Verificación de seguridad
- [x] Credenciales NO hardcodeadas en código
- [x] `.env` NO incluido en `.gitignore` (será ignorado)
- [x] Variables de entorno en `easypanel.yml` con placeholders
- [x] Contraseñas hasheadas con bcryptjs
- [x] Cookies con `httpOnly` y `secure` en producción

### 4. Verificación de dependencias
```json
{
  "bcryptjs": "^2.4.3",           // Hashing de contraseñas
  "cookie-parser": "^1.4.7",      // Manejo de cookies
  "dotenv": "^16.4.5",            // Variables de entorno
  "express": "^4.19.2",           // Framework web
  "http-proxy-middleware": "^3.0.3", // Proxy a OpenCode
  "pg": "^8.12.0",                // Cliente PostgreSQL
  "uuid": "^10.0.0"               // Generación de IDs
}
```

### 5. Verificación de puertos
- [x] Puerto 4096 — Aplicación principal
- [x] Puerto 5100+ — Instancias OpenCode por usuario
- [x] Puerto 5432 — PostgreSQL (interno en EasyPanel)

### 6. Verificación de volúmenes
- [x] `/workspace` — Proyectos de usuarios
- [x] `/home/opencode/.config/opencode/users` — Configuración
- [x] `/home/opencode/.local/share/opencode/users` — Datos

---

## Pasos en EasyPanel

### 1. Crear servicio PostgreSQL
```
Nombre: opencode-db
Puerto: 5432 (interno)
Usuario: postgres
Contraseña: [generada automáticamente]
Base de datos: opencode
```

### 2. Crear servicio App
```
Nombre: opencode-app
Fuente: GitHub → tu-repo/opencode-server
Build: Dockerfile
Puerto: 4096
```

### 3. Configurar variables de entorno
```
NODE_ENV=production
PORT=4096
DATABASE_URL=postgres://postgres:PASSWORD@opencode-db:5432/opencode?sslmode=disable
PGHOST=opencode-db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=PASSWORD
PGDATABASE=opencode
OPENCODE_BASE_PORT=5100
WORKSPACE_ROOT=/workspace
CONFIG_ROOT=/home/opencode/.config/opencode/users
DATA_ROOT=/home/opencode/.local/share/opencode/users
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

### 4. Configurar volúmenes
```
/workspace → opencode-workspace
/home/opencode/.config/opencode → opencode-config
/home/opencode/.local/share/opencode → opencode-data
```

### 5. Asignar dominio
```
Dominio: tudominio.com
Puerto: 4096
```

---

## Verificación post-despliegue

### 1. Acceso a la aplicación
```bash
curl https://tudominio.com/login
# Debe devolver HTML de login
```

### 2. Registro de usuario
```bash
curl -X POST https://tudominio.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123"
  }'
# Debe devolver: {"ok": true, "redirect": "/app"}
```

### 3. Inicio de sesión
```bash
curl -X POST https://tudominio.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
# Debe devolver: {"ok": true, "redirect": "/app"}
```

### 4. Acceso a OpenCode
```bash
# Después de iniciar sesión, accede a:
https://tudominio.com/app
# Debe mostrar pantalla de carga y luego OpenCode
```

### 5. Verificar logs
```bash
# En EasyPanel → Logs de la app
# Debe mostrar:
# [opencode-platform] Servidor en http://0.0.0.0:4096
# [db] Tablas inicializadas
```

---

## Solución de problemas

### Error: "Cannot find module 'express'"
**Causa**: `npm install` no se ejecutó en el Dockerfile
**Solución**: Verificar que `package.json` y `package-lock.json` existen

### Error: "ECONNREFUSED 127.0.0.1:5432"
**Causa**: PostgreSQL no está disponible
**Solución**: Verificar que el servicio `opencode-db` está corriendo en EasyPanel

### Error: "HEALTHCHECK failed"
**Causa**: La app no responde en 90 segundos
**Solución**: Aumentar `start-period` en Dockerfile o revisar logs

### Error: "OpenCode no inicia"
**Causa**: Falta instalar OpenCode en el Dockerfile
**Solución**: Verificar que `curl -fsSL https://opencode.ai/install | bash` se ejecuta

---

## Notas importantes

1. **Credenciales**: Cambiar `CHANGE_ME` en `easypanel.yml` por valores reales
2. **Dominio**: Configurar HTTPS en EasyPanel (Let's Encrypt automático)
3. **Backups**: Configurar backups de PostgreSQL en EasyPanel
4. **Monitoreo**: Habilitar alertas de CPU/memoria en EasyPanel
5. **Escalado**: Si hay muchos usuarios, aumentar replicas en `easypanel.yml`

---

## Contacto y soporte

- Documentación: https://opencode.ai/docs
- Issues: https://github.com/opencode-ai/opencode/issues
- Discord: https://discord.gg/opencode
