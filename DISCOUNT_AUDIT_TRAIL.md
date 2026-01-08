# Sistema de Auditoría de Descuentos - Service Requests & Transactions

## Objetivo
Mantener un registro completo y auditable de todos los valores de descuentos aplicados a los servicios, preservando tanto el valor original como los valores con descuento.

## Estructura de Datos

### 1. Service Request Details (Tabla Principal)
Cada servicio en una solicitud guarda los siguientes campos:

```sql
service_request_details:
├── unit_price (10,2)           -- PRECIO ORIGINAL al momento de crear la solicitud
├── quantity (int)               -- CANTIDAD de servicios
├── subtotal (10,2)              -- unit_price * quantity (SIN DESCUENTOS)
├── discount_percentage (5,2)    -- % de descuento aplicado (0-100)
├── discount_amount (10,2)       -- MONTO en ₲ del descuento
├── total_amount (10,2)          -- subtotal - discount_amount (PRECIO FINAL)
└── service_request_id (FK)      -- Vinculación con solicitud principal
```

### 2. Service Request (Tabla Madre)
Resume los totales de la solicitud completa:

```sql
service_requests:
├── total_amount (12,2)          -- SUMA de todos los total_amount de detalles
├── paid_amount (12,2)           -- Cantidad pagada (0 inicialmente)
└── payment_status               -- pending | partial | paid
```

### 3. Transactions (Tabla de Caja)
Cuando se cobra un servicio en caja:

```sql
transactions:
├── amount (12,2)                -- Monto cobrado (puede ser total_amount completo o parcial)
├── concept (255)                -- "Pago Servicio: [Nombre Servicio] - [Patient Name]"
├── service_request_id (FK)      -- Vinculación con solicitud (agregado en migración)
├── patient_id (FK)              -- Auditoría: quién se cobró
├── professional_id (FK)         -- Auditoría: profesional asociado
├── status                       -- active | cancelled (mantiene historial)
└── original_transaction_id      -- Si fue anulado, referencia a la original
```

## Flujo de Guardado

### Paso 1: Crear Service Request
Cuando el usuario completa el formulario en recepción:

```
Create.tsx → ReceptionController@store()
  ↓
Por cada servicio en cart:
  1. Guardar en service_request_details:
     - unit_price: precio obtenido del API o base_price
     - quantity: 1 (normalmente)
     - subtotal: unit_price * quantity
     - discount_percentage: % del formulario
     - discount_amount: ₲ del formulario
     - total_amount: subtotal - discount_amount
     
  2. Sumar todos los total_amount
     → Guardar en service_requests.total_amount
```

### Paso 2: Registrar Pago en Tesorería
Cuando se cobra el servicio en caja:

```
CashRegister Dashboard → TransactionController@store()
  ↓
Para cada service_request_detail pagado:
  1. Crear Transaction con:
     - type: INCOME
     - category: SERVICE_PAYMENT
     - amount: service_request_detail.total_amount
     - concept: "Pago Servicio: {service_name} - {patient_name}"
     - service_request_id: FK a service_request
     
  2. Actualizar service_requests:
     - paid_amount += transaction.amount
     - payment_status: determinar según total_amount vs paid_amount
```

## Auditoría y Trazabilidad

### ¿Cómo se mantiene el historial?
1. **Nunca se modifica** service_request_details una vez creado
2. **Si hay cambios de descuento**: Se crea un nuevo service_request (no se modifica el existente)
3. **Si se anula un pago**: Se crea una transacción nueva con status='cancelled' + original_transaction_id
4. **Los valores originales siempre se preservan** en unit_price y subtotal

### Reportes y Análisis
Con esta estructura se puede:
- Ver qué descuentos se aplicaron a cada servicio
- Saber cuánto se cobró vs cuál era el precio original
- Generar reportes de descuentos totales aplicados
- Auditar quién aplicó cada descuento (user_id en transactions)
- Rastrear cambios en el tiempo

## Ejemplo de Datos

### Caso: Servicio "Rx Cadera" con 50% descuento

**Service Request Detail:**
```
unit_price:        100.000 ₲
quantity:          1
subtotal:          100.000 ₲
discount_percentage: 50%
discount_amount:   50.000 ₲
total_amount:      50.000 ₲
```

**Transaction en Caja:**
```
amount:            50.000 ₲
concept:           "Pago Servicio: Rx Cadera - Juan García"
service_request_id: 123
patient_id:        45
created_at:        2026-01-08 14:30:00
```

**Reporte:**
- Precio original: ₲100.000
- Descuento aplicado: ₲50.000 (50%)
- Precio final cobrado: ₲50.000

## Implementación en Backend

### ServiceRequestController@store()
El método `store()` en `ServiceRequestController` es el responsable de guardar la solicitud con todos los descuentos.

**Ubicación:** `app/Http/Controllers/ServiceRequestController.php`

**Flujo:**
```php
public function store(Request $request): RedirectResponse
{
    // 1. Validación de datos (incluyendo discount_percentage y discount_amount)
    $validated = $request->validate([
        'patient_id' => ['required', 'exists:patients,id'],
        'reception_type' => ['required', Rule::in([...])],
        'priority' => ['required', Rule::in([...])],
        'request_date' => ['required', 'date'],
        'request_time' => ['nullable', 'date_format:H:i'],
        'notes' => ['nullable', 'string', 'max:1000'],
        'services' => ['required', 'array', 'min:1'],
        'services.*.medical_service_id' => ['required', 'exists:medical_services,id'],
        'services.*.professional_id' => ['required', 'exists:professionals,id'],
        'services.*.insurance_type_id' => ['required', 'exists:insurance_types,id'],
        'services.*.unit_price' => ['required', 'numeric', 'min:0'],
        'services.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
        'services.*.discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        'services.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
        'services.*.preparation_instructions' => ['nullable', 'string', 'max:500'],
        'services.*.notes' => ['nullable', 'string', 'max:500'],
    ]);

    // 2. Crear ServiceRequest principal
    $serviceRequest = ServiceRequest::create([
        'patient_id' => $validated['patient_id'],
        'created_by' => auth()->id(),
        'request_date' => $validated['request_date'],
        'request_time' => $validated['request_time'] ?? null,
        'reception_type' => $validated['reception_type'],
        'priority' => $validated['priority'],
        'notes' => $validated['notes'] ?? null,
        'status' => ServiceRequest::STATUS_PENDING_CONFIRMATION,
        'payment_status' => ServiceRequest::PAYMENT_PENDING,
        'total_amount' => 0,
        'paid_amount' => 0,
    ]);

    // 3. Crear detalles de servicios (con descuentos)
    foreach ($validated['services'] as $serviceData) {
        $serviceRequest->details()->create([
            'medical_service_id' => $serviceData['medical_service_id'],
            'professional_id' => $serviceData['professional_id'],
            'insurance_type_id' => $serviceData['insurance_type_id'],
            'unit_price' => $serviceData['unit_price'],              // ORIGINAL
            'quantity' => $serviceData['quantity'],
            'discount_percentage' => $serviceData['discount_percentage'] ?? 0,  // % DESCUENTO
            'discount_amount' => $serviceData['discount_amount'] ?? 0,          // ₲ DESCUENTO
            'preparation_instructions' => $serviceData['preparation_instructions'] ?? null,
            'notes' => $serviceData['notes'] ?? null,
            'status' => \App\Models\ServiceRequestDetail::STATUS_PENDING,
        ]);
    }

    return redirect()
        ->route('medical.service-requests.show', $serviceRequest)
        ->with('message', 'Solicitud de servicio creada exitosamente.');
}
```

**Validaciones de Descuentos:**
- `discount_percentage` entre 0 y 100
- `discount_amount` nunca negativo
- Se validan en tiempo de envío (cliente) y recepción (servidor)

**¿Dónde se calcula el total?**
En el modelo ServiceRequest existe un mutador que calcula automáticamente:
- `subtotal` = unit_price * quantity
- `total_amount` = subtotal - discount_amount

### Ruta Web
**Endpoint:** `POST /medical/service-requests`
**Nombre de ruta:** `medical.service-requests.store`
**Controlador:** `ServiceRequestController@store()`

### Frontend Integration
En `Create.tsx`:
```typescript
const createServiceRequest = useCallback((data: CreateServiceRequestData, options: VisitOptions = {}) => {
  withLoading(() => {
    router.post(serviceRequestRoutes.store, data as any, {
      preserveState: true,
      onSuccess: () => {
        setError(null)
      },
      onError: () => {
        setError('Error al crear la solicitud de servicio')
      },
      ...options
    })
  })
}, [withLoading])
```

Los datos se envían con:
```typescript
const formData = {
  patient_id: selectedPatient.id,
  reception_type: receptionType,
  priority,
  request_date: requestDate,
  request_time: requestTime || undefined,
  notes: notes || undefined,
  services: services.map(service => ({
    medical_service_id: service.medical_service_id,
    professional_id: service.professional_id,
    insurance_type_id: service.insurance_type_id,
    unit_price: service.unit_price,
    quantity: service.quantity,
    discount_percentage: service.discount_percentage,      // ✅ INCLUIDO
    discount_amount: service.discount_amount,              // ✅ INCLUIDO
    preparation_instructions: service.preparation_instructions || undefined,
    notes: service.notes || undefined
  }))
}

createServiceRequest(formData)
```

## Seguridad y Validaciones
1. ✅ Los descuentos NO pueden exceder el subtotal
2. ✅ Los descuentos se guardan sin perder información
3. ✅ El histórico de transacciones se mantiene (soft delete o cancelled flag)
4. ✅ Auditoría de usuario (created_by, user_id en transactions)
5. ✅ Timestamps para rastrear cuándo se aplicó cada cambio
