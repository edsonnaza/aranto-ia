# Pre-Merge Validation Checklist

Antes de mergear una PR, asegúrate de validar lo siguiente en tu PC:

## ✅ Configuración Docker

- [ ] Archivo `.env` existe en raíz y contiene `APP_KEY`
- [ ] Archivo `app/.env` existe y contiene credenciales de BD
- [ ] Ambos archivos no están en el `.gitignore` (deberían ignorarse)

```bash
# Verificar
ls -la .env app/.env
```

## ✅ Build Docker

```bash
# Borra volúmenes antiguos
docker compose down -v

# Compila limpio sin errores
docker compose build --no-cache

# Debería terminar con "Successfully tagged aranto-ia-app:latest"
```

## ✅ Levantamiento de servicios

```bash
# Levanta todo
docker compose up -d

# Espera ~60s para que MySQL esté listo
sleep 60

# Verifica que todo está healthy
docker compose ps

# Debería mostrar:
# aranto-ia-app         (healthy)
# aranto-ia-reverb      (healthy)
# aranto-ia-mysql       (healthy)
# aranto-ia-redis       (running)
# aranto-ia-phpmyadmin  (running)
```

## ✅ Verificar logs sin errores

```bash
# Logs de app (busca "error", "exception", "failed")
docker compose logs app 2>&1 | tail -50

# Logs de MySQL
docker compose logs mysql 2>&1 | tail -20

# Migraciones ejecutadas
docker compose logs app | grep -i "migration"
# Debería mostrar: "Running migrations..."
```

## ✅ Verificación funcional

```bash
# 1. App funcionando
curl http://localhost:8000
# Debería retornar HTML sin errores 500

# 2. PHPMyAdmin conecta
# Abre: http://localhost:8081
# Login: root / 4r4nt0
# Debería conectar sin error "Access denied"

# 3. Base de datos inicializada
docker compose exec -T app php artisan migrate:status
# Debería mostrar: "Ran X migrations"

# 4. Seeders ejecutados
docker compose exec -T app php artisan tinker
# Ejecuta:
# >>> \DB::table('users')->count()
# // Debería retornar > 0 si hay seeders
```

## ✅ Si cambios migraciones o estructura

```bash
# Verifica que schema se crea correctamente
docker compose exec -T app php artisan migrate:fresh

# Debería completar sin errores
```

## ✅ Si cambios en TypeScript/Frontend

```bash
# Verifica que npm build compila
docker compose exec -T app npm run build

# Debería completar sin errores
```

## ✅ Si cambias credenciales en .env.example

```bash
# Verifica que el template es válido
grep -E "^[A-Z_]+=" .env.example | head -20

# Asegúrate que no tiene valores sensibles hardcodeados
grep -E "password|key|token|secret" .env.example
# Debería mostrar solo placeholders genéricos (o comentarios)
```

## ✅ Cambios críticos por tipo

### Base de datos
- ✅ Migración nueva: testea `migrate:fresh`
- ✅ Seeder nuevo: verifica que `db:seed` completa sin errores
- ✅ Cambio en schema: verifica que no rompe relaciones existentes

### Docker/Infra
- ✅ Cambios en Dockerfile: testea `build --no-cache`
- ✅ Cambios en docker-compose.yml: verifica todos los servicios están healthy
- ✅ Cambios en .env: no hardcodees secretos, usa variables

### Frontend
- ✅ Cambios en tsconfig: verifica que compila
- ✅ Nuevas dependencias: verifica que `npm install` completa
- ✅ Cambios en imports: verifica rutas con alias `@/`

### Backend
- ✅ Nuevos controllers: verifica rutas registradas
- ✅ Nuevos servicios: verifica que inyectan correctamente
- ✅ Cambios en middleware: verifica que no bloquean flujos

## 🚀 Production (Railway)

Si todo funciona localmente, en Railway:
1. Se hace deploy automático de la rama
2. Se ejecuta `php artisan migrate --force` automáticamente
3. Se ejecuta `npm run build` en el build process
4. No se ejecutan seeders (para evitar duplicados)

Si algo falla en production:
```bash
# SSH a Railway
railway connect

# Ver logs
railway logs

# Rollback manual
php artisan migrate:rollback
```

## ❌ Errores comunes

| Error | Solución |
|-------|----------|
| `MissingAppKeyException` | Verificar `APP_KEY` en `.env` y en `docker-compose.yml` |
| `Access denied for user 'root'` | Verificar credenciales en `.env` coincidan con BD |
| `Could not resolve module` | Verificar imports usan alias `@/` o rutas relativas correctas |
| `Migration failed` | Ejecutar `docker compose logs app` para ver detalles |
| `Docker won't build` | Ejecutar `docker compose down -v` y `build --no-cache` |

---

**Si todo pasa el checklist, la PR está lista para mergear!** ✅
