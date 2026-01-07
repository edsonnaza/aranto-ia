# 🚀 QUICK START - Aranto-ia

## Sistema de Configuración: SIEMPRE DOCKER

Este proyecto **SIEMPRE utiliza Docker**. No hay configuración local de BD.

- **BD**: MySQL en contenedor Docker
- **App**: Laravel en contenedor
- **Config**: `docker-compose.yml` en raíz

---

## ✅ Verificar que Docker está corriendo

```bash
# Ver contenedores activos
docker ps

# Debe mostrar algo como:
# CONTAINER ID  IMAGE           STATUS
# abc123...     mysql:8.0       Up X minutes
# def456...     php:8.2-fpm     Up X minutes
```

---

## 🔧 Iniciar Docker (si está detenido)

```bash
# Desde raíz del proyecto
cd /Users/edsonnaza/Desktop/Aranto-ia

# Levantar contenedores
docker-compose up -d

# Verificar que levantó correctamente
docker-compose ps
```

---

## 📋 Checklist: Antes de hacer cualquier cosa

- [ ] `docker ps` muestra contenedores corriendo
- [ ] MySQL está accesible en `localhost:3306`
- [ ] Laravel app corre en `localhost:8000`
- [ ] BD `aranto_medical` existe

---

## 🔍 Debuggear errores 500

### 1. Verificar logs
```bash
# Ver logs de Docker
docker-compose logs -f

# O en el contenedor
docker exec <container-id> tail -f storage/logs/laravel.log
```

### 2. Acceder a tinker (dentro de Docker)
```bash
docker exec -it <app-container> php artisan tinker
```

### 3. Verificar conexión a BD
```bash
docker exec -it <mysql-container> mysql -u aranto_user -p aranto_medical
# Password: 4r4nt0
```

---

## Variables de Entorno (Docker)

Archivo: `app/.env`

```env
DB_CONNECTION=mysql
DB_HOST=mysql          # ← Nombre del servicio en docker-compose.yml
DB_PORT=3306
DB_DATABASE=aranto_medical
DB_USERNAME=aranto_user
DB_PASSWORD=4r4nt0
```

**IMPORTANTE**: `DB_HOST=mysql` es el nombre del servicio en Docker, no `localhost`

---

## Flujo de trabajo típico

```bash
# 1. Asegurar Docker está corriendo
docker ps

# 2. Entrar en la app
docker exec -it aranto-ia-app bash

# 3. Ejecutar comandos Laravel
php artisan migrate
php artisan seed
php artisan tinker

# 4. Ver logs si hay error
tail -f storage/logs/laravel.log
```

---

## Si algo no funciona

1. **BD no conecta**: `docker-compose restart mysql`
2. **Errores de migration**: `docker exec -it app php artisan migrate:reset && php artisan migrate`
3. **Cache corrupto**: `docker exec -it app php artisan cache:clear`
4. **Permisos**: `docker exec -it app chmod -R 777 storage bootstrap/cache`

---

## Comandos útiles Docker

```bash
# Ver logs
docker-compose logs -f app      # Solo app
docker-compose logs -f mysql    # Solo BD

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose down

# Rebuild si hay cambios en Dockerfile
docker-compose up -d --build
```

**Conclusión**: Este proyecto **usa Docker 100% de las veces**. Si no funciona algo, el 99% de veces es porque Docker no está corriendo.
