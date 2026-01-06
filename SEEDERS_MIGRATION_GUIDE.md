# Guía de Seeders para Migraciones de Datos

## Especialidades Migradas ✅

### Resumen
- **Origen**: `db_legacy_infomed.especialidades` (35 registros)
- **Destino**: `aranto_medical.specialties`
- **Estado**: ✅ Completado exitosamente
- **Seeder**: `SpecialtiesFromLegacySeeder`

### Ejecución

```bash
# Ejecutar el seeder de especialidades
docker compose exec app php artisan db:seed --class=SpecialtiesFromLegacySeeder

# O ejecutar todos los seeders de migración
docker compose exec app php artisan db:seed
```

### Transformaciones Realizadas

#### Campos Mapeados
```
Legacy:              Aranto Medical:
- Id          →      id (auto-increment)
- Nombre      →      name (normalizado)
  (sin campo) →      code (generado)
  (sin campo) →      description (generado)
  (sin campo) →      status (default: 'active')
  (sin campo) →      created_at
  (sin campo) →      updated_at
```

#### Ejemplos de Transformación
| Legacy | Nuevo | Código | Descripción |
|--------|-------|--------|-------------|
| Oftalmologia | Oftalmología | OFT | Especialista en enfermedades de los ojos |
| Cardiólogo | Cardiología | CARD | Especialista en enfermedades del corazón |
| Cirujano Plástico | Cirugía Plástica | CP | Especialista en cirugía plástica |
| Otorrinonaringolo | Otorrinolaringología | ORL | Especialista en oído, nariz y garganta |

### Características del Seeder

✅ **Mapeo Manual**: Las especialidades más importantes tienen mapeo manual hacia nombres normalizados  
✅ **Generación Automática**: Especialidades sin mapeo se generan automáticamente  
✅ **Deduplicación**: Se detectan y resuelven códigos duplicados (ej: CP, CP2)  
✅ **Manejo de Restricciones**: Deshabilita foreign keys antes de truncar  
✅ **Timestamps**: Incluye created_at y updated_at automáticamente  
✅ **Chunk Insert**: Inserta en lotes de 50 para optimizar  

### Resultado Final

```
✓ 35 especialidades migradas exitosamente
✓ Tabla specialties truncada y repoblada
✓ Todos los registros con códigos únicos
✓ Status default: 'active'
✓ Timestamps asignados
```

## Plantilla para Nuevos Seeders de Migración

### Estructura Base

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MigrateLegacyDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Obtener datos de legacy
        $this->command->info('Obteniendo datos de legacy...');
        $data = DB::connection('legacy')->table('table_name')->get();

        // 2. Truncar tabla destino (si es necesario)
        $this->command->info('Preparando tabla destino...');
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
        DB::connection('mysql')->table('target_table')->truncate();
        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');

        // 3. Transformar datos
        $toInsert = [];
        foreach ($data as $row) {
            // Transformaciones aquí
            $toInsert[] = [
                'column1' => $row->column1,
                'column2' => $this->transformValue($row->column2),
            ];
        }

        // 4. Insertar
        collect($toInsert)->chunk(50)->each(function ($chunk) {
            DB::connection('mysql')->table('target_table')->insert($chunk->toArray());
        });

        $this->command->info('✓ Migración completada: ' . count($toInsert) . ' registros');
    }

    private function transformValue($value)
    {
        // Lógica de transformación
        return trim($value);
    }
}
```

### Pasos para Crear un Nuevo Seeder

1. **Crear archivo** en `database/seeders/`
   ```bash
   touch app/database/seeders/MigrateXyzSeeder.php
   ```

2. **Obtener estructura** desde legacy
   ```bash
   docker compose exec app php artisan legacy:migrate --list
   docker compose exec app php artisan legacy:migrate nombre_tabla
   ```

3. **Identificar mapeos**
   - Comparar campos legacy con nuevos
   - Crear transformaciones necesarias
   - Documentar cambios

4. **Implementar transformaciones**
   - Normalizar strings (trim, uppercase, etc)
   - Generar valores faltantes
   - Validar integridad

5. **Probar en desarrollo**
   ```bash
   docker compose exec app php artisan db:seed --class=MigrateXyzSeeder
   ```

6. **Validar datos**
   - Contar registros
   - Verificar muestras
   - Revisar relaciones

## Seeders Pendientes (Ejemplos)

### Pacientes
```
Origen: db_legacy_infomed.pacientes (90,588 registros)
Destino: aranto_medical.patients
Campos clave: id, nombre, apellido, dni, fecha_nacimiento, genero
```

### Profesionales
```
Origen: db_legacy_infomed.profesionales (262 registros)
Destino: aranto_medical.professionals
Campos clave: id, nombre, apellido, matricula, especialidad_id
```

### Usuarios
```
Origen: db_legacy_infomed.users (61 registros)
Destino: aranto_medical.users
Campos clave: id, name, email, password, role_id
```

## Consideraciones Importantes

### ⚠️ Restricciones de Clave Foránea
```php
// Deshabilitar antes de truncar
DB::statement('SET FOREIGN_KEY_CHECKS=0');
DB::table('tabla')->truncate();
// Habilitar después
DB::statement('SET FOREIGN_KEY_CHECKS=1');
```

### ⚠️ Timestamps en Migraciones
```php
// Usar `now()` para timestamps consistentes
$now = now();
$toInsert[] = [
    'created_at' => $now,
    'updated_at' => $now,
];
```

### ⚠️ Encoding de Caracteres Especiales
```php
// Si hay problemas con acentos:
$value = mb_convert_encoding($value, 'UTF-8', 'auto');
```

### ⚠️ Deduplicación
```php
// Mantener track de valores únicos
$usedCodes = [];
foreach ($items as $item) {
    $code = $item->code;
    if (isset($usedCodes[$code])) {
        $code = $code . '2'; // Variación
    }
    $usedCodes[$code] = true;
}
```

## Testing y Validación

### Validar después de cada migración
```bash
# Contar registros
docker compose exec -T mysql mysql -uaranto_user -p4r4nt0 aranto_medical \
  -e "SELECT COUNT(*) FROM tabla_destino;"

# Ver muestras
docker compose exec -T mysql mysql -uaranto_user -p4r4nt0 aranto_medical \
  -e "SELECT * FROM tabla_destino LIMIT 10;"

# Verificar integridad
docker compose exec -T mysql mysql -uaranto_user -p4r4nt0 aranto_medical \
  -e "SELECT COUNT(DISTINCT id) FROM tabla_destino;"
```

## Referencia Rápida

```bash
# Listar todos los seeders
docker compose exec app php artisan

# Ejecutar un seeder específico
docker compose exec app php artisan db:seed --class=SpecialtiesFromLegacySeeder

# Resetear database y ejecutar todos los seeders
docker compose exec app php artisan migrate:fresh --seed

# Truncar una tabla
docker compose exec app php artisan tinker
# Luego: DB::table('specialties')->truncate();
```
