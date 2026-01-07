# Revisión: ReceptionController.php - Método create()

## Análisis línea por línea

### 1️⃣ PATIENTS (Líneas 91-106)

```php
'patients' => Patient::where('status', 'active')
    ->orderBy('first_name')
    ->orderBy('last_name')
    ->get(['id', 'first_name', 'last_name', 'document_type', 'document_number'])
    ->map(function ($patient) {
        return [
            'value' => $patient->id,
            'label' => $patient->full_name . ' - ' . $patient->formatted_document,
            'full_name' => $patient->full_name,
            'document' => $patient->formatted_document,
        ];
    }),
```

**Estado: ✅ CORRECTO**

- Carga: pacientes activos, ordenados alfabéticamente
- Selecciona solo columnas necesarias (optimizado)
- Transforma a formato select (value/label)
- Usa accessors definidos: `full_name`, `formatted_document`
- ✅ Conforme a definición

---

### 2️⃣ MEDICAL SERVICES (Líneas 107-111)

```php
'medicalServices' => MedicalService::with('category')
    ->where('status', 'active')
    ->orderBy('name')
    ->get(),
```

**Estado: ✅ CORRECTO**

- Carga: servicios activos de tabla `medical_services` (✅ correcto, no `services`)
- Eager load: relación `category` (previene N+1 queries)
- Ordena por nombre
- Retorna modelo completo con relaciones
- ✅ Conforme a definición

**Verificación de modelo:**
- Tabla: `medical_services` ✅
- Status: enum('active', 'inactive') ✅
- Relación: `category()` → BelongsTo ✅

---

### 3️⃣ PROFESSIONALS (Líneas 112-116)

```php
'professionals' => Professional::where('status', 'active')
    ->orderBy('first_name')
    ->orderBy('last_name')
    ->get(),
```

**Estado: ✅ CORRECTO**

- Carga: profesionales activos
- Ordenados alfabéticamente
- Status: enum('active', 'inactive', 'suspended') ✅
- ✅ Conforme a definición

---

### 4️⃣ INSURANCE TYPES (Líneas 117-121)

```php
'insuranceTypes' => InsuranceType::where('status', 'active')
    ->orderBy('name')
    ->get(),
```

**Estado: ✅ CORRECTO**

- Carga: seguros activos ordenados por nombre
- Status: 'active' (enum) ✅
- ✅ Conforme a definición

---

## RESUMEN GENERAL

| Variable | Tabla | Modelo | Status | Relaciones | ✅/❌ |
|----------|-------|--------|--------|-----------|-------|
| patients | patients | Patient | 'active' | - | ✅ |
| medicalServices | medical_services | MedicalService | 'active' | category | ✅ |
| professionals | professionals | Professional | 'active' | - | ✅ |
| insuranceTypes | insurance_types | InsuranceType | 'active' | - | ✅ |

---

## CONSIDERACIONES ADICIONALES

### ⚠️ Falta: ServicePrice en create()

La definición indica que se deben cargar los precios de servicios, pero actualmente **no se están pasando** a la vista.

**Opción 1: Cargar en create() (si el frontend los necesita en formulario)**
```php
'servicePrices' => ServicePrice::with(['medicalService', 'insuranceType'])
    ->where(function ($q) {
        $q->whereNull('effective_until')
          ->orWhereDate('effective_until', '>=', today());
    })
    ->get(),
```

**Opción 2: Cargar en frontend via hook custom (RECOMENDADO)**
```javascript
const useServicePrices = () => {
  const { medicalServices, insuranceTypes } = usePage().props
  // Calcular precios dinámicamente según selecciones
}
```

**Recomendación:** Opción 2 (hook custom) es más eficiente, carga lazy cuando se selecciona servicio + seguro.

---

## SIGUIENTE PASO

### ¿Debemos agregar servicePrices en create()?

**Pregunta:** ¿El frontend necesita todos los precios al cargar el formulario, o se cargan dinámicamente cuando el usuario selecciona servicio + seguro?

Si es lo segundo, está bien así. Si es lo primero, agregar:

```php
'servicePrices' => ServicePrice::where(function ($q) {
    $q->whereNull('effective_until')
      ->orWhereDate('effective_until', '>=', today());
})->get(),
```
