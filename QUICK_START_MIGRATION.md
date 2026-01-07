# QUICK START - Migración a Producción

## ⚡ Una Línea de Comando

```bash
# Opción 1: Directamente en el contenedor Docker
docker compose exec -w /var/www/html app php artisan legacy:migrate --force

# Opción 2: Usando el script helper
docker compose exec -w /var/www/html app bash scripts/migrate-production.sh

# Opción 3: Local (si está instalado)
php artisan legacy:migrate --force
```

**Tiempo de ejecución:** ~18-20 segundos

## ✓ Qué Se Ejecuta Automáticamente

```
1. migrate:fresh
   └─ Limpia todas las tablas
   └─ Ejecuta todas las migraciones (44 migraciones)
   └─ Aplica sanitizaciones UTF-8

2. MasterLegacyMigrationSeeder (6 FASES)
   │
   ├─ FASE 1: Configuración Base
   │  ├─ Permisos y roles (Spatie Permission)
   │  ├─ Tipos de seguros (6)
   │  └─ Categorías de servicios (23)
   │
   ├─ FASE 2: Datos Básicos
   │  ├─ Servicios iniciales
   │  └─ Usuarios cash register
   │
   ├─ FASE 3: Maestros desde Legacy
   │  ├─ Especialidades (35)
   │  └─ Profesionales (262 + 256 comisiones)
   │
   ├─ FASE 4: Servicios desde Legacy
   │  ├─ Servicios médicos (474)
   │  └─ Precios de servicios (455)  ← IMPORTANTE
   │
   ├─ FASE 5: Datos Complejos
   │  ├─ Pacientes (90,588)
   │  └─ Solicitudes de servicio
   │
   └─ FASE 6: Validaciones
      ├─ Verificación UTF-8
      ├─ Integridad de datos
      └─ Generación de reportes

3. Resultado Final
   └─ ✓ Sistema 100% listo para producción
```

## 📊 Datos Cargados

| Entidad | Cantidad | Estado |
|---------|----------|--------|
| **Profesionales** | 262 | ✓ Con comisiones |
| **Comisiones** | 256 | ✓ Configuradas |
| **Servicios** | 474 | ✓ Sanitizados |
| **Precios** | 455 | ✓ Por seguros |
| **Pacientes** | 90,588 | ✓ Importados |
| **Seguros** | 6 | ✓ Activos |
| **Especialidades** | 35 | ✓ Disponibles |
| **Categorías** | 23 | ✓ Estructurado |

## 🔍 Verificación Post-Migración

```bash
# Ver que los datos están cargados
docker compose exec -w /var/www/html app php artisan tinker

# Dentro de tinker:
echo App\Models\Professional::count();           # 262
echo App\Models\MedicalService::count();         # 474
echo App\Models\ServicePrice::count();           # 455
echo App\Models\Patient::count();                # 90588

# Verificar precio específico
$service = App\Models\MedicalService::find(1);
$service->prices; // Ver precios

exit();
```

## 🌐 Verificar en Browser

```
http://localhost/medical/reception

Debe cargar:
✓ Profesionales (busca por nombre)
✓ Servicios (listado completo)
✓ Seguros (6 disponibles)
✓ Precios dinámicos al seleccionar servicio + seguro
```

## ⚠️ Si Algo Falla

```bash
# Ver logs de migración
tail storage/logs/migration_report_*.txt

# Ver logs de errores
tail -100 storage/logs/laravel.log

# Rollback (volver atrás)
php artisan migrate:rollback --step=100

# Reintentar
php artisan legacy:migrate --force
```

## 📝 Reportes Generados

Después de ejecutar, encontrarás en:
```
storage/logs/migration_report_YYYY-MM-DD_HH-MM-SS.txt
```

Contiene:
- ✓ Total de servicios migrados
- ✓ Precios por seguro
- ✓ Validación UTF-8
- ✓ Integridad de datos

## 🚀 Producción - Pasos Finales

1. **Backup**
   ```bash
   # Antes de migrar
   mysqldump -u root -p db_legacy_infomed > backup_legacy.sql
   ```

2. **Migrar**
   ```bash
   docker compose exec -w /var/www/html app php artisan legacy:migrate --force
   ```

3. **Verificar**
   ```bash
   # Verificar datos en DB
   docker compose exec mysql mysql -u root -p aranto_medical -e "SELECT COUNT(*) FROM medical_services;"
   
   # Acceder a http://localhost/medical/reception
   ```

4. **Listo**
   ```
   ✓ Sistema en producción
   ```

---

**Estado:** ✅ Production Ready  
**Última actualización:** 2026-01-07  
**Versión:** 1.0
