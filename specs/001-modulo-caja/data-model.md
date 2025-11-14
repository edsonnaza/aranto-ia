# Data Model: Módulo de Caja

**Creado**: 2025-10-25  
**Fase**: 1 - Diseño de Datos  

## Entidades Principales

### Caja
Representa una sesión diaria de trabajo de cajero.

**Campos:**
- `id` (Primary Key): Identificador único
- `usuario_id` (Foreign Key): Usuario responsable de la caja
- `fecha_apertura` (DateTime): Timestamp de apertura
- `fecha_cierre` (DateTime, nullable): Timestamp de cierre
- `monto_inicial` (Decimal 10,2): Saldo heredado del día anterior
- `monto_final_fisico` (Decimal 10,2, nullable): Dinero físico contado al cierre
- `saldo_calculado` (Decimal 10,2): Calculado automáticamente (inicial + ingresos - egresos)
- `total_ingresos` (Decimal 10,2): Suma de todos los ingresos del día
- `total_egresos` (Decimal 10,2): Suma de todos los egresos del día
- `diferencia` (Decimal 10,2, nullable): Diferencia entre físico y calculado
- `estado` (Enum): 'abierta', 'cerrada'
- `justificacion_diferencia` (Text, nullable): Explicación de diferencias
- `autorizado_por` (Foreign Key, nullable): Supervisor que autorizó diferencias
- `created_at`, `updated_at` (Timestamps)

**Relaciones:**
- Pertenece a Usuario (usuario_id)
- Autorizada por Usuario (autorizado_por)
- Tiene muchos Movimientos
- Tiene muchos Comprobantes

### LiquidacionComision
Consolidado de servicios por profesional para generar pago de comisiones.

**Campos:**
- `id` (Primary Key): Identificador único
- `professional_id` (Foreign Key): Profesional al que se liquida
- `period_start` (Date): Fecha inicio del período de liquidación
- `period_end` (Date): Date fin del período de liquidación
- `total_services` (Integer): Cantidad total de servicios incluidos
- `gross_amount` (Decimal 12,2): Monto bruto de servicios (antes de comisión)
- `commission_percentage` (Decimal 5,2): Porcentaje de comisión aplicado
- `commission_amount` (Decimal 12,2): Monto de comisión calculado
- `status` (Enum): 'draft', 'approved', 'paid', 'cancelled'
- `generated_by` (Foreign Key): Usuario que generó la liquidación
- `approved_by` (Foreign Key, nullable): Usuario que aprobó la liquidación
- `payment_movement_id` (Foreign Key, nullable): Movimiento de pago asociado
- `created_at`, `updated_at` (Timestamps)

**Relaciones:**
- Pertenece a Professional (professional_id)
- Generada por User (generated_by)
- Aprobada por User (approved_by)
- Pagada con Movement (payment_movement_id)
- Tiene muchos LiquidacionComisionDetail

### LiquidacionComisionDetail
Detalle de servicios incluidos en una liquidación de comisión.

**Campos:**
- `id` (Primary Key): Identificador único
- `liquidation_id` (Foreign Key): Liquidación a la que pertenece
- `service_request_id` (Foreign Key): Servicio solicitado en recepción
- `patient_id` (Foreign Key): Paciente que recibió el servicio
- `service_id` (Foreign Key): Tipo de servicio médico
- `service_date` (Date): Fecha en que se realizó el servicio
- `payment_date` (Date): Fecha en que se cobró el servicio
- `service_amount` (Decimal 10,2): Monto del servicio
- `commission_percentage` (Decimal 5,2): Porcentaje aplicado a este servicio específico
- `commission_amount` (Decimal 10,2): Comisión calculada para este servicio
- `payment_movement_id` (Foreign Key): Movimiento de cobro original
- `created_at`, `updated_at` (Timestamps)

**Relaciones:**
- Pertenece a LiquidacionComision (liquidation_id)
- Relacionado con ServiceRequest (service_request_id)
- Relacionado con Patient (patient_id)
- Relacionado con Service (service_id)
- Relacionado con Movement (payment_movement_id)

### Movimiento
Registro individual de cada transacción financiera.

**Campos:**
- `id` (Primary Key): Identificador único
- `cash_register_id` (Foreign Key): Caja donde ocurrió el movimiento
- `type` (Enum): 'INCOME', 'EXPENSE'
- `category` (Enum): Ver clasificación detallada de categorías más abajo
- `amount` (Decimal 12,2): Cantidad de dinero del movimiento
- `concept` (String 255): Descripción del movimiento
- `patient_id` (Foreign Key, nullable): Paciente relacionado (si aplica)
- `professional_id` (Foreign Key, nullable): Profesional relacionado (si aplica)
- `liquidation_id` (Foreign Key, nullable): Liquidación de comisión relacionada (para egresos de comisiones)
- `user_id` (Foreign Key): Usuario que registró el movimiento
- `status` (Enum): 'active', 'cancelled'
- `original_movement_id` (Foreign Key, nullable): Referencia al movimiento cancelado
- `cancellation_reason` (Text, nullable): Razón de la cancelación
- `cancelled_by` (Foreign Key, nullable): Usuario que canceló
- `cancelled_at` (DateTime, nullable): Timestamp de cancelación
- `created_at`, `updated_at` (Timestamps)

#### Clasificación de Categorías por Tipo

**INGRESOS (type: 'INCOME'):**
- `SERVICE_PAYMENT`: Cobro de Servicios (consultas, procedimientos médicos regulares)
- `INPATIENT_DISCHARGE_PAYMENT`: Cobro de Alta Internado (servicios de hospitalización)
- `EMERGENCY_DISCHARGE_PAYMENT`: Cobro de Alta Urgencia (servicios de emergencia)
- `SANATORIUM_DEPOSIT`: Depósito Sanatorial (anticipos, garantías de internación)
- `OTHER_INCOME`: Otros Ingresos (conceptos diversos no clasificados)

**EGRESOS (type: 'EXPENSE'):**
- `SUPPLIER_PAYMENT`: Pago a Proveedores (medicamentos, insumos, servicios)
- `COMMISSION_LIQUIDATION`: Pago de Comisiones a Profesionales
- `CASH_DIFFERENCE`: Diferencias de Caja (faltantes o sobrantes al cierre)
- `SANATORIUM_REFUND`: Devolución de Depósitos Sanatoriales
- `OTHER_EXPENSE`: Otros Egresos (gastos operativos diversos)

**Relaciones:**
- Pertenece a CashRegister (cash_register_id)
- Pertenece a User (user_id)
- Cancelado por User (cancelled_by)
- Relacionado con Patient (patient_id, nullable)
- Relacionado con Professional (professional_id, nullable)
- Relacionado con LiquidacionComision (liquidation_id, nullable)
- Tiene muchos MovementDetail
- Tiene uno Receipt
- Puede tener MovementCancellation (original_movement_id)

### MovementDetail
Detalle de servicios o conceptos dentro de un movimiento.

**Campos:**
- `id` (Primary Key): Identificador único
- `movement_id` (Foreign Key): Movimiento al que pertenece
- `service_id` (Foreign Key, nullable): Servicio médico cobrado
- `service_origin` (Enum): 'RECEPTION_SCHEDULED', 'RECEPTION_WALK_IN', 'EMERGENCY', 'INPATIENT_DISCHARGE'
- `service_request_id` (Foreign Key, nullable): ID del servicio solicitado en recepción (si aplica)
- `inpatient_period_start` (Date, nullable): Fecha inicio internación (solo para INPATIENT_DISCHARGE)
- `inpatient_period_end` (Date, nullable): Fecha fin internación (solo para INPATIENT_DISCHARGE)
- `service_request_id` (Foreign Key, nullable): Solicitud de servicio en recepción
- `concept` (String 255): Descripción del ítem
- `cantidad` (Integer): Cantidad de servicios/items
- `precio_unitario` (Decimal 10,2): Precio por unidad
- `subtotal` (Decimal 10,2): cantidad * precio_unitario
- `descuento` (Decimal 10,2, default 0): Descuento aplicado
- `total` (Decimal 10,2): subtotal - descuento
- `created_at`, `updated_at` (Timestamps)

**Relaciones:**
- Pertenece a Movimiento (movimiento_id)
- Relacionado con Servicio (servicio_id, nullable)

### FormaPago
Métodos de pago utilizados en los movimientos.

**Campos:**
- `id` (Primary Key): Identificador único
- `movimiento_id` (Foreign Key): Movimiento asociado
- `tipo` (Enum): 'EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'CHEQUE'
- `monto` (Decimal 10,2): Cantidad pagada con este método
- `referencia` (String 100, nullable): Número de autorización, cheque, etc.
- `entidad_financiera` (String 100, nullable): Banco o procesador
- `created_at`, `updated_at` (Timestamps)

**Relaciones:**
- Pertenece a Movimiento (movimiento_id)

### Comprobante
Documentos generados para cada transacción.

**Campos:**
- `id` (Primary Key): Identificador único
- `numero` (Integer): Número secuencial único
- `movimiento_id` (Foreign Key): Movimiento asociado
- `tipo` (Enum): 'COBRO', 'PAGO', 'ANULACION'
- `fecha_emision` (DateTime): Timestamp de generación
- `paciente_datos` (JSON, nullable): Snapshot de datos del paciente
- `detalle_servicios` (JSON): Snapshot de servicios cobrados
- `total` (Decimal 10,2): Monto total del comprobante
- `usuario_emision` (Foreign Key): Usuario que generó el comprobante
- `archivo_pdf` (String 255, nullable): Ruta al archivo PDF generado
- `hash_integridad` (String 64): Hash para validar integridad
- `created_at`, `updated_at` (Timestamps)

**Relaciones:**
- Pertenece a Movimiento (movimiento_id)
- Emitido por Usuario (usuario_emision)

### ResumenDiario
Consolidado automático de cada día.

**Campos:**
- `id` (Primary Key): Identificador único
- `fecha` (Date): Fecha del resumen
- `caja_id` (Foreign Key): Caja del día
- `monto_inicial` (Decimal 10,2): Saldo inicial del día
- `total_ingresos` (Decimal 10,2): Suma de ingresos
- `total_egresos` (Decimal 10,2): Suma de egresos
- `saldo_calculado` (Decimal 10,2): inicial + ingresos - egresos
- `saldo_fisico` (Decimal 10,2): Dinero físico contado
- `diferencia` (Decimal 10,2): Diferencia entre calculado y físico
- `cantidad_movimientos` (Integer): Total de transacciones
- `estado_cierre` (Enum): 'pendiente', 'cerrado_ok', 'cerrado_diferencia'
- `created_at`, `updated_at` (Timestamps)

**Relaciones:**
- Pertenece a Caja (caja_id)

## Reglas de Negocio

### Integridad de Saldo
1. `saldo_calculado = monto_inicial + total_ingresos - total_egresos`
2. `diferencia = saldo_fisico - saldo_calculado`
3. Los totales se recalculan automáticamente con cada movimiento

### Numeración de Comprobantes
1. Los números son secuenciales y únicos por tipo
2. No pueden existir gaps en la numeración
3. La secuencia se mantiene aunque se cancelen movimientos

### Cancelaciones
1. Solo se pueden cancelar movimientos del día actual sin autorización
2. Cancelaciones de días anteriores requieren autorización de supervisor
3. Las cancelaciones no eliminan registros, solo cambian el estado
4. Los saldos se recalculan automáticamente al cancelar

### Auditoria
1. Todos los cambios de estado quedan registrados
2. Los snapshots de datos en comprobantes son inmutables
3. Los hash de integridad previenen modificaciones no autorizadas

## Indices de Base de Datos

### Performance
- `cajas`: (usuario_id, fecha_apertura), (estado)
- `movimientos`: (caja_id, created_at), (tipo, created_at), (estado)
- `comprobantes`: (numero, tipo), (movimiento_id)
- `detalle_movimientos`: (movimiento_id)
- `formas_pago`: (movimiento_id)

### Integridad Referencial
- Todas las foreign keys tienen índices
- Constraints para evitar eliminaciones que rompan integridad
- Soft deletes donde sea necesario mantener histórico