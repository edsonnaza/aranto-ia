# Refactor Arquitectónico: Separación de Identidades en Lab Tests

## Problema Original

La columna `assigned_to` en la tabla `lab_test_requests` mezclaba dos conceptos distintos:
- **professional_id** (identidad médica/profesional) 
- **users.id** (identidad del sistema para acceso)

Esto causaba errores FK porque un technician podría no tener un usuario asociado si solo era registrado como professional.

---

## Solución: Separación de Identidades

### Conceptos Base

1. **User** - Identidad del sistema
   - Autenticación y autorización
   - Roles y permisos Spatie
   - Acceso al sistema
   - Puede estar sin Professional

2. **Professional** - Identidad profesional
   - Registro médico/de laboratorio
   - Autoridad para firmar/validar resultados
   - Referencia para responsabilidad clínica
   - Puede estar sin User (ej: profesionales consultores)

### Columnas en lab_test_requests

| Columna | Referencia | Significado |
|---------|-----------|------------|
| `assigned_to_user_id` | users.id | **QUIÉN EJECUTA** el análisis |
| `requested_by` | users.id | QUIÉN SOLICITÓ el análisis |
| `validated_by_professional_id` | professionals.id | **QUIÉN FIRMA/VALIDA** el resultado |

### Columnas en lab_results

| Columna | Referencia | Significado |
|---------|-----------|------------|
| `performed_by_user_id` | users.id | QUIÉN EJECUTÓ el análisis |
| `validated_by_professional_id` | professionals.id | **QUIÉN FIRMA** el resultado (bioquímico/supervisor) |

---

## Flujo de Un Análisis

```
1. SOLICITUD (request)
   - requested_by: User::id del médico solicitante
   ↓
2. ASIGNACIÓN (assigned)
   - assigned_to_user_id: User::id del technician
   ↓
3. EJECUCIÓN (performed)
   - performed_by_user_id: User::id del technician que ejecutó
   ↓
4. VALIDACIÓN (validated)
   - validated_by_professional_id: Professional::id del bioquímico/supervisor
```

---

## Roles en Laboratorio

### lab-technician
- Solo User, sin Professional requerido
- Ejecuta análisis: `assigned_to_user_id`
- NO puede validar resultados
- Permisos: create, read, execute lab tests

### lab-biochemist
- Requiere AMBOS: User + Professional
- Ejecuta análisis: `assigned_to_user_id`
- Valida resultados: `validated_by_professional_id`
- Permisos: create, read, execute, validate lab tests

### lab-supervisor
- Requiere AMBOS: User + Professional
- Supervisa análisis
- Valida resultados de otros: `validated_by_professional_id`
- Permisos: full laboratory control

---

## Migraciones Realizadas

### 2026_06_03_000001_refactor_lab_test_requests_assigned_to.php

```php
Schema::table('lab_test_requests', function (Blueprint $table) {
    $table->renameColumn('assigned_to', 'assigned_to_user_id');
    $table->dropForeign(['assigned_to_user_id']);
    $table->foreign('assigned_to_user_id')
        ->references('id')
        ->on('users')
        ->onDelete('cascade');
});
```

**Cambios:**
- Renombra `assigned_to` → `assigned_to_user_id` para claridad
- Redefine FK para apuntar a `users.id` (no professionals.id)

### 2026_06_03_000002_add_validated_by_professional_id_to_lab_results.php

```php
Schema::table('lab_results', function (Blueprint $table) {
    $table->foreignId('validated_by_professional_id')
        ->nullable()
        ->constrained('professionals')
        ->onDelete('set null');
});

Schema::table('lab_validations', function (Blueprint $table) {
    $table->foreignId('validated_by_professional_id')
        ->nullable()
        ->constrained('professionals')
        ->onDelete('set null');
});
```

**Cambios:**
- Agrega `validated_by_professional_id` para separar la validación profesional

---

## Actualización del Controlador

### LabSampleController::startAnalysis()

**Antes:**
```php
LabTestRequest::create([
    'lab_sample_id' => $sample->id,
    'assigned_to' => $detail->professional_id,  // ❌ INCORRECTO
]);
```

**Después:**
```php
$assignedToUserId = null;

if ($detail->professional_id) {
    $professional = Professional::query()->find($detail->professional_id);
    $assignedToUserId = $professional?->user_id;
}

LabTestRequest::create([
    'lab_sample_id' => $sample->id,
    'assigned_to_user_id' => $assignedToUserId,  // ✅ CORRECTO
]);
```

---

## Modelos Relacionados

### LabTestRequest.php

```php
class LabTestRequest extends Model
{
    protected $fillable = [
        'lab_sample_id',
        'lab_test_profile_id',
        'assigned_to_user_id',  // NUEVO nombre
        'validated_by_professional_id',  // NUEVO
        'requested_by',
        'status',
        'notes',
    ];

    public function assignedToUser()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function validatedByProfessional()
    {
        return $this->belongsTo(Professional::class, 'validated_by_professional_id');
    }
}
```

### LabResult.php

```php
class LabResult extends Model
{
    protected $fillable = [
        'lab_test_request_id',
        'performed_by_user_id',  // QUIÉN EJECUTÓ
        'validated_by_professional_id',  // QUIÉN FIRMA
        'value',
        'unit',
        'status',
    ];

    public function performedByUser()
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }

    public function validatedByProfessional()
    {
        return $this->belongsTo(Professional::class, 'validated_by_professional_id');
    }
}
```

---

## Validaciones Actualizadas

### LabSampleController::bulkStore()

```php
// ANTES
'assigned_to' => 'required|exists:professionals,id'

// DESPUÉS
'assigned_to_user_id' => 'required|exists:users,id'
```

---

## Checklist de Implementación

- [x] Crear migración de renombramiento: `assigned_to` → `assigned_to_user_id`
- [x] Crear migración de validación: agregar `validated_by_professional_id`
- [x] Crear LaboratoryRolesSeeder con 3 roles y 9-14 permisos
- [x] Actualizar LabSampleController: startAnalysis(), bulkStore()
- [x] Agregar LaboratoryRolesSeeder a MasterLegacyMigrationSeeder
- [ ] Ejecutar migraciones: `docker compose exec app php artisan migrate`
- [ ] Actualizar modelos: LabTestRequest, LabResult, LabValidation
- [ ] Actualizar componentes React si es necesario
- [ ] End-to-end testing de análisis con nuevo schema

---

## Ejecución

```bash
# Aplicar todas las migraciones y seeders
docker compose exec app php artisan legacy:migrate

# O solo migrar
docker compose exec app php artisan migrate
```

---

## Impacto en Componentes Frontend

### ResultForm.tsx

Cambios necesarios: **NINGUNO**
- El form sigue siendo igual
- `test_request_id` sigue siendo la clave de conexión
- Los datos vienen del backend vía Inertia props

### Samples Index.tsx

Cambios necesarios: **NINGUNO**
- "Iniciar Análisis" sigue haciendo POST a `start-analysis`
- El controlador maneja la lógica de asignación interna

---

## FAQ

**P: ¿Un technician sin Professional puede ejecutar análisis?**
R: Sí. Tendrá `assigned_to_user_id` (su User ID), pero `validated_by_professional_id` será NULL hasta que un bioquímico lo valide.

**P: ¿Un biochemist requiere ambos User y Professional?**
R: Sí. Necesita User para autenticarse y Professional para poder firmar/validar resultados.

**P: ¿Dónde está el histórico de quién validó qué?**
R: En `lab_validations` que ahora tiene `validated_by_professional_id` para auditoría.

**P: ¿Puedo cambiar assigned_to_user_id después de crear la solicitud?**
R: Sí, es un campo nullable. Pero solo debe cambiarse mediante lógica explícita (reasignación).

**P: ¿Qué pasa si eliminan un professional que firmó resultados?**
R: El `validated_by_professional_id` en lab_results se pone NULL (por `onDelete('set null')`) pero el histórico se mantiene.
