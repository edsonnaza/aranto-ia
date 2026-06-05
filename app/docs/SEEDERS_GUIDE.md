# Guía de Seeders de Aranto

## Regla Principal: TODO nuevo seeder DEBE agregarse a MasterLegacyMigrationSeeder

Cuando crees un nuevo seeder, **siempre** debes agregarlo a la lista de ejecución global en `MasterLegacyMigrationSeeder`.

---

## Estructura de Fases

El sistema de seeders está organizado en **5 FASES**:

### FASE 1: Configuración Base y Estructuras
**Qué va aquí:**
- Roles y permisos del sistema
- Configuraciones de navegación
- Tipos de seguros
- Categorías de servicios
- Cualquier estructura base compartida

**Ubicación en código:**
```php
$this->phase('FASE 1', 'Configuración Base y Estructuras', function () {
    $this->call(NavigationPermissionsSeeder::class);
    $this->call(CashRegisterPermissionsSeeder::class);
    $this->call(LaboratoryRolesSeeder::class);  // ← EJEMPLO
    $this->call(InsuranceTypesSeeder::class);
    $this->call(ServiceCategoriesSeeder::class);
});
```

**Seeders actuales:**
- `NavigationPermissionsSeeder` - Permisos de navegación
- `CashRegisterPermissionsSeeder` - Permisos de caja
- `LaboratoryRolesSeeder` - Roles de laboratorio (técnico, bioquímico, supervisor)
- `InsuranceTypesSeeder` - Tipos de seguros
- `ServiceCategoriesSeeder` - Categorías de servicios

---

### FASE 2: Datos Básicos de Aranto
**Qué va aquí:**
- Servicios médicos genéricos
- Servicios de laboratorio
- Usuarios especiales (caja, etc.)
- Tipos de muestras
- Equipos de laboratorio
- Perfiles de pruebas de laboratorio
- Rangos de referencia

**Patrón:** Datos que no dependen de legacy, sino de configuración estándar.

**Ubicación en código:**
```php
$this->phase('FASE 2', 'Datos Básicos de Aranto', function () {
    $this->call(ServicesSeeder::class);
    $this->call(LaboratoryServicesSeeder::class);  // ← EJEMPLO
    $this->call(CashRegisterUsersSeeder::class);
    $this->call(LabSampleTypeSeeder::class);
    $this->call(LabEquipmentSeeder::class);
    $this->call(LabTestProfileSeeder::class);
    $this->call(LabReferenceRangeSeeder::class);
});
```

**Seeders actuales:**
- `ServicesSeeder` - Servicios médicos base
- `LaboratoryServicesSeeder` - Servicios de análisis (hemograma, etc.)
- `CashRegisterUsersSeeder` - Usuarios para caja
- `LabSampleTypeSeeder` - Tipos de muestras (sangre, orina, etc.)
- `LabEquipmentSeeder` - Equipos de laboratorio (analizadores, etc.)
- `LabTestProfileSeeder` - Perfiles de prueba (hemograma completo, etc.)
- `LabReferenceRangeSeeder` - Rangos normales de parámetros

---

### FASE 3: Migraciones desde Legacy - Maestros
**Qué va aquí:**
- Especialidades desde base legacy
- Profesionales desde base legacy

**Patrón:** Datos que vienen de la base de datos antigua.

---

### FASE 4: Servicios desde Legacy
**Qué va aquí:**
- Servicios adicionales desde legacy (con sanitaciones)
- Precios de servicios desde legacy

**Patrón:** Datos legacy con limpieza UTF-8 y correcciones.

---

### FASE 5: Datos Complejos desde Legacy
**Qué va aquí:**
- Pacientes
- Solicitudes de servicios
- Cualquier dato que dependa de fases previas

**Patrón:** Datos que requieren que las tablas anteriores estén pobladas.

---

## Cómo Agregar un Nuevo Seeder

### 1. Crear el seeder

```php
php artisan make:seeder MiNuevoSeeder
```

### 2. Implementar la lógica

```php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MiNuevoSeeder extends Seeder
{
    public function run(): void
    {
        // Tu lógica aquí
    }
}
```

### 3. **IMPORTANTE:** Agregarlo a MasterLegacyMigrationSeeder

Abre `database/seeders/MasterLegacyMigrationSeeder.php` y agrega tu seeder a la FASE correspondiente.

**Ejemplo: Agregando un nuevo seeder de laboratorio en FASE 2**

```php
$this->phase('FASE 2', 'Datos Básicos de Aranto', function () {
    $this->call(ServicesSeeder::class);
    $this->call(LaboratoryServicesSeeder::class);
    $this->call(CashRegisterUsersSeeder::class);
    $this->call(LabSampleTypeSeeder::class);
    $this->call(LabEquipmentSeeder::class);
    $this->call(LabTestProfileSeeder::class);
    $this->call(LabReferenceRangeSeeder::class);
    $this->call(MiNuevoSeeder::class);  // ← AGREGAR AQUÍ
});
```

**⚠️ IMPORTANTE:** Agrega el seeder en AMBAS ejecuciones (sin legacy Y con legacy) si aplica.

---

## Ejecutar los Seeders

### Migración completa con todos los seeders

```bash
docker compose exec app php artisan legacy:migrate
```

Esto ejecuta:
1. `migrate:fresh` - Borra y recrea todas las tablas
2. Todas las fases de seeders en orden

### Ejecutar solo un seeder (para testing)

```bash
docker compose exec app php artisan db:seed --class="MiNuevoSeeder"
```

---

## Convenciones de Nombres

- **Seeders de base:** `XyzSeeder.php`
- **Seeders de legacy:** `XyzFromLegacySeeder.php`
- **Seeders de roles:** `XyzRolesSeeder.php` o `RolesSeeder.php`

---

## Checklist para nuevo seeder

- [ ] Crear archivo seeder
- [ ] Implementar lógica en `run()`
- [ ] Agregar `$this->call(MiNuevoSeeder::class);` en MasterLegacyMigrationSeeder (FASE correcta)
- [ ] Verificar que se ejecute correctamente: `php artisan db:seed --class="MiNuevoSeeder"`
- [ ] Correr migración completa: `php artisan legacy:migrate`
- [ ] Commitar cambios

---

## Referencia de Seeders Actuales

| Seeder | Fase | Propósito |
|--------|------|----------|
| NavigationPermissionsSeeder | 1 | Permisos de navegación |
| CashRegisterPermissionsSeeder | 1 | Permisos de caja |
| LaboratoryRolesSeeder | 1 | Roles de laboratorio (LAB_TECHNICIAN, LAB_BIOCHEMIST, LAB_SUPERVISOR) |
| InsuranceTypesSeeder | 1 | Tipos de seguros |
| ServiceCategoriesSeeder | 1 | Categorías de servicios |
| ServicesSeeder | 2 | Servicios médicos base |
| LaboratoryServicesSeeder | 2 | Servicios de laboratorio (7 perfiles) |
| CashRegisterUsersSeeder | 2 | Usuarios de caja |
| LabSampleTypeSeeder | 2 | Tipos de muestras (sangre, orina, etc.) |
| LabEquipmentSeeder | 2 | Equipos de laboratorio (7 equipos) |
| LabTestProfileSeeder | 2 | Perfiles de prueba (7 perfiles) |
| LabReferenceRangeSeeder | 2 | Rangos de referencia (28 parámetros) |
| SpecialtiesFromLegacySeeder | 3 | Especialidades desde legacy |
| ProfessionalsFromLegacySeeder | 3 | Profesionales desde legacy |
| ServicesFromLegacySeeder | 4 | Servicios adicionales desde legacy |
| ServicePricesFromLegacySeeder | 4 | Precios de servicios desde legacy |

---

## FAQ

**P: ¿Debo agregar mi seeder en dos lugares?**
R: Sí, si el seeder puede ejecutarse tanto con como sin legacy. Busca las dos instancias de la FASE correspondiente en MasterLegacyMigrationSeeder.

**P: ¿Qué pasa si no agrego mi seeder?**
R: El seeder se habrá creado, pero nadie lo ejecutará automáticamente. Solo si lo llamas manualmente con `php artisan db:seed --class="MiNuevoSeeder"`.

**P: ¿En qué fase va mi seeder?**
R: Depende:
- Roles/permisos → FASE 1
- Datos estáticos nuevos (servicios, equipos) → FASE 2
- Datos desde legacy → FASE 3, 4 o 5

**P: ¿Puedo cambiar el orden dentro de una fase?**
R: En general no, porque algunos seeders pueden depender de otros. Verifica dependencias en tu seeder.
