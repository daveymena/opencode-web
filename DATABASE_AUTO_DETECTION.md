# 🔄 Auto-Detección de Base de Datos

## Descripción

El servidor OpenCode Platform ahora detecta automáticamente qué base de datos usar:

- **PostgreSQL** - Si está disponible (producción en EasyPanel)
- **SQLite** - Como fallback (desarrollo local)

---

## 🎯 Cómo Funciona

### 1. **Inicio del Servidor**

Cuando el servidor inicia, ejecuta la función `initializeDB()`:

```javascript
async function initializeDB() {
  // Intentar conectar a PostgreSQL primero
  if (process.env.DATABASE_URL || process.env.PGHOST) {
    try {
      db = require("./db");
      await db.pool.query("SELECT 1");
      dbType = "postgresql";
      console.log("[db] Usando PostgreSQL");
      return;
    } catch (err) {
      console.log("[db] PostgreSQL no disponible, usando SQLite como fallback");
    }
  }
  
  // Fallback a SQLite
  db = require("./db-sqlite");
  dbType = "sqlite";
  console.log("[db] Usando SQLite");
}
```

### 2. **Lógica de Detección**

1. **Verifica variables de entorno**: `DATABASE_URL` o `PGHOST`
2. **Intenta conectar a PostgreSQL**: Ejecuta `SELECT 1`
3. **Si funciona**: Usa PostgreSQL
4. **Si falla**: Usa SQLite como fallback

### 3. **Logs de Inicio**

Verás uno de estos mensajes:

```
[db] Usando PostgreSQL
[opencode-platform] Base de datos: POSTGRESQL
```

O:

```
[db] Usando SQLite
[opencode-platform] Base de datos: SQLITE
```

---

## 📍 Escenarios

### Escenario 1: Desarrollo Local (Sin PostgreSQL)

```bash
# Ejecutar con .env.local
node server/index-local.js

# Resultado:
# [db] Usando SQLite
# [db-sqlite] Conectado a ./opencode.db
# [opencode-platform] Base de datos: SQLITE
```

### Escenario 2: EasyPanel (Con PostgreSQL)

```bash
# Variables de entorno configuradas:
DATABASE_URL=postgres://postgres:password@opencode-db:5432/opencode

# Resultado:
# [db] Usando PostgreSQL
# [opencode-platform] Base de datos: POSTGRESQL
```

### Escenario 3: Fallback Automático

Si PostgreSQL está configurado pero no disponible:

```bash
# Variables de entorno configuradas pero PostgreSQL no responde:
DATABASE_URL=postgres://postgres:password@opencode-db:5432/opencode

# Resultado:
# [db] PostgreSQL no disponible, usando SQLite como fallback
# [db-sqlite] Conectado a ./opencode.db
# [opencode-platform] Base de datos: SQLITE
```

---

## ✅ Ventajas

| Ventaja | Descripción |
|---------|------------|
| **Flexibilidad** | Funciona en desarrollo y producción |
| **Sin Configuración** | Detecta automáticamente |
| **Resilencia** | Fallback a SQLite si PostgreSQL falla |
| **Desarrollo Rápido** | No necesitas PostgreSQL instalado localmente |
| **Producción Robusta** | Usa PostgreSQL en EasyPanel |

---

## 🔧 Archivos Modificados

- `opencode-server/server/index.js` - Servidor principal con auto-detección
- `opencode-server/server/index-local.js` - Servidor local con auto-detección

---

## 📊 Compatibilidad

| Entorno | Base de Datos | Estado |
|---------|---------------|--------|
| **Desarrollo Local** | SQLite | ✅ Funciona |
| **EasyPanel** | PostgreSQL | ✅ Funciona |
| **Fallback** | SQLite | ✅ Funciona |

---

## 🚀 Despliegue en EasyPanel

En EasyPanel, el servidor automáticamente:

1. Detecta `DATABASE_URL` en variables de entorno
2. Intenta conectar a PostgreSQL
3. Si funciona, usa PostgreSQL
4. Si falla, usa SQLite (pero esto no debería ocurrir en producción)

**No necesitas cambiar nada en el código para EasyPanel.**

---

## 💡 Notas

- La auto-detección ocurre **una sola vez** al iniciar el servidor
- No cambia de base de datos durante la ejecución
- Los datos en SQLite no se sincronizan con PostgreSQL
- Para migrar datos, usa scripts de migración específicos

---

## ✨ Resultado

El servidor ahora es **100% compatible** con:
- ✅ Desarrollo local (sin dependencias externas)
- ✅ EasyPanel (con PostgreSQL real)
- ✅ Fallback automático (resilencia)
