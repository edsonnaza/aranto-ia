# Guía de Migración a Producción - Aranto IA

## Overview
Este documento describe cómo hacer una migración completa desde la base de datos legacy a Aranto IA en un ambiente de producción.

## Estado del Sistema

### ✓ Datos Cargados por `legacy:migrate --force`

| Componente | Cantidad | Estado |
|---|---|---|
| Profesionales | 262 | ✓ Cargados con comisiones |
| Comisiones | 256 | ✓ Migramos desde legacy |
| Servicios Médicos | 474 | ✓ Migrados y sanitizados |
| Precios de Servicios | 455 | ✓ Migrados desde legacy |
| Pacientes | 90,588 | ✓ Migrados completamente |
| Seguros | 6 | ✓ Configurados |
| Categorías | 23 | ✓ Estructurado |
| Especialidades | 35 | ✓ Disponibles |

### ✓ Sanitizaciones Aplicadas

- ✓ UTF-8 character corruption cleanup (ñ, á, é, ó, ú, etc.)
- ✓ Professional commission percentage normalization
- ✓ Service name character validation
- ✓ Patient data integrity checks

## Ejecución en Producción

### Requisitos Previos

```bash
# 1. Verificar conexión a legacy database
# - Asegurar que DB_HOST, DB_USERNAME, DB_PASSWORD sean correctos
# - La base de datos legacy debe estar disponible (db_legacy_infomed)

# 2. Verificar conexión a database aranto
# - Base de datos limpia o existente (será truncada/recreada)
# - Usuario con permisos de ALTER, CREATE, DROP

# 3. Backup de ambas bases de datos
mysqldump -u root -p db_legacy_infomed > backup_legacy.sql
mysqldump -u root -p aranto_medical > backup_aranto_before.sql
```

### Comando de Migración

```bash
# Opción 1: Ejecución directa (sin confirmación)
php artisan legacy:migrate --force

# Opción 2: Con confirmación interactiva
php artisan legacy:migrate

# Opción 3: Con reporte detallado generado
php artisan legacy:migrate --force --report
```

### Qué Hace el Comando

```
Paso 1: Limpia la base de datos y ejecuta todas las migraciones
  → Ejecuta: php artisan migrate:fresh --force
  
Paso 2: Ejecuta la migración completa desde legacy en 6 fases:
  → FASE 1: Configuración Base (permisos, seguros, categorías)
  → FASE 2: Datos Básicos de Aranto (servicios iniciales, usuarios)
  → FASE 3: Maestros desde Legacy (especialidades, profesionales)
  → FASE 4: Servicios desde Legacy (servicios + PRECIOS)
  → FASE 5: Datos Complejos (pacientes, solicitudes de servicio)
  → FASE 6: Validaciones (integridad UTF-8, reportes)

Tiempo total: ~18-20 segundos
```

## Verificación Post-Migración

### 1. Verificar Datos Cargados

```bash
php artisan tinker

# Verificar profesionales con comisiones
$prof = App\Models\Professional::first();
echo $prof->full_name; // Debe mostrar nombre

# Verificar servicios con precios
$service = App\Models\MedicalService::whereHas('prices')->first();
echo $service->name; // Debe mostrar servicio con precio

# Verificar pacientes
$patient = App\Models\Patient::first();
echo $patient->full_name; // Debe mostrar paciente
```

### 2. Verificar Frontend

```bash
# Acceder a: http://localhost/medical/reception
# - Debe cargar profesionales
# - Debe cargar servicios
# - Debe cargar seguros
# - Precios dinámicos al seleccionar servicio + seguro
```

### 3. Verificar Database

```bash
# Conectarse a base de datos
mysql -u root -p aranto_medical

# Verificar tablas críticas
SELECT COUNT(*) FROM professionals; -- Debe ser 262
SELECT COUNT(*) FROM medical_services; -- Debe ser 474
SELECT COUNT(*) FROM service_prices; -- Debe ser 455
SELECT COUNT(*) FROM patients; -- Debe ser 90588
SELECT COUNT(*) FROM professional_commission_settings; -- Debe ser 256
```

## Solución de Problemas

### Error: "Cannot add or update a child row"

**Causa**: Foreign key constraint violated
**Solución**: Ejecutar nuevamente `php artisan legacy:migrate --force`

### Error: "Table 'services' doesn't exist"

**Causa**: Foreign key migration no se ejecutó correctamente
**Solución**: Verificar que migration `2026_01_06_190000_fix_service_prices_foreign_key.php` esté correcta
- Debe referenciar `medical_services` no `services`

### Precios vacíos en Frontend

**Causa**: Service prices no se migraron
**Solución**: 
1. Verificar que `ServicePricesFromLegacySeeder` ejecutó sin errores
2. Verificar en database: `SELECT COUNT(*) FROM service_prices;`
3. Si está vacío, ejecutar nuevamente la migración

### UTF-8 Corrupted Characters

**Causa**: Legacy database con caracteres corruptos
**Solución**: La migración los sanitiza automáticamente
- Verificar en reporte: "✓ VALIDACIÓN EXITOSA: No hay caracteres corruptos"

## Reportes Generados

Después de ejecutar `legacy:migrate`, se genera un reporte en:
```
storage/logs/migration_report_YYYY-MM-DD_HH-MM-SS.txt
```

Contiene:
- Total de servicios migrados
- Precios por tipo de seguro
- Integridad UTF-8
- Configuración de seguros
- Validaciones

## Rollback

Si necesitas revertir la migración:

```bash
# Opción 1: Restaurar backup de aranto anterior
mysql -u root -p aranto_medical < backup_aranto_before.sql

# Opción 2: Ejecutar migrate:rollback
php artisan migrate:rollback
php artisan migrate:rollback --step=100  # Rollback todo
```

## Configuración en Docker

Si estás en Docker:

```bash
# Ejecutar migración dentro del contenedor
docker compose exec -w /var/www/html app php artisan legacy:migrate --force

# Ver logs en tiempo real
docker compose logs -f app

# Conectar a database en docker
docker compose exec mysql mysql -u root -p aranto_medical
```

## Checklist Pre-Producción

- [ ] Backup de legacy database completado
- [ ] Backup de aranto database (anterior) completado
- [ ] Conexiones a bases de datos verificadas
- [ ] Environment variables (.env) configurados correctamente
- [ ] Permisos de archivos verificados
- [ ] Migración ejecutada: `php artisan legacy:migrate --force`
- [ ] Reporte post-migración validado
- [ ] Datos en database verificados (recuento de registros)
- [ ] Frontend loadea sin errores
- [ ] Precios dinámicos funcionan
- [ ] Tests unitarios pasan (si existen)

## Soporte

Para reportar problemas:
1. Revisar el reporte generado en `storage/logs/`
2. Verificar logs del servidor: `storage/logs/laravel.log`
3. Ejecutar verificación: `php artisan db:seed --class=MasterLegacyMigrationSeeder --verbose`

---

**Última actualización**: 2026-01-07  
**Versión**: 1.0  
**Estado**: ✓ Production Ready
