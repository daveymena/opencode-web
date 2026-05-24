# 🚀 Guía de Despliegue en EasyPanel

**Proyecto**: OpenCode Platform  
**Repositorio**: `tecnovariedades/opencode-iae`  
**Rama**: `main`  
**Estado**: ✅ Listo para desplegar

---

## 📋 Checklist Pre-Despliegue

Antes de desplegar en EasyPanel, asegúrate de:

- [ ] Eliminar servicios anteriores fallidos (si existen)
- [ ] Tener acceso a EasyPanel
- [ ] Tener las credenciales de GitHub configuradas
- [ ] Tener la contraseña de base de datos lista

---

## 🔧 Pasos de Despliegue

### Paso 1: Limpiar Servicios Anteriores (Opcional)

Si hay servicios anteriores que fallaron:

1. Ve a **EasyPanel Dashboard**
2. Busca el servicio `opencode-iae`
3. Haz clic en **Eliminar** (Delete)
4. Espera a que se elimine completamente

### Paso 2: Crear Servicio de Base de Datos PostgreSQL

1. En EasyPanel, ve a **Servicios** → **Crear Nuevo**
2. Selecciona **PostgreSQL**
3. Configura:
   - **Nombre**: `opencode-db`
   - **Usuario**: `postgres`
   - **Contraseña**: `$5v#th^EWJHJ^ucT4UslnJeRMhpT&LX&`
   - **Base de datos**: `opencode`
4. Haz clic en **Crear**
5. Espera a que esté **Running** (puede tomar 1-2 minutos)

### Paso 3: Crear Servicio de Aplicación

1. En EasyPanel, ve a **Servicios** → **Crear Nuevo**
2. Selecciona **App** (Aplicación)
3. Configura:
   - **Nombre**: `opencode-iae`
   - **Tipo de fuente**: GitHub
   - **Repositorio**: `tecnovariedades/opencode-iae`
   - **Rama**: `main`
   - **Dockerfile**: `./Dockerfile`
   - **Puerto**: `4096`

### Paso 4: Configurar Variables de Entorno

En la sección de **Entorno**, agrega estas variables:

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

### Paso 5: Configurar Volúmenes

Agrega estos volúmenes:

| Nombre | Ruta en Contenedor |
|--------|-------------------|
| `opencode-workspace` | `/workspace` |
| `opencode-config` | `/home/opencode/.config/opencode` |
| `opencode-data` | `/home/opencode/.local/share/opencode` |

### Paso 6: Configurar Dominio (Opcional)

1. En la sección **Dominio**:
   - Selecciona tu dominio (ej: `opencode.tudominio.com`)
   - Habilita **HTTPS**
   - Habilita **Auto-renew SSL**

### Paso 7: Desplegar

1. Haz clic en **Crear/Desplegar**
2. Espera a que el build termine (puede tomar 3-5 minutos)
3. Verifica que el estado sea **Running**

---

## ✅ Verificación Post-Despliegue

Una vez desplegado, verifica que funciona:

### 1. Acceder a la Página de Login

```
http://opencode-iae.tudominio.com/login
```

Deberías ver la página de login.

### 2. Probar Login

Usa estas credenciales:

- **Email**: `daveymena16@gmail.com`
- **Contraseña**: `6715320`

### 3. Verificar Logs

En EasyPanel, ve a **Logs** y verifica que no haya errores:

```
[opencode-platform] Servidor en http://0.0.0.0:4096
[db] Tablas inicializadas
```

---

## 🐛 Solución de Problemas

### Error: "Dockerfile not found"

**Causa**: El Dockerfile no está en la raíz del repositorio.

**Solución**: Verifica que el archivo `Dockerfile` esté en la raíz del repositorio (no en una subcarpeta).

### Error: "Connection refused" en base de datos

**Causa**: El servicio PostgreSQL no está corriendo o el nombre del host es incorrecto.

**Solución**: 
1. Verifica que `opencode-db` esté en estado **Running**
2. Verifica que `DATABASE_URL` use `opencode-db` como host (no `localhost`)

### Error: "Permission denied" en directorios

**Causa**: Los permisos de los volúmenes no son correctos.

**Solución**: En EasyPanel, ve a **Volúmenes** y verifica que los permisos sean `755` o `777`.

### El servidor inicia pero no responde

**Causa**: El servidor está esperando a que PostgreSQL esté listo.

**Solución**: Espera 30-60 segundos y recarga la página. El servidor intenta conectarse a la base de datos al iniciar.

---

## 📊 Monitoreo

En EasyPanel, puedes monitorear:

- **CPU**: Debe estar bajo (< 5% en reposo)
- **Memoria**: Debe estar bajo (< 100MB en reposo)
- **Red**: Debe mostrar tráfico cuando accedes a la aplicación
- **Logs**: Verifica que no haya errores

---

## 🔐 Seguridad

- ✅ La contraseña de base de datos es fuerte
- ✅ El Dockerfile usa una imagen Alpine (más segura)
- ✅ El servidor no expone credenciales en logs
- ✅ Las cookies de sesión son `httpOnly` y `secure`

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los **Logs** en EasyPanel
2. Verifica que todos los servicios estén **Running**
3. Intenta **Redeploy** desde EasyPanel
4. Si persiste, elimina y crea nuevamente el servicio

---

## ✨ ¡Listo!

Tu aplicación OpenCode Platform está lista para ser desplegada en EasyPanel sin errores. 🎉
