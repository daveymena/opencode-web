# 🚀 Configuración en EasyPanel — Paso a Paso

## 📋 Credenciales de Base de Datos

```
Contraseña PostgreSQL: $5v#th^EWJHJ^ucT4UslnJeRMhpT&LX&
```

---

## 1️⃣ Crear Servicio PostgreSQL

### En EasyPanel Dashboard:
1. Click en **"New Service"**
2. Selecciona **"PostgreSQL"**
3. Configura:
   - **Nombre del servicio**: `opencode-db`
   - **Puerto**: `5432` (interno, no exponer)
   - **Usuario**: `postgres`
   - **Contraseña**: `$5v#th^EWJHJ^ucT4UslnJeRMhpT&LX&`
   - **Base de datos**: `opencode`

4. Click en **"Create"**
5. Espera a que esté corriendo (verde)

---

## 2️⃣ Crear Servicio App (Node.js)

### En EasyPanel Dashboard:
1. Click en **"New Service"**
2. Selecciona **"App"**
3. Configura:

#### Fuente (Source):
- **Type**: GitHub
- **Repository**: tu-usuario/opencode-deployment
- **Branch**: main
- **Path**: /opencode-server

#### Build:
- **Type**: Dockerfile
- **Dockerfile path**: Dockerfile

#### Deploy:
- **Replicas**: 1
- **Command**: `node server/index.js`
- **Zero Downtime**: No

#### Ports:
- **Published**: 4096
- **Target**: 4096

---

## 3️⃣ Configurar Variables de Entorno

En la sección **"Environment Variables"**, copia y pega:

```
NODE_ENV=production
PORT=4096
DATABASE_URL=postgres://postgres:$5v#th^EWJHJ^ucT4UslnJeRMhpT&LX&@opencode-db:5432/opencode?sslmode=disable
PGHOST=opencode-db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=$5v#th^EWJHJ^ucT4UslnJeRMhpT&LX&
PGDATABASE=opencode
OPENCODE_BASE_PORT=5100
WORKSPACE_ROOT=/workspace
CONFIG_ROOT=/home/opencode/.config/opencode/users
DATA_ROOT=/home/opencode/.local/share/opencode/users
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
```

---

## 4️⃣ Configurar Volúmenes (Storage)

En la sección **"Mounts"**, crea 3 volúmenes:

### Volumen 1: Workspace
- **Type**: Volume
- **Name**: `opencode-workspace`
- **Mount Path**: `/workspace`

### Volumen 2: Config
- **Type**: Volume
- **Name**: `opencode-config`
- **Mount Path**: `/home/opencode/.config/opencode`

### Volumen 3: Data
- **Type**: Volume
- **Name**: `opencode-data`
- **Mount Path**: `/home/opencode/.local/share/opencode`

---

## 5️⃣ Asignar Dominio

1. En el servicio App, click en **"Domains"**
2. Click en **"Add Domain"**
3. Configura:
   - **Domain**: `tudominio.com` (o tu dominio)
   - **Port**: 4096
   - **HTTPS**: Automático (Let's Encrypt)

4. Click en **"Create"**

---

## 6️⃣ Verificar Despliegue

### Esperar a que esté listo:
1. El servicio PostgreSQL debe estar **verde** (running)
2. El servicio App debe estar **verde** (running)
3. Esperar ~2-3 minutos para que se construya la imagen Docker

### Verificar en terminal:
```bash
# Verificar que la app responde
curl https://tudominio.com/login

# Debe devolver HTML de la página de login
```

### Verificar en logs:
1. En EasyPanel, click en el servicio App
2. Click en **"Logs"**
3. Debe mostrar:
   ```
   [opencode-platform] Servidor en http://0.0.0.0:4096
   [db] Tablas inicializadas
   ```

---

## 7️⃣ Configuración Adicional (Recomendado)

### Backups de PostgreSQL
1. En el servicio PostgreSQL, click en **"Backups"**
2. Habilitar backups automáticos
3. Frecuencia: Diaria
4. Retención: 7 días

### Monitoreo
1. En EasyPanel, click en **"Settings"**
2. Habilitar **"Alerts"**
3. Configurar alertas para:
   - CPU > 80%
   - Memoria > 80%
   - Servicio caído

### SSL/HTTPS
- EasyPanel configura automáticamente Let's Encrypt
- Se renueva automáticamente cada 90 días
- No requiere configuración adicional

---

## 🧪 Pruebas Post-Despliegue

### 1. Acceso a login
```bash
curl https://tudominio.com/login
# Debe devolver HTML
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

---

## 🆘 Solución de Problemas

### Error: "Connection refused"
**Causa**: PostgreSQL no está disponible
**Solución**: 
1. Verificar que el servicio `opencode-db` está corriendo (verde)
2. Revisar logs de PostgreSQL
3. Esperar 1-2 minutos más

### Error: "HEALTHCHECK failed"
**Causa**: La app no responde en 90 segundos
**Solución**:
1. Revisar logs de la app
2. Verificar que PostgreSQL está corriendo
3. Aumentar `start-period` en Dockerfile si es necesario

### Error: "Cannot find module"
**Causa**: npm install no se ejecutó
**Solución**:
1. Verificar que `package.json` y `package-lock.json` existen
2. Forzar rebuild: Click en servicio → "Rebuild"

### Error: "OpenCode no inicia"
**Causa**: Falta instalar OpenCode en el Dockerfile
**Solución**:
1. Verificar que el Dockerfile contiene: `curl -fsSL https://opencode.ai/install | bash`
2. Forzar rebuild

---

## 📊 Checklist Final

- [ ] PostgreSQL creado y corriendo
- [ ] App creada y corriendo
- [ ] Variables de entorno configuradas
- [ ] Volúmenes creados
- [ ] Dominio asignado
- [ ] HTTPS funcionando
- [ ] Login accesible
- [ ] Registro funcionando
- [ ] OpenCode iniciando
- [ ] Backups configurados
- [ ] Alertas configuradas

---

## 🎉 ¡Listo!

Tu plataforma OpenCode multi-usuario está corriendo en EasyPanel.

**URL**: https://tudominio.com
**Admin**: Crea tu cuenta en el registro

---

**Última actualización**: 2026-05-24
**Versión**: 1.0.0
