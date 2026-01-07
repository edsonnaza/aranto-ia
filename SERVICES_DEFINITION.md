# Definición Clara: Servicios Médicos y Precios

## Decisión Final: USAR `medical_services`

### Estructura Confirmada

```
┌─────────────────────────────────────────────────────────────────┐
│                    medical_services (TABLA PRINCIPAL)            │
├─────────────────────────────────────────────────────────────────┤
│ • id                                                             │
│ • name (ej: "Consulta General", "Radiografía de Tórax")         │
│ • code (código único, ej: "CONS-001")                           │
│ • description                                                    │
│ • category_id (FK → service_categories)                          │
│ • duration_minutes                                              │
│ • requires_appointment (boolean)                                │
│ • requires_preparation (boolean)                                │
│ • preparation_instructions                                      │
│ • default_commission_percentage                                 │
│ • status (enum: 'active', 'inactive')                           │
│ • timestamps                                                     │
└─────────────────────────────────────────────────────────────────┘
           ↓ 1:N                              ↓ M:1
    ┌──────────────────┐         ┌────────────────────────┐
    │  service_prices  │         │  service_categories    │
    ├──────────────────┤         ├────────────────────────┤
    │ • id             │         │ • id                   │
    │ • service_id ◄───┼─────────┤ • name                 │
    │ • insurance_id   │         │ • description          │
    │ • price          │         │ • status               │
    │ • effective_from │         │ • timestamps           │
    │ • effective_until│         └────────────────────────┘
    │ • created_by     │
    │ • notes          │
    │ • timestamps     │
    └──────────────────┘
             ↓ M:1
    ┌────────────────────┐
    │   insurance_types  │
    └────────────────────┘
```

## Modelos a Usar

### ✅ MANTENER Y USAR
- **MedicalService** → `app/Models/MedicalService.php`
  - Tabla: `medical_services`
  - Contiene: datos del servicio (nombre, código, duración, etc.)
  - Relación: HasMany servicePrices/prices

### ❌ ELIMINAR / NO USAR
- **Service** → `app/Models/Service.php`
  - Tabla: `services` (LEGACY/ANTIGUA)
  - ⚠️ CONFLICTA CON MedicalService
  - Será eliminada en próxima migración

### ✅ USAR PARA PRECIOS
- **ServicePrice** → `app/Models/ServicePrice.php`
  - Tabla: `service_prices`
  - Pivot/relación: medical_services + insurance_types
  - Contiene: precio por seguro y período de vigencia

## Relaciones en Código

```php
// En MedicalService.php
public function servicePrices(): HasMany {
    return $this->hasMany(ServicePrice::class, 'service_id');
}

public function prices(): HasMany {  // Alias
    return $this->hasMany(ServicePrice::class, 'service_id');
}

// En ServicePrice.php
public function medicalService(): BelongsTo {
    return $this->belongsTo(MedicalService::class, 'service_id');
}

public function insuranceType(): BelongsTo {
    return $this->belongsTo(InsuranceType::class, 'insurance_type_id');
}
```

## Flujo de Datos

### 1. Creación de Servicio Médico
```
Form Crear Servicio
    ↓
MedicalServiceController::store()
    ↓
MedicalService::create([
    'name' => 'Consulta General',
    'code' => 'CONS-001',
    'category_id' => 1,
    'status' => 'active',
    ...
])
```

### 2. Asignación de Precios por Seguro
```
Form Asignar Precio a Seguro
    ↓
ServicePriceController::store()
    ↓
ServicePrice::create([
    'service_id' => 1,           // ← MedicalService
    'insurance_type_id' => 1,    // ← InsuranceType
    'price' => 150.00,
    'effective_from' => '2026-01-01',
    'effective_until' => null,   // vigente indefinidamente
])
```

### 3. Consulta de Precio en Formulario
```
JavaScript Hook → Backend
    ↓
ReceptionController::getServicePrice()
    ↓
MedicalService::find($id)
    →servicePrices()
    →where('insurance_type_id', $insuranceId)
    →first()
    ↓
Retorna: { price: 150.00, found: true }
```

## En Controladores y Rutas

```php
// ✅ CORRECTO - Importar MedicalService
use App\Models\MedicalService;

// En controladores
$services = MedicalService::where('status', 'active')->get();
$service = MedicalService::with(['category', 'servicePrices'])->find($id);

// ❌ INCORRECTO - Importar Service (tabla antigua)
use App\Models\Service;  // NO USAR
```

## Variables en Frontend

```javascript
// En Inertia props
{
    'medicalServices' => MedicalService::with('category')
        ->where('status', 'active')
        ->orderBy('name')
        ->get(),
    'servicePrices' => ServicePrice::with(['medicalService', 'insuranceType'])
        ->where('effective_until', null)
        ->orWhereDate('effective_until', '>=', today())
        ->get(),
}

// En React
const { medicalServices, servicePrices } = usePage().props;
```

## Checklist de Implementación

- [x] Tabla `medical_services` creada
- [x] Tabla `service_prices` creada
- [x] Modelo MedicalService implementado
- [x] Modelo ServicePrice implementado
- [x] Relaciones configuradas
- [x] Controllers usando MedicalService
- [ ] Eliminar tabla `services` (LEGACY)
- [ ] Eliminar modelo Service.php (LEGACY)
- [ ] Migración de limpieza de referencias viejas

## Próximos Pasos

1. Crear migración para eliminar tabla `services` y modelo Service
2. Auditar todos los imports: buscar `use App\Models\Service;`
3. Asegurar coherencia en nombres de variables (medicalServices)
4. Documentar en API responses
