# Flujo Integral: Recepción → Caja → Liquidación

**Fecha**: 2025-11-06  
**Estado**: Especificación de Integración  
**Propósito**: Definir el flujo completo desde solicitud de servicios hasta liquidación de comisiones

## 🔄 Flujo General del Sistema

### **1. RECEPCIÓN** 📋
**Responsable**: Recepcionista  
**Módulo**: Sistema de Recepción (futuro)

#### Acciones en Recepción:
1. **Paciente llega** (agendado o walk-in)
2. **Recepcionista crea ServiceRequest** con:
   - `patient_id`: Paciente que solicita
   - `service_id`: Tipo de servicio médico  
   - `professional_id`: Profesional asignado
   - `scheduled_date`: Fecha programada
   - `origin`: 'RECEPTION_SCHEDULED' | 'RECEPTION_WALK_IN' | 'EMERGENCY' | 'INPATIENT_DISCHARGE'
   - `status`: 'pending_payment' (inicial)
   - `total_amount`: Precio del servicio
   - `notes`: Observaciones

3. **Sistema genera queue para caja**:
   - ServiceRequest queda en estado 'pending_payment'
   - Aparece en la cola del cajero para procesamiento

### **2. CAJA** 💰
**Responsable**: Cajero  
**Módulo**: Módulo de Caja (actual)

#### Vista del Cajero:
1. **Lista de servicios pendientes de cobro**:
   - Servicios creados en recepción con status 'pending_payment'
   - Filtros por: fecha, paciente, profesional, tipo de servicio
   - Información visible:
     ```
     SERVICIOS PENDIENTES DE COBRO
     ┌─────────────────────────────────────────────────────┐
     │ Paciente: Juan Pérez                                │
     │ Servicio: Consulta Cardiología - Dr. García        │
     │ Monto: ₲ 150.000                                    │
     │ Origen: Recepción Agendada                          │
     │ Hora solicitud: 14:30                              │
     │ [COBRAR] [VER DETALLES]                            │
     └─────────────────────────────────────────────────────┘
     ```

2. **Cajero hace clic en "COBRAR"**:
   - Se abre modal con detalles del servicio
   - Permite seleccionar método de pago
   - Puede aplicar descuentos (con permisos)
   - Genera el movimiento de ingreso

#### Procesamiento del Cobro:
1. **Se crea Transaction (Movimiento)**:
   ```php
   Transaction::create([
       'cash_register_session_id' => $activeSession->id,
       'type' => 'INCOME',
       'category' => 'SERVICE_PAYMENT',
       'amount' => $serviceRequest->total_amount,
       'concept' => "Cobro: {$service->name} - {$patient->name}",
       'patient_id' => $serviceRequest->patient_id,
       'professional_id' => $serviceRequest->professional_id,
       'user_id' => Auth::id(),
   ]);
   ```

2. **Se crea MovementDetail**:
   ```php
   MovementDetail::create([
       'movement_id' => $transaction->id,
       'service_id' => $serviceRequest->service_id,
       'service_origin' => $serviceRequest->origin,
       'service_request_id' => $serviceRequest->id, // ¡CLAVE!
       'concept' => $service->name,
       'cantidad' => 1,
       'precio_unitario' => $service->price,
       'subtotal' => $service->price,
       'total' => $service->price,
   ]);
   ```

3. **Se actualiza ServiceRequest**:
   ```php
   $serviceRequest->update([
       'status' => 'paid',
       'payment_date' => now(),
       'payment_movement_id' => $transaction->id
   ]);
   ```

### **3. LIQUIDACIÓN** 📊
**Responsable**: Administrador/Contador  
**Módulo**: Sistema de Liquidaciones (futuro)

#### Generación Periódica:
1. **Sistema busca servicios pagados** en período:
   ```sql
   SELECT md.* FROM movement_details md
   JOIN movements m ON md.movement_id = m.id
   JOIN service_requests sr ON md.service_request_id = sr.id
   WHERE sr.professional_id = ? 
   AND sr.payment_date BETWEEN ? AND ?
   AND sr.status = 'paid'
   ```

2. **Se crea LiquidacionComision**:
   ```php
   LiquidacionComision::create([
       'professional_id' => $professionalId,
       'period_start' => $startDate,
       'period_end' => $endDate,
       'total_services' => $serviceCount,
       'gross_amount' => $totalAmount,
       'commission_percentage' => $professional->commission_rate,
       'commission_amount' => $totalAmount * $professional->commission_rate / 100,
       'status' => 'draft'
   ]);
   ```

3. **Se crean LiquidacionComisionDetail**:
   ```php
   foreach($serviceRequests as $request) {
       LiquidacionComisionDetail::create([
           'liquidation_id' => $liquidation->id,
           'service_request_id' => $request->id, // ¡TRAZABILIDAD!
           'patient_id' => $request->patient_id,
           'service_id' => $request->service_id,
           'service_date' => $request->service_date,
           'payment_date' => $request->payment_date,
           'service_amount' => $request->total_amount,
           'commission_percentage' => $professional->commission_rate,
           'commission_amount' => $request->total_amount * $professional->commission_rate / 100,
           'payment_movement_id' => $request->payment_movement_id
       ]);
   }
   ```

## 🔗 Puntos de Integración Clave

### **service_request_id en MovementDetail**
- **Propósito**: Vincular cada cobro con la solicitud original de recepción
- **Uso**: Permite trazabilidad completa del servicio desde recepción hasta liquidación
- **Ejemplo**: `service_request_id = 123` vincula el cobro con la solicitud #123 de recepción

### **Estado de ServiceRequest**
```php
enum ServiceRequestStatus: string {
    case PENDING_PAYMENT = 'pending_payment';    // Creado en recepción, esperando cobro
    case PAID = 'paid';                          // Cobrado en caja
    case COMPLETED = 'completed';                // Servicio prestado
    case CANCELLED = 'cancelled';                // Cancelado
    case REFUNDED = 'refunded';                  // Reembolsado
}
```

### **Origen del Servicio en MovementDetail**
```php
enum ServiceOrigin: string {
    case RECEPTION_SCHEDULED = 'RECEPTION_SCHEDULED';     // Agendado
    case RECEPTION_WALK_IN = 'RECEPTION_WALK_IN';         // Orden de llegada
    case EMERGENCY = 'EMERGENCY';                          // Emergencia
    case INPATIENT_DISCHARGE = 'INPATIENT_DISCHARGE';      // Alta internación
}
```

## 🎯 Implementación por Fases

### **Fase 1: Módulo de Caja (Actual)**
- ✅ Estructura base de transacciones
- ✅ Modales de ingreso/egreso
- 🔄 **PRÓXIMO**: Lista de servicios pendientes de cobro
- 🔄 **PRÓXIMO**: Modal de cobro de servicios específicos

### **Fase 2: Integración con Recepción**
- 📋 Módulo de recepción completo
- 📋 ServiceRequest model y CRUD
- 📋 Cola de servicios pendientes en caja
- 📋 Vinculación service_request_id

### **Fase 3: Sistema de Liquidaciones**
- 📊 Generación automática de liquidaciones
- 📊 Reportes de comisiones por profesional
- 📊 Pagos de liquidaciones vía caja
- 📊 Trazabilidad completa del flujo

## 💡 Consideraciones para Desarrollo Actual

### **Para el Modal de TransactionModal actual**:
1. **Agregar campo service_request_id** (opcional por ahora)
2. **Mantener description como texto libre** para casos no vinculados
3. **Preparar estructura** para futura integración
4. **Mockear datos** de servicios pendientes para testing

### **Estructura recomendada para testing**:
```typescript
// Mock data para servicios pendientes
const mockPendingServices = [
  {
    id: 1,
    patient_name: "Juan Pérez",
    service_name: "Consulta Cardiología",
    professional_name: "Dr. García",
    amount: 150000,
    origin: "RECEPTION_SCHEDULED",
    created_at: "2025-11-06 14:30:00"
  }
];
```

## ✅ Actualización Necesaria en Documentación

Esta especificación debe agregarse a:
- [ ] `tasks.md` - Tareas de integración con recepción
- [ ] `data-model.md` - ServiceRequest entity
- [ ] `frontend-architecture.md` - Componentes de lista de servicios
- [ ] `implementacion-recomendada.md` - Fases de desarrollo