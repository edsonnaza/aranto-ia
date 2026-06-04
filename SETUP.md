# 🚀 Setup Guide - Aranto IA

Este documento explica cómo configurar Aranto IA en una nueva PC y cómo garantizar que funcione correctamente en cualquier ambiente.

## ⚡ Quick Start (Primera Vez)

### 1. Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repo-url>
cd aranto-ia

# Crear archivo .env desde el ejemplo
cp .env.example .env

# Crear app/.env
cp app/.env.example app/.env
```

### 2. Generar APP_KEY

```bash
cd app
php artisan key:generate --show
```

Copiar el valor generado al archivo raíz `.env`:
```
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxx
```

### 3. Validar Setup

```bash
# Desde la raíz del proyecto
bash scripts/validate-setup.sh
```

### 4. Iniciar Docker

```bash
docker compose up -d
```

El script de entrypoint ejecutará automáticamente:
- ✅ Migraciones (`php artisan migrate`)
- ✅ Seeders (`php artisan db:seed`)

### 5. Acceder a la Aplicación

- **App:** http://localhost:8000
- **phpMyAdmin:** http://localhost:8081 (user: `root`, pass: `4r4nt0`)
- **Reverb:** http://localhost:8585

---

## 📁 Estructura de Archivos .env

### Archivos Necesarios:

1. **`.env` (raíz del proyecto)**
   - Variables de Docker (MySQL, Redis, puertos)
   - APP_KEY y APP_URL
   - Configuración de production (Railway)

2. **`app/.env` (dentro de app/)**
   - Configuración específica de Laravel
   - Credenciales de base de datos (debe coincidir con el raíz)
   - Settings de app Laravel

**⚠️ Importante:** Ambos deben tener las mismas credenciales de BD.

---

## 🔄 Workflow: PC Local → PR → Production

### En PC Local (PC1 o PC2):

```bash
# 1. Validar que todo funciona
bash scripts/validate-setup.sh

# 2. Hacer cambios
# ... editar código ...

# 3. Testear localmente
docker compose exec app php artisan test

# 4. Verificar migraciones si hay cambios en BD
docker compose exec app php artisan migrate --dry-run

# 5. Commit y Push
git add .
git commit -m "feat: nueva feature"
git push origin feature/nombre
```

### En GitHub (CI/CD):

Cuando haces PR, los checks automáticos verificarán:
- ✅ Sintaxis PHP y TypeScript
- ✅ Tests
- ✅ Code style

### Merge y Deploy a Production (Railway):

```bash
# Railway lee estas variables del dashboard:
# - APP_KEY
# - DB_HOST (Railway MySQL)
# - DB_DATABASE
# - DB_USERNAME
# - DB_PASSWORD
# - REDIS_HOST (Railway Redis)
```

---

## 🔐 Variables de Entorno por Ambiente

### Local (`.env`)
```
APP_ENV=local
APP_DEBUG=true
DB_HOST=mysql (Docker)
REDIS_HOST=redis (Docker)
```

### Production (Railway Dashboard)
```
APP_ENV=production
APP_DEBUG=false
DB_HOST=*.railway.app (Railway MySQL)
REDIS_HOST=*.railway.app (Railway Redis)
APP_KEY=base64:xxxx (MUST SET)
```

---

## 🚨 Problemas Comunes

### Error: "No application encryption key has been specified"
**Solución:** Ejecutar `php artisan key:generate --show` y copiar el valor al `.env`

### Error: "Access denied for user 'root'@'172.22.0.4'"
**Solución:** Verificar que `MYSQL_ROOT_PASSWORD` en `.env` coincida en ambos archivos

### Contenedores no inician
**Solución:** 
```bash
# Eliminar volúmenes y reiniciar
docker compose down -v
docker compose up -d
```

### Puerto ya en uso
**Solución:** Cambiar en `.env`:
```
APP_PORT=8001      # en lugar de 8000
MYSQL_PORT=3308    # en lugar de 3307
PHPMYADMIN_PORT=8082  # en lugar de 8081
```

---

## 📋 Checklist Antes de PR

- [ ] `bash scripts/validate-setup.sh` - PASSED
- [ ] Ejecuté `docker compose exec app php artisan migrate` si cambié BD
- [ ] No hay errores en `docker compose logs app`
- [ ] Probé en navegador: http://localhost:8000
- [ ] Commit mensaje descriptivo
- [ ] No commiteé archivos `.env` (van en `.gitignore`)

---

## 🚀 Deploy a Production (Railway)

### 1. Conectar Railway

```bash
# Si no lo hiciste aún
railway link
railway up
```

### 2. Configurar Variables en Dashboard de Railway

```
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:xxxx
DB_HOST=mysql.railway.internal
DB_USERNAME=root
DB_PASSWORD=xxxx
REDIS_HOST=redis.railway.internal
```

### 3. Ejecutar Migraciones en Production

```bash
railway run php artisan migrate --force
railway run php artisan db:seed --force
```

### 4. Monitorear Logs

```bash
railway logs
```

---

## 🔗 Referencias

- [Docker Compose Config](./docker-compose.yml)
- [Dockerfile](./app/Dockerfile)
- [Laravel Config](./app/config/)
- [Railway Docs](https://docs.railway.app)

---

## ❓ Preguntas?

Revisar:
- Logs: `docker compose logs app`
- Status: `docker compose ps`
- Validación: `bash scripts/validate-setup.sh`
