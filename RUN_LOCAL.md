# 🚀 Ejecutar OpenCode Platform Localmente

## Requisitos

- ✅ Docker Desktop instalado
- ✅ Docker Compose
- ✅ Node.js 20+
- ✅ npm

## Opción 1: Windows (Recomendado)

### Paso 1: Ejecutar el script
```bash
run-local.bat
```

O manualmente:

### Paso 2: Iniciar solo PostgreSQL (recomendado)
```bash
docker-compose up -d db
```

> O si prefieres ejecutar todo en Docker (app + db):
> ```bash
> docker-compose up -d
> ```

### Paso 3: Esperar a PostgreSQL
```bash
# Esperar 10 segundos o verificar con:
docker-compose logs db
```

### Paso 4: Instalar dependencias
```bash
cd opencode-server
npm install --production
```

### Paso 5: Iniciar servidor
```bash
npm start
```

## Opción 2: Linux/Mac

### Paso 1: Ejecutar el script
```bash
bash run-local.sh
```

O manualmente:

### Paso 2: Iniciar Docker Compose
```bash
docker-compose up -d
```

### Paso 3: Esperar a PostgreSQL
```bash
sleep 10
```

### Paso 4: Instalar dependencias
```bash
cd opencode-server
npm install --production
```

### Paso 5: Iniciar servidor
```bash
npm start
```

## Acceso

Una vez que el servidor esté corriendo:

```
URL: http://localhost:4096
Login: http://localhost:4096/login
```

## Credenciales de Base de Datos (Local)

```
Host: localhost
Puerto: 5432
Usuario: postgres
Contraseña: password123
Base de datos: opencode
```

## Verificar que está funcionando

```bash
# En otra terminal
curl http://localhost:4096/login
```

Debe devolver HTML de la página de login.

## Detener servicios

```bash
# Detener Docker Compose
docker-compose down

# O presionar Ctrl+C en el terminal donde corre npm start
```

## Solución de problemas

### Error: "Docker daemon is not running"
- Abre Docker Desktop

### Error: "Port 4096 is already in use"
- Cambia el puerto en `.env.local`: `PORT=4097`
- O detén el servicio que usa el puerto

### Error: "Cannot connect to database"
- Espera más tiempo a que PostgreSQL inicie
- Verifica que Docker Compose está corriendo: `docker-compose ps`

### Error: "npm: command not found"
- Instala Node.js desde https://nodejs.org/

## Logs

Ver logs de Docker:
```bash
docker-compose logs -f app
docker-compose logs -f db
```

Ver logs de npm:
```bash
# Los logs aparecen en la terminal donde ejecutaste npm start
```

## Desarrollo

Para desarrollo con hot-reload:

```bash
cd opencode-server
npm run dev
```

(Requiere nodemon instalado)

## Próximos pasos

Una vez que funcione localmente:

1. Prueba el registro: http://localhost:4096/register
2. Crea una cuenta
3. Inicia sesión
4. Accede a OpenCode: http://localhost:4096/app
5. Verifica que todo funciona

Luego puedes desplegar en EasyPanel con confianza.

---

**Última actualización**: 2026-05-24
