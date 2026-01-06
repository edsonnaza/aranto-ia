# Guía de Migración Legacy → Aranto para Producción

## 🎯 Objetivo

Automatizar completamente la migración de datos desde la base de datos Legacy a Aranto con un único comando que incluya:
- ✅ Todas las sanitaciones (UTF-8, acentos, capitalization)
- ✅ Validaciones automáticas
- ✅ Reportes detallados
- ✅ Manejo de errores
- ✅ Idempotencia (seguro ejecutar múltiples veces)

## 🚀 Ejecución en Producción (Un Comando)

### Paso 1: Preparar Backup Fresco de Legacy
```bash
# Hacer backup de legacy (en tu servidor legacy)
mysqldump -u root -p legacy_db > backup_legacy_fresh.sql

# Actualizar la BD legacy con los últimos datos
# (copiar datos más recientes si es necesario)
```

### Paso 2: Actualizar Conexión a Legacy
Asegurate que tu `.env` apunte a la BD legacy correcta:
```env
LEGACY_DB_HOST=your-legacy-host
LEGACY_DB_DATABASE=legacy_db
LEGACY_DB_USERNAME=root
LEGACY_DB_PASSWORD=password
```

### Paso 3: Ejecutar Migración Completa (UN COMANDO)
```bash
# Ejecutar TODA la migración con validaciones y sanitaciones
php artisan db:seed --class=MasterLegacyMigrationSeeder
```

**Eso es todo.** El sistema hará:
1. Crear estructuras base (permisos, seguros, categorías)
2. Migrar especialidades desde legacy
3. Migrar profesionales desde legacy
4. **Migrar servicios CON SANITACIÓN UTF-8** ← Automático
5. Migrar precios de servicios
6. Migrar pacientes
7. Validar integridad
8. Generar reporte

## 📋 ¿Qué hace exactamente el Master Seeder?

### FASE 1: Configuración Base
```
✓ Permisos de navegación
✓ Permisos de caja
✓ Tipos de seguros (Particular, Mutualista, etc.)
✓ Categorías de servicios (28 categorías)
```

### FASE 2: Datos Básicos de Aranto
```
✓ Servicios no-legacy (servicios propios de aranto)
✓ Usuarios de caja
```

### FASE 3: Maestros desde Legacy
```
✓ Especialidades (con limpieza de nombres)
✓ Profesionales (con validaciones)
```

### FASE 4: Servicios desde Legacy (CON SANITACIONES)
```
✓ Servicios legacyremove UTF-8 corruption (¿½ → ó)
✓ Limpieza de acentos y capitalization
✓ Generación de códigos únicos
✓ Mapeo de categorías legacy → aranto
✓ Precios por seguro (producto × 2 seguros)
```

### FASE 5: Datos Complejos
```
✓ Pacientes desde legacy
✓ Solicitudes de servicio
```

### FASE 6: Validaciones y Reportes
```
✓ Validar integridad referencial
✓ Verificar no hay caracteres corruptos
✓ Generar reporte detallado
✓ Guardar reporte en storage/logs/
```

## 📊 Reporte Generado

Después de ejecutar, encontrarás un reporte en:
```
storage/logs/migration_report_YYYY-MM-DD_HH-MM-SS.txt
```

Contendrá:
```
REPORTE DE MIGRACIÓN LEGACY → ARANTO
════════════════════════════════════════════════════════

Fecha: 2026-02-15 14:30:00

SERVICIOS:
  Total en BD: 492
  Mapeados desde legacy: 482
  No-legacy: 10
  Status: ✓ CORRECTO

PRECIOS DE SERVICIOS:
  Total de precios: 964
  Precios esperados: 964
  Status: ✓ COMPLETO

INTEGRIDAD UTF-8:
  Caracteres corruptos (¿, ½): 0
  Status: ✓ LIMPIO

SEGUROS:
  Total tipos de seguros: 10
  Status: ✓ CONFIGURADO

CATEGORÍAS DE SERVICIOS:
  Total categorías: 28
  Status: ✓ CONFIGURADO
```

## 🔄 Sanitaciones Incluidas Automáticamente

Cada vez que ejecutas `MasterLegacyMigrationSeeder`, se ejecutan automáticamente:

### 1. Sanitización UTF-8
**Problema Original**: `Cauterizacii¿½n Qui¿½mica`
**Resultado**: `Cauterización Química`

Migraciones automáticas:
- `2026_01_06_160000_clean_corrupted_service_names.php`
- `2026_01_06_170000_fix_utf8_corrupted_service_names.php`
- `2026_01_06_180000_final_cleanup_service_names.php`
- `2026_01_06_190000_intelligent_cleanup_service_names.php`
- `2026_01_06_200000_aggressive_cleanup_service_names.php`

### 2. Sanitización de Nombres (ServicesFromLegacySeeder)
```php
// Automático en cada ejecución:
$sanitizedName = ServiceCodeHelper::sanitizeServiceName($product->Nombre);
// Resultado: Remove accents, Title Case, clean whitespace
```

### 3. Validaciones Incluidas
```php
// Automático:
- Verificar que no existan caracteres corruptos
- Validar FK constraints
- Verificar conteos de precios
- Reportar discrepancias
```

## 🛡️ Idempotencia (Seguro Ejecutar Múltiples Veces)

El sistema está diseñado para ser **idempotente**:

```bash
# Primera ejecución: Crea todo
php artisan db:seed --class=MasterLegacyMigrationSeeder

# Segunda ejecución: Actualiza lo existente
# (Los seeders usan firstOrCreate, updateOrCreate, etc.)
php artisan db:seed --class=MasterLegacyMigrationSeeder

# Tercera ejecución: Sin cambios (datos ya existen)
php artisan db:seed --class=MasterLegacyMigrationSeeder
```

Esto es seguro para testing y debugging.

## ⚙️ Configuración en Producción

### 1. Configurar Variables de Entorno
```env
# .env
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=aranto_db
DB_USERNAME=root
DB_PASSWORD=root

# Legacy connection (nuevo)
LEGACY_DB_CONNECTION=legacy
LEGACY_DB_HOST=legacy-server
LEGACY_DB_PORT=3306
LEGACY_DB_DATABASE=legacy_db
LEGACY_DB_USERNAME=legacy_user
LEGACY_DB_PASSWORD=legacy_pass
```

### 2. Configurar config/database.php
```php
'legacy' => [
    'driver' => 'mysql',
    'host' => env('LEGACY_DB_HOST', 'localhost'),
    'port' => env('LEGACY_DB_PORT', 3306),
    'database' => env('LEGACY_DB_DATABASE', 'legacy'),
    'username' => env('LEGACY_DB_USERNAME', 'root'),
    'password' => env('LEGACY_DB_PASSWORD', ''),
    'unix_socket' => env('LEGACY_DB_SOCKET', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => true,
    'engine' => null,
],
```

### 3. Ejecutar Migraciones Primero
```bash
# Asegurar que las migraciones están ejecutadas
php artisan migrate

# Luego ejecutar el seeder
php artisan db:seed --class=MasterLegacyMigrationSeeder
```

## 📈 Timeline Esperado

| Fase | Duración Estimada |
|------|-------------------|
| FASE 1: Configuración Base | < 1s |
| FASE 2: Datos Básicos | < 1s |
| FASE 3: Maestros | 2-5s |
| FASE 4: Servicios + Precios | 10-20s |
| FASE 5: Datos Complejos | 30-60s |
| FASE 6: Validaciones | 2-5s |
| **TOTAL** | **45-90 segundos** |

## 🚨 Resolución de Problemas

### Error: "Connection refused" a Legacy
```bash
# Verificar conexión
mysql -h legacy-server -u legacy_user -p legacy_db -e "SELECT COUNT(*) FROM producto;"
```

### Error: "Tabla no existe"
```bash
# Verificar que legacy_db tiene las tablas esperadas
mysql -h legacy-server -u legacy_user -p legacy_db -e "SHOW TABLES;"
```

### Carácter corruptos después de migrar
```bash
# Verificar caracteres corruptos
php artisan tinker
> DB::table('services')->whereRaw("name LIKE '%¿%'")->count()
```

Si hay corruptos, las migraciones de limpieza se ejecutarán automáticamente. Si persisten:
```bash
php artisan migrate
```

## ✅ Checklist Pre-Producción

- [ ] Backup de legacy actualizado
- [ ] Conexión a legacy verificada en .env
- [ ] Base de datos aranto vacía o lista para sobrescribir
- [ ] Migraciones ejecutadas: `php artisan migrate`
- [ ] Ejecutar test: `php artisan db:seed --class=MasterLegacyMigrationSeeder`
- [ ] Revisar reporte en `storage/logs/`
- [ ] Verificar no hay caracteres corruptos
- [ ] Verificar conteos de servicios y precios
- [ ] Listo para producción

## 📞 Comando de Referencia Rápida

```bash
# Migración completa en producción
php artisan db:seed --class=MasterLegacyMigrationSeeder

# Si necesitas limpiar la BD primero
php artisan migrate:reset  # ⚠️ PELIGRO: Elimina todo
php artisan migrate        # Recrear estructura
php artisan db:seed --class=MasterLegacyMigrationSeeder  # Llenar datos

# Ver reporte
cat storage/logs/migration_report_*.txt
```

---

**Estado**: 🚀 LISTO PARA PRODUCCIÓN
**Último actualizado**: 6 de enero de 2026
**Responsable**: Sistema de migración automatizado
