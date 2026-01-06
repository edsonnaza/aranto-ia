# Guía de Migración de Datos desde db_legacy_infomed

## Estado de la Base de Datos Legacy

✅ Base de datos `db_legacy_infomed` cargada exitosamente desde `/Users/edsonnaza/Desktop/dbventasweb_20260106.sql`

### Ubicación
- Host: `mysql` (Docker container)
- Puerto: 3306
- Base de datos: `db_legacy_infomed`
- Usuario: `aranto_user` (con permisos completos)

### Herramientas Disponibles

Se han creado dos herramientas principales para facilitar la migración:

#### 1. LegacyMigrationService
Ubicación: `app/Services/LegacyMigrationService.php`

Métodos disponibles:
```php
// Ejecutar consultas en la base de datos legacy
$service->queryLegacy(string $query): array

// Obtener todas las tablas
$service->getLegacyTables(): array

// Obtener estructura de una tabla
$service->getLegacyTableStructure(string $tableName): array

// Obtener datos de una tabla
$service->getLegacyTableData(string $tableName, ?int $limit = null): array

// Contar registros en una tabla
$service->getLegacyTableCount(string $tableName): int

// Migrar una tabla completa
$service->migrateTable(string $sourceTable, string $targetTable, ?array $columnMap = null): array

// Ejecutar consulta personalizada
$service->customQuery(string $query): array

// Migrar múltiples tablas
$service->migrateBatch(array $migrations): array

// Probar conexión
$service->testConnection(): bool
```

#### 2. Comando Artisan: legacy:migrate
Ubicación: `app/Console/Commands/MigrateLegacyData.php`

##### Probar conexión
```bash
docker compose exec app php artisan legacy:migrate --test
```

##### Listar todas las tablas
```bash
docker compose exec app php artisan legacy:migrate --list
```

##### Migrar una tabla específica
```bash
docker compose exec app php artisan legacy:migrate pacientes
docker compose exec app php artisan legacy:migrate profesionales
docker compose exec app php artisan legacy:migrate cliente
```

##### Menú interactivo
```bash
docker compose exec app php artisan legacy:migrate
```

## Tablas Disponibles para Migración

Total de tablas: 99

### Tablas Principales (Pacientes y Profesionales)
- **pacientes** (90,588 registros)
- **profesionales** (262 registros)
- **especialidades** (35 registros)
- **cliente** (90,608 registros)
- **empleado** (61 registros)

### Tablas de Admisión y Atención
- **admision** (179,570 registros)
- **admisiondetalles** (185,850 registros)
- **urgencias_cab** (9,010 registros)
- **urgencias_det** (77,137 registros)
- **internados_cab** (4,890 registros)
- **internados_det** (224,537 registros)

### Tablas de Productos y Farmacia
- **producto** (2,611 registros)
- **productos** (105 registros)
- **producto_precios** (7,782 registros)
- **existencia** (18,014 registros)
- **acuse_farmacia** (71 registros)
- **condicion_farmacia** (5 registros)

### Tablas de Ventas
- **venta** (139,541 registros)
- **detalleventa** (142,997 registros)
- **carrito** (11 registros)

### Tablas de Inventario
- **inventarios_cab** (1,168 registros)
- **inventarios_det** (78,945 registros)
- **reposiciones_cab** (672 registros)
- **reposiciones_det** (32,802 registros)
- **transferencias_cab** (2,011 registros)
- **transferencias_det** (9,620 registros)

### Tablas de Seguros y Cobros
- **seguros** (13 registros)
- **seguros_planes** (2 registros)
- **cobroseguroscabecera** (26 registros)
- **pagoscomision** (2,637 registros)

### Tablas de Auditoría
- **auditorias** (694,606 registros)
- **tls_permisos** (658 registros)
- **tls_proceso** (13 registros)
- **tls_sub_procesos** (61 registros)

### Otras Tablas
- **categorias** (48 registros)
- **comprasfi_cab** (1,086 registros)
- **comprasfi_det** (2,351 registros)
- **usuarios** (61 registros)
- **empresas** (106 registros)
- **paises** (11 registros)
- **sedes** (5 registros)
- Y muchas más...

## Ejemplos de Uso

### Ejemplo 1: Migrar tabla de Pacientes
```bash
docker compose exec app php artisan legacy:migrate pacientes
```

### Ejemplo 2: Migrar tabla de Profesionales
```bash
docker compose exec app php artisan legacy:migrate profesionales
```

### Ejemplo 3: Uso en código PHP
```php
use App\Services\LegacyMigrationService;

// Obtener datos de pacientes
$service = new LegacyMigrationService();
$pacientes = $service->getLegacyTableData('pacientes', 100);

// Migrar tabla completa
$result = $service->migrateTable('pacientes', 'patients');

// Consulta personalizada
$custom = $service->customQuery("
    SELECT p.*, e.nombre as especialidad 
    FROM profesionales p
    LEFT JOIN especialidades e ON p.especialidad_id = e.id
    LIMIT 10
");
```

### Ejemplo 4: Migración por Lotes
```php
$migrations = [
    ['source' => 'pacientes', 'target' => 'patients'],
    ['source' => 'profesionales', 'target' => 'professionals'],
    ['source' => 'especialidades', 'target' => 'specialties'],
];

$results = $service->migrateBatch($migrations);
foreach ($results as $result) {
    if ($result['success']) {
        echo "✓ {$result['target']}: {$result['migrated_rows']}/{$result['total_rows']}";
    }
}
```

## Configuración

La conexión `legacy` está configurada en `config/database.php`:

```php
'legacy' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => 'db_legacy_infomed',
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
]
```

## Pasos Recomendados para Migración

1. **Preparación**
   ```bash
   docker compose exec app php artisan legacy:migrate --test
   ```

2. **Inspeccionar estructura**
   ```bash
   docker compose exec app php artisan legacy:migrate pacientes
   ```

3. **Crear mapeos de columnas** (si es necesario)
   - Identificar diferencias entre esquemas
   - Crear archivos de mapping personalizados

4. **Ejecutar migraciones**
   - Por tabla individual
   - O por lotes personalizados

5. **Validación**
   - Contar registros antes/después
   - Verificar integridad de datos
   - Revisar relaciones

## Notas Importantes

- El usuario `aranto_user` tiene permisos completos en `db_legacy_infomed`
- Los errores de inserción no detienen la migración (se registran en los logs)
- Todas las operaciones deben ejecutarse dentro del contenedor Docker
- Las migraciones se pueden ejecutar múltiples veces (considerar duplicados)
- Usar transacciones para migraciones críticas

## Conexión desde PHPMyAdmin

- URL: `http://localhost:8081`
- Host: `mysql`
- Usuario: `root` o `aranto_user`
- Contraseña: `4r4nt0`
- Seleccionar base de datos: `db_legacy_infomed`
