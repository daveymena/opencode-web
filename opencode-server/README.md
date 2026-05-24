# OpenCode Platform — Multi-Usuario

Plataforma completa donde **cada usuario tiene su propio OpenCode aislado**, sus propios proyectos y su propia base de datos. Construida para despliegue 24/7 en EasyPanel.

## ¿Cómo funciona?

```
Navegador (usuario)
       │
       ▼
  Auth Proxy (Node.js :4096)
  ├── /login       → Página de inicio de sesión
  ├── /register    → Registro de nuevos usuarios
  └── /app/oc/*   → Proxy a la instancia OpenCode del usuario
           │
           ├── Usuario 1 → OpenCode en :5100  (workspace propio)
           ├── Usuario 2 → OpenCode en :5101  (workspace propio)
           └── Usuario N → OpenCode en :510N  (workspace propio)

PostgreSQL
  ├── users     → cuentas de usuario
  ├── sessions  → sesiones activas
  └── instances → puertos asignados por usuario
```

- Cada usuario ve **solo sus proyectos**
- Las instancias de OpenCode se arrancan **bajo demanda** (al iniciar sesión)
- Cada usuario tiene su propio directorio de trabajo aislado

---

## Paso 1 — Subir a GitHub

```bash
git init
git add .
git commit -m "feat: OpenCode multi-usuario con PostgreSQL"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/opencode-server.git
git push -u origin main
```

---

## Paso 2 — Configurar en EasyPanel

### 2.1 Crear servicio PostgreSQL

1. EasyPanel → **"New Service"** → **"PostgreSQL"**
2. Nombre del servicio: `opencode-db`
3. Anota las credenciales generadas

### 2.2 Crear servicio de la App

1. **"New Service"** → **"App"**
2. Fuente: **GitHub** → tu repositorio → rama `main`
3. Build Method: **Dockerfile**
4. Puerto: `4096`

### 2.3 Variables de Entorno

| Variable | Valor | Nota |
|----------|-------|------|
| `PGHOST` | `opencode-db` | Nombre del servicio PostgreSQL |
| `PGPORT` | `5432` | |
| `PGUSER` | _(generado por EasyPanel)_ | |
| `PGPASSWORD` | _(generado por EasyPanel)_ | |
| `PGDATABASE` | `opencode` | |
| `OPENCODE_BASE_PORT` | `5100` | Puerto base para instancias |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | O cualquier otro proveedor |

### 2.4 Volúmenes

| Mount Path | Descripción |
|-----------|-------------|
| `/workspace` | Proyectos de todos los usuarios |
| `/home/opencode/.config/opencode/users` | Configs por usuario |
| `/home/opencode/.local/share/opencode/users` | Datos SQLite por usuario |

### 2.5 Dominio

Asigna tu dominio en EasyPanel → el proxy maneja todo el routing.

---

## Desarrollo local

```bash
cp .env.example .env
# Edita .env con tus datos

docker compose up --build
# Abre http://localhost:4096
```

---

## Flujo del usuario

1. Entra a `https://tudominio.com` → redirige a `/login`
2. Se registra o inicia sesión
3. Se arranca su instancia personal de OpenCode (primera vez: ~10 seg)
4. OpenCode abre con **sus proyectos privados** únicamente
5. Puede programar con IA 24/7

---

## Estructura del proyecto

```
opencode-server/
├── Dockerfile                   # Node.js + OpenCode en Ubuntu
├── docker-compose.yml           # App + PostgreSQL para local
├── package.json                 # Dependencias Node.js
├── opencode.json                # Configuración base de OpenCode
├── .env.example                 # Plantilla de variables
├── .gitignore
├── server/
│   ├── index.js                 # Express: auth + proxy
│   ├── db.js                    # PostgreSQL: usuarios, sesiones
│   └── instances.js             # Gestión de procesos OpenCode por usuario
├── public/
│   ├── login.html               # Página de login
│   ├── register.html            # Página de registro
│   └── loading.html             # Pantalla de carga mientras inicia OpenCode
└── .github/
    └── workflows/
        └── docker-build.yml     # CI/CD automático
```

---

## Proveedores de IA soportados

| Proveedor | Variable | Dónde obtener la clave |
|-----------|----------|------------------------|
| Anthropic Claude | `ANTHROPIC_API_KEY` | https://console.anthropic.com/ |
| OpenAI GPT-4 | `OPENAI_API_KEY` | https://platform.openai.com/ |
| Google Gemini | `GEMINI_API_KEY` | https://aistudio.google.com/ |
| GitHub Copilot | — | Login desde la UI de OpenCode |
