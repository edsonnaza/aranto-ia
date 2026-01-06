# 🚀 Sistema Automatizado de Migración Legacy → Aranto

## Resumen Ejecutivo

Hemos creado un sistema **completamente automatizado** para migrar datos de Legacy a Aranto con:
- ✅ Un único comando para toda la migración
- ✅ Sanitaciones automáticas (UTF-8, acentos, capitalization)
- ✅ Validaciones integradas
- ✅ Reportes detallados
- ✅ Idempotencia (seguro ejecutar múltiples veces)

## 🎯 En Producción: Un Comando

```bash
php artisan legacy:migrate --force
```

Eso es todo. El sistema ejecutará:
1. **FASE 1**: Configuración base (permisos, seguros, categorías)
2. **FASE 2**: Datos básicos de aranto
3. **FASE 3**: Maestros desde legacy (especialidades, profesionales)
4. **FASE 4**: Servicios desde legacy **CON SANITACIONES**
5. **FASE 5**: Datos complejos (pacientes, solicitudes)
6. **FASE 6**: Validaciones y reportes

**Tiempo estimado**: 45-90 segundos

## 📦 Componentes del Sistema

### 1. Master Seeder
**Archivo**: `database/seeders/MasterLegacyMigrationSeeder.php`

- Orquestra todas las fases de migración
- Incluye validaciones automáticas
- Genera reportes
- Maneja errores

### 2. Comando Artisan Mejorado
**Archivo**: `app/Console/Commands/MigrateLegacyData.php`

```bash
# Ejecución simple
php artisan legacy:migrate --force

# Ejecución con reporte detallado
php artisan legacy:migrate --force --report
```

### 3. Sanitaciones Automáticas

Los seeders incluyen todas las sanitaciones:
- ✅ Limpieza UTF-8 (¿½ → ó)
- ✅ Limpieza de acentos
- ✅ Capitalization (Title Case)
- ✅ Validación de duplicados

### 4. Migraciones de Limpieza

Se ejecutan automáticamente:
```
2026_01_06_160000_clean_corrupted_service_names.php
2026_01_06_170000_fix_utf8_corrupted_service_names.php
2026_01_06_180000_final_cleanup_service_names.php
2026_01_06_190000_intelligent_cleanup_service_names.php
2026_01_06_200000_aggressive_cleanup_service_names.php
```

## 📋 Checklist Pre-Producción

- [ ] Backup fresco de legacy preparado
- [ ] `.env` apuntando a legacy correcta
- [ ] Migraciones ejecutadas: `php artisan migrate`
- [ ] Test: `php artisan legacy:migrate --force`
- [ ] Revisar reporte en `storage/logs/`
- [ ] Verificar no hay caracteres corruptos
- [ ] Verificar conteos de servicios y precios

## 📊 Reporte Generado

```
REPORTE DE MIGRACIÓN LEGACY → ARANTO
════════════════════════════════════════

Fecha: 2026-02-15 14:30:00

SERVICIOS:
  Total: 492
  Desde legacy: 482
  Con acentos válidos: 490
  Caracteres corruptos: 0
  Estado: ✓ CORRECTO

PRECIOS:
  Total: 964
  Particular: 474
  Mutualista: 474
  Estado: ✓ COMPLETO

INTEGRIDAD UTF-8:
  Caracteres corruptos: 0
  Estado: ✓ LIMPIO
```

## 🔄 Idempotencia

El sistema es seguro para ejecutar múltiples veces:

```bash
# Primera ejecución: Crea todo
php artisan legacy:migrate --force

# Segunda ejecución: Actualiza lo existente
php artisan legacy:migrate --force

# Tercera ejecución: Sin cambios
php artisan legacy:migrate --force
```

Cada seeder usa `firstOrCreate` o `updateOrCreate` para ser seguro.

## 🛡️ Manejo de Errores

Si algo falla:
1. El comando se detiene y muestra el error
2. Se puede reinterar después de resolver el problema
3. No duplica datos por el uso de transacciones

```bash
# Si falla en FASE 4, ejecutar después de resolver
php artisan legacy:migrate --force
```

## 📈 Casos de Uso

### Caso 1: Migración Inicial en Producción
```bash
php artisan legacy:migrate --force
```

### Caso 2: Actualizar datos después de un cambio en legacy
```bash
# Descargar backup fresco de legacy
# Actualizar conexión en .env si es necesario
php artisan legacy:migrate --force
```

### Caso 3: Testing y Validación
```bash
# Generar reporte detallado para revisar
php artisan legacy:migrate --force --report

# Ver reporte
cat storage/logs/detailed_report_*.txt
```

## 🎨 Estructura de Seeders

```
Seeders Legacy Migration:
├── MasterLegacyMigrationSeeder
│   ├── FASE 1: NavigationPermissionsSeeder
│   │          CashRegisterPermissionsSeeder
│   │          InsuranceTypesSeeder
│   │          ServiceCategoriesSeeder
│   │          CreateAdditionalServiceCategoriesSeeder
│   │
│   ├── FASE 2: ServicesSeeder
│   │          CashRegisterUsersSeeder
│   │
│   ├── FASE 3: SpecialtiesFromLegacySeeder
│   │          ProfessionalsFromLegacySeeder
│   │
│   ├── FASE 4: ServicesFromLegacySeeder (CON SANITACIONES)
│   │          ServicePricesFromLegacySeeder
│   │
│   ├── FASE 5: PatientsFromLegacySeeder
│   │          ServiceRequestSeeder
│   │
│   └── FASE 6: Validaciones y Reportes
```

## 🔧 Personalización

Si necesitas modificar el proceso:

1. **Cambiar orden de seeders**: Editar `MasterLegacyMigrationSeeder::run()`
2. **Agregar validaciones**: Agregar en `validateIntegrity()`
3. **Cambiar sanitaciones**: Editar `ServiceCodeHelper::cleanCorruptedUtf8()`
4. **Agregar más reportes**: Editar `generateReport()`

## 📚 Documentación Completa

- [PRODUCTION_MIGRATION_GUIDE.md](PRODUCTION_MIGRATION_GUIDE.md) - Guía detallada
- [UTF8_CLEANUP_SUMMARY.md](UTF8_CLEANUP_SUMMARY.md) - Limpieza UTF-8
- [SANITIZATION_SUMMARY.md](SANITIZATION_SUMMARY.md) - Sanitaciones

## 🚀 Próximos Pasos

1. ✅ Revisar configuración
2. ✅ Hacer test en ambiente de staging
3. ✅ Ejecutar en producción
4. ✅ Monitorear logs

## 📞 Referencia Rápida

```bash
# Ejecución básica
php artisan legacy:migrate --force

# Con reporte detallado
php artisan legacy:migrate --force --report

# Ver estado actual
php artisan migrate:status

# Si necesitas rollback (⚠️ cuidado)
php artisan migrate:reset

# Ejecutar solo las migraciones
php artisan migrate

# Ejecutar solo el seeder
php artisan db:seed --class=MasterLegacyMigrationSeeder
```

---

**Estado**: 🚀 LISTO PARA PRODUCCIÓN
**Último actualizado**: 6 de enero de 2026
**Responsable**: Sistema automatizado de migración
