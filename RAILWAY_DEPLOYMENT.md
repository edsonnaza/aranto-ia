# 🚀 Railway Deployment Guide

Guía para desplegar Aranto IA en Railway y mantener sincronización entre PC local, staging y production.

## 📋 Pre-requisitos

- Cuenta en [Railway.app](https://railway.app)
- Railway CLI instalada: `npm install -g @railway/cli`
- Token de Railway configurado

## 🔧 Configuración Inicial

### 1. Crear Proyectos en Railway

Crear 2 proyectos:
- **aranto-ia-dev**: Para staging/testing
- **aranto-ia-prod**: Para production

Cada proyecto debe tener:
- ✅ MySQL Database
- ✅ Redis Cache
- ✅ PostgreSQL opcional (si usas como logger)

### 2. Variables de Entorno en Railway

Para **ambos proyectos**, en el dashboard de Railway configura:

```
APP_ENV=production           # o development para dev
APP_DEBUG=false              # false en prod, true en dev
APP_KEY=base64:xxxxx        # CRITICAL: Misma KEY que en local
APP_URL=https://xxxx.railway.app
APP_NAME=Aranto
APP_TIMEZONE=America/Asuncion

# Database
DB_CONNECTION=mysql
DB_HOST=${{ Database.MYSQL_HOST }}
DB_PORT=${{ Database.MYSQL_PORT }}
DB_DATABASE=${{ Database.MYSQL_DB }}
DB_USERNAME=${{ Database.MYSQL_USER }}
DB_PASSWORD=${{ Database.MYSQL_PASSWORD }}

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=database
SESSION_DRIVER=database

# Redis
REDIS_HOST=${{ Redis.REDIS_HOST }}
REDIS_PORT=${{ Redis.REDIS_PORT }}
REDIS_PASSWORD=${{ Redis.REDIS_PASSWORD }}

# Broadcasting
BROADCAST_CONNECTION=reverb
REVERB_HOST=${{ Domain }}
REVERB_PORT=443
REVERB_SCHEME=https

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error              # debug en dev, error en prod
```

### 3. Conectar Repositorio

En Railway dashboard:
1. Click en "New" → "GitHub Repo"
2. Selecciona el repositorio `aranto-ia`
3. Elige la rama `main` para production, `develop` para staging

---

## 📊 Workflow: Local → GitHub → Railway

```
┌─────────────────┐
│  Tu PC (Local)  │
│  - Cambios      │
│  - Tests        │
│  - Docker ✓     │
└────────┬────────┘
         │ git push
         ↓
┌─────────────────┐
│  GitHub Actions │
│  - Tests        │
│  - Lint         │
│  - Build        │
└────────┬────────┘
         │
    ┌────┴─────┐
    ↓          ↓
  develop    main
    │          │
    ↓          ↓
  Railway   Railway
   (DEV)    (PROD)
```

### Pasos Detallados:

#### 1️⃣ Trabajar Localmente

```bash
# Clonar repo
git clone <repo>
cd aranto-ia

# Crear .env desde ejemplo
cp .env.example .env
cp app/.env.example app/.env

# Generar APP_KEY (MISMO que en Railway)
cd app
php artisan key:generate --show

# Copiar a .env raíz
# APP_KEY=base64:xxxxx

# Validar
bash scripts/validate-setup.sh

# Iniciar Docker
docker compose up -d

# Hacer cambios y testear
# ...
```

#### 2️⃣ Validar Cambios

```bash
# Ejecutar tests locales
docker compose exec app php artisan test

# Verificar migraciones si tocaste BD
docker compose exec app php artisan migrate --dry-run

# Ver logs
docker compose logs app

# Validar estructura
bash scripts/validate-setup.sh
```

#### 3️⃣ Commit y Push

```bash
# Agregar cambios
git add .

# Validación pre-commit automática
git commit -m "feat: descripcion clara"

# Push a develop (para testing)
# o push a main (para production)
git push origin develop
```

#### 4️⃣ GitHub Actions Ejecuta Tests

Automáticamente:
- ✅ Instala dependencias
- ✅ Crea base de datos de test
- ✅ Corre migraciones
- ✅ Ejecuta test suite
- ✅ Verifica sintaxis PHP
- ✅ Chequea code style

#### 5️⃣ Si Todo Pasa → Railway Deploy

Railway automáticamente:
- 🚀 Construye imagen Docker
- 📦 Pushea a Registry
- 🔄 Reinicia servicios
- 🗄️ Ejecuta migraciones
- ✨ Nuevo deploy en vivo

---

## 🔄 Sincronización Entre Ambientes

### BD en Sync

**Si hiciste cambios en BD localmente:**

```bash
# 1. Crear migration
docker compose exec app php artisan make:migration create_something

# 2. Editar migration en app/database/migrations/

# 3. Testear localmente
docker compose exec app php artisan migrate
docker compose exec app php artisan migrate:rollback

# 4. Commit y push
git add app/database/migrations/
git commit -m "migration: add something"
git push origin feature/nombre

# 5. En Railway: automático con CI/CD
#    - GitHub Actions ejecuta migrate --force
#    - BD actualizada en production
```

### Datos/Seeders

```bash
# Si necesitas seeders en production
docker compose exec app php artisan make:seeder ProductSeeder

# Ejecutar
docker compose exec app php artisan db:seed --class=ProductSeeder

# O en Railway:
railway run php artisan db:seed --class=ProductSeeder
```

---

## 🚨 Solución de Problemas

### ❌ Deploy falló en Railway

```bash
# Ver logs
railway logs

# Verificar variables de entorno
railway env

# Reconectar
railway link --reset
railway up

# Ejecutar migraciones manualmente
railway run php artisan migrate --force
```

### ❌ BD corrupta en production

⚠️ **CUIDADO**: Esto eliminará todo. Solo si es urgente.

```bash
# Conectarse a Railway
railway shell

# Dentro del shell de Railway
php artisan migrate:refresh --seed --force
```

### ❌ APP_KEY no coincide

```bash
# Generar misma clave en todas partes
cd app
php artisan key:generate --show

# Actualizar en:
# 1. Archivo .env (local)
# 2. Railway dashboard (prod y dev)
# 3. Commit: NO commitear .env, solo documentar el proceso
```

---

## 📋 Checklist Pre-Deployment a Production

- [ ] Código testeado localmente
- [ ] `bash scripts/validate-setup.sh` - PASSED
- [ ] Tests pasan: `docker compose exec app php artisan test`
- [ ] Cambios en BD validados con `--dry-run`
- [ ] Migraciones creadas y commentadas
- [ ] Commit message descriptivo
- [ ] Push a `develop` primero (para staging)
- [ ] Verificar que Railway DEV desplegó exitosamente
- [ ] Review del PR realizado
- [ ] Merge a `main`
- [ ] Railway PROD desplegó sin errores
- [ ] Validar en https://aranto-ia.railway.app

---

## 🔐 Seguridad

### Proteger Production

En GitHub, agregar protección a rama `main`:

1. Settings → Branches
2. Add rule para `main`
3. Require pull request reviews
4. Require status checks to pass
5. Enforce for administrators

### Secretos en GitHub

Configurar en GitHub Settings → Secrets:

```
RAILWAY_TOKEN          # Token personal de Railway
RAILWAY_DEV_PROJECT_ID # ID del proyecto dev
RAILWAY_PROD_PROJECT_ID # ID del proyecto prod
```

---

## 📞 Useful Commands

```bash
# Railway CLI
railway login
railway link                    # Conectar a proyecto
railway up                      # Deploy
railway logs                    # Ver logs en tiempo real
railway shell                   # SSH al container
railway run <command>           # Ejecutar comando

# Migraciones
php artisan migrate --dry-run   # Validar migraciones
php artisan migrate:fresh       # Reset BD (ONLY LOCAL)
php artisan migrate:refresh     # Reset + seed

# Tests
php artisan test                # Ejecutar tests
php artisan test --filter=TestName  # Test específico

# Debugging
php artisan tinker              # REPL interactivo
railway logs -t                 # Logs en tiempo real
```

---

## 📚 Referencias

- [Railway Docs](https://docs.railway.app)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [GitHub Actions](https://docs.github.com/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
