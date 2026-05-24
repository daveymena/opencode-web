# 🚀 Quick Start — Desplegar en EasyPanel en 5 minutos

## ✅ Estado actual
Tu proyecto está **100% listo** para desplegar en EasyPanel sin errores.

---

## 📋 Checklist rápido

- [x] Dockerfile optimizado (Alpine)
- [x] Credenciales removidas
- [x] Configuración segura
- [x] Documentación completa
- [x] Script de validación

---

## 🚀 Pasos para desplegar

### 1️⃣ Validar localmente (30 segundos)
```bash
bash validate-deployment.sh
```
Debe mostrar: ✅ Validación completada sin errores

### 2️⃣ Cambiar credenciales (1 minuto)
Edita `easypanel.yml` y reemplaza:
```yaml
CHANGE_ME → tu_contraseña_segura
```

### 3️⃣ Subir a GitHub (1 minuto)
```bash
git add .
git commit -m "fix: Optimizar para EasyPanel"
git push origin main
```

### 4️⃣ En EasyPanel (2 minutos)

#### A. Crear PostgreSQL
1. Dashboard → New Service → PostgreSQL
2. Nombre: `opencode-db`
3. Anota las credenciales generadas

#### B. Crear App
1. Dashboard → New Service → App
2. Fuente: GitHub → tu-repo/opencode-server
3. Build: Dockerfile
4. Puerto: 4096

#### C. Configurar variables
Copia estas variables en EasyPanel:
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
```

#### D. Configurar volúmenes
```
/workspace → opencode-workspace
/home/opencode/.config/opencode → opencode-config
/home/opencode/.local/share/opencode → opencode-data
```

#### E. Asignar dominio
1. Dominio: tudominio.com
2. Puerto: 4096
3. HTTPS: Automático (Let's Encrypt)

### 5️⃣ Verificar despliegue (1 minuto)
```bash
curl https://tudominio.com/login
# Debe devolver HTML de login
```

---

## 🎯 Resultado esperado

✅ Página de login en `https://tudominio.com`
✅ Registro de usuarios funcionando
✅ Inicio de sesión funcionando
✅ OpenCode iniciando por usuario
✅ Proyectos privados por usuario

---

## 📚 Documentación completa

- **DEPLOYMENT_CHECKLIST.md** — Guía detallada paso a paso
- **DEPLOYMENT_FIXES.md** — Explicación de todas las correcciones
- **validate-deployment.sh** — Script de validación automática

---

## 🆘 Si algo falla

### Error: "Cannot find module"
```bash
# Verificar que package-lock.json existe
ls -la package-lock.json
```

### Error: "Connection refused"
```bash
# Verificar que PostgreSQL está corriendo en EasyPanel
# Revisar logs en EasyPanel → Logs
```

### Error: "HEALTHCHECK failed"
```bash
# Aumentar start-period en Dockerfile
# O revisar logs de la app
```

---

## 💡 Tips importantes

1. **Credenciales**: Cambiar `CHANGE_ME` antes de desplegar
2. **Dominio**: Configurar después de crear el servicio
3. **HTTPS**: EasyPanel lo configura automático
4. **Backups**: Configurar en EasyPanel
5. **Monitoreo**: Habilitar alertas en EasyPanel

---

## ✨ Características incluidas

✅ Autenticación multi-usuario
✅ OpenCode aislado por usuario
✅ PostgreSQL para datos
✅ Proxy automático
✅ Instancias bajo demanda
✅ Seguridad mejorada
✅ Logs detallados
✅ Health checks

---

## 🎉 ¡Listo!

Tu aplicación está lista para desplegar. Sigue los 5 pasos arriba y tendrás tu plataforma OpenCode multi-usuario corriendo en EasyPanel.

**Tiempo total: ~5 minutos**

---

**Última actualización**: 2026-05-24
**Estado**: ✅ Listo para producción
