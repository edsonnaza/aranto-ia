# Feature Specification: Módulo de Caja

**Feature Branch**: `001-modulo-caja`  
**Created**: 2025-10-23  
**Status**: Draft  
**Input**: User description: "Implementar módulo de caja con apertura, cierre, cobros y auditoría para clínica médica"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apertura y Cierre de Caja (Priority: P1)

Como cajero, necesito abrir la caja con el monto inicial (del cierre anterior) y cerrarla calculando automáticamente el saldo final basado en: Saldo Inicial + Total Ingresos - Total Egresos = Saldo Final Esperado, para mantener control preciso del flujo de efectivo diario.

**Why this priority**: Es la funcionalidad base del módulo - sin apertura/cierre de caja no se pueden realizar otros procesos financieros. Es el control fundamental que garantiza la trazabilidad diaria y la continuidad del saldo entre días.

**Independent Test**: Se puede probar independientemente creando un usuario cajero, abriendo con monto inicial específico, registrando ingresos y egresos conocidos, y verificando que el cálculo automático del saldo final sea correcto.

**Acceptance Scenarios**:

1. **Given** un cajero autenticado al inicio del día, **When** selecciona "Abrir Caja" e ingresa el monto inicial (saldo del cierre anterior), **Then** la caja queda abierta con saldo inicial registrado, se habilitan las funciones de cobro y se inicia el contador diario
2. **Given** una caja abierta con movimientos del día, **When** el cajero selecciona "Cerrar Caja", **Then** el sistema calcula automáticamente: Saldo Final = Monto Inicial + Σ(Ingresos) - Σ(Egresos), muestra el saldo esperado vs. real y solicita confirmación
3. **Given** un cierre de caja, **When** hay diferencia entre saldo calculado y físico, **Then** el sistema muestra desglose detallado (inicial, ingresos totales, egresos totales, diferencia) y requiere justificación si supera umbral
4. **Given** el cierre exitoso de caja, **When** se confirma el cierre, **Then** el sistema registra el saldo final como monto inicial para el próximo día y bloquea nuevos movimientos en la caja actual

---

### User Story 2 - Cobro de Servicios Médicos (Priority: P1)

Como cajero, necesito cobrar servicios médicos de diferentes tipos (consultas agendadas, atención por orden de llegada en recepción, urgencias/emergencias, altas de internados, procedimientos) con opciones de pago total o parcial para generar ingresos y actualizar el estado de pago de los pacientes.

**Why this priority**: Es la función principal generadora de ingresos de la clínica. Sin esta funcionalidad no hay flujo de caja operativo. Debe cubrir todos los puntos de atención médica.

**Independent Test**: Se puede probar con servicios de prueba de diferentes tipos (agendados, urgencias, internados), pacientes ficticios y diferentes formas de pago, verificando que se generen comprobantes y se actualicen los saldos según el origen del servicio.

**Acceptance Scenarios**:

1. **Given** un paciente con servicios pendientes de pago (agendados en recepción), **When** el cajero busca al paciente y selecciona los servicios a cobrar, **Then** el sistema calcula el total, identifica el origen como "Recepción-Agendado" y permite procesar el pago
2. **Given** un paciente atendido por orden de llegada en recepción, **When** se cobra el servicio, **Then** el sistema registra el origen como "Recepción-Orden de Llegada" y procesa el cobro inmediato
3. **Given** un paciente atendido en urgencias/emergencias, **When** se cobra el servicio, **Then** el sistema identifica el origen como "Urgencias" y aplica las tarifas correspondientes
4. **Given** un paciente dado de alta de internación, **When** se cobra el servicio de internado, **Then** el sistema registra el origen como "Alta de Internado" con el período de internación
5. **Given** un cobro de servicios múltiples de diferentes orígenes, **When** se procesan pagos parciales, **Then** el sistema actualiza los saldos pendientes por cada tipo de servicio y mantiene la trazabilidad de lo cobrado
6. **Given** diferentes tipos de seguro médico, **When** se cobra un servicio de cualquier origen, **Then** el sistema aplica el precio correcto según el tipo de seguro del paciente y el origen del servicio

---

### User Story 3 - Liquidación de Comisiones de Profesionales (Priority: P2)

Como administrador, necesito generar y procesar liquidaciones de comisiones basadas en servicios solicitados en recepción y cobrados en caja, filtrando por profesional y período de fechas para mantener pagos justos y transparentes.

**Why this priority**: Es importante para la gestión de recursos humanos pero no bloquea la operación diaria. Las comisiones motivan a los profesionales pero pueden procesarse en lotes.

**Independent Test**: Se puede probar creando servicios solicitados, cobrándolos en caja, generando liquidación por profesional y período, y verificando que los cálculos y referencias sean correctos.

**Acceptance Scenarios**:

1. **Given** servicios cobrados por un profesional en un período, **When** se genera liquidación de comisiones, **Then** el sistema consolida todos los servicios con sus fechas de solicitud, cobro y montos, calculando comisión según porcentaje del profesional
2. **Given** una liquidación aprobada, **When** se procesa el pago desde caja, **Then** el sistema registra egreso vinculado a la liquidación con detalle completo de servicios incluidos
3. **Given** servicios solicitados en recepción con diferentes fechas, **When** se filtran por profesional y período, **Then** el sistema incluye solo servicios dentro del rango de fechas especificado

---

### User Story 4 - Pagos Varios y Egresos (Priority: P2)

Como cajero, necesito registrar pagos diversos (proveedores, servicios, gastos operativos) para mantener el control completo de egresos de la clínica.

**Why this priority**: Complementa el control de caja pero no es crítico para el funcionamiento básico. Los egresos varios son importantes para la contabilidad pero no bloquean la operación médica.

**Independent Test**: Se puede probar creando diferentes tipos de egresos, verificando que se descuenten del saldo de caja y se generen los reportes correspondientes.

**Acceptance Scenarios**:

1. **Given** una caja abierta, **When** el cajero registra un pago a proveedor con concepto y monto, **Then** el sistema registra el egreso, reduce el saldo y genera comprobante
2. **Given** gastos operativos diversos, **When** se registran con categorización adecuada, **Then** el sistema mantiene clasificación para reportes administrativos

---

### User Story 5 - Cancelación y Reversión de Cobros (Priority: P1)

Como cajero o supervisor, necesito poder cancelar o revertir cobros realizados por error para corregir transacciones incorrectas y mantener la precisión de los registros financieros.

**Why this priority**: Es una funcionalidad crítica para manejar errores humanos en la operación diaria. Sin esta capacidad, los errores de cobro generan problemas contables y de servicio al cliente que deben resolverse manualmente.

**Independent Test**: Se puede probar realizando cobros de prueba y luego cancelándolos, verificando que se generen los documentos de reversión correctos y se actualicen todos los saldos involucrados.

**Acceptance Scenarios**:

1. **Given** un cobro realizado en el día actual, **When** el cajero solicita cancelación con justificación, **Then** el sistema genera una reversión, restaura el saldo del paciente, actualiza el saldo de caja y emite comprobante de anulación
2. **Given** un cobro con pago mixto (efectivo + tarjeta), **When** se procesa la cancelación, **Then** el sistema revierte cada forma de pago por separado y mantiene el desglose en los reportes
3. **Given** un intento de cancelar un cobro de días anteriores, **When** la caja del día original está cerrada, **Then** el sistema requiere autorización de supervisor y genera movimiento de ajuste en la caja actual
4. **Given** una cancelación que afecta comisiones de profesionales, **When** se procesa la reversión, **Then** el sistema ajusta automáticamente las liquidaciones pendientes o genera nota de crédito si ya fueron pagadas

---

### User Story 5 - Auditoría y Reportes Financieros (Priority: P2)

Como administrador, necesito generar reportes detallados de movimientos de caja para control administrativo y cumplimiento fiscal.

**Why this priority**: Es importante para la gestión pero no bloquea la operación diaria. Los reportes son necesarios para control gerencial y auditorías.

**Independent Test**: Se puede probar generando reportes con datos de prueba, verificando que incluyan todos los movimientos y cálculos correctos.

**Acceptance Scenarios**:

1. **Given** movimientos registrados en un período, **When** se solicita reporte de caja por fecha, **Then** el sistema genera reporte con ingresos, egresos, saldos y detalles por usuario
2. **Given** múltiples cajas operadas en el día, **When** se solicita consolidado diario, **Then** el sistema muestra resumen general y permite drill-down a detalle por caja
3. **Given** requerimiento de auditoría, **When** se solicita trazabilidad de un movimiento específico, **Then** el sistema muestra historial completo con usuario, fecha, hora y documentos relacionados

---

### Edge Cases

- **¿Qué pasa cuando se intenta abrir una caja que ya está abierta?** El sistema debe mostrar error y indicar quién tiene la caja abierta
- **¿Cómo maneja el sistema cortes de energía durante un cobro?** Debe existir recuperación automática de transacciones incompletas
- **¿Qué ocurre cuando se detectan diferencias significativas en el cierre?** Sistema debe requerir autorización de supervisor y justificación detallada
- **¿Cómo se calcula el saldo cuando hay cancelaciones en el día?** Las cancelaciones se restan de ingresos (si eran ingresos) o se suman a egresos (si eran egresos), manteniendo la fórmula: Inicial + Ingresos - Egresos = Final
- **¿Qué sucede si el primer día no hay caja anterior?** Sistema debe permitir configurar monto inicial manualmente con autorización de administrador
- **¿Cómo se maneja un error en el monto inicial ingresado?** Sistema debe permitir corrección antes del primer movimiento, después requiere autorización y registro de ajuste
- **¿Qué ocurre si hay movimientos pendientes al intentar cerrar?** Sistema debe validar que no hay transacciones en proceso antes de permitir el cierre
- **¿Cómo se registra cuando el saldo físico no coincide con el calculado?** Sistema debe registrar la diferencia como "Faltante" o "Sobrante" con justificación obligatoria
- **¿Cómo se manejan los pagos con múltiples formas (efectivo + tarjeta)?** Sistema debe permitir cobros mixtos y mantener desglose detallado
- **¿Qué sucede si se necesita anular una transacción después del cierre?** Debe existir proceso de reversa con autorización administrativa
- **¿Cómo se maneja la cancelación de un cobro parcial cuando el paciente tiene múltiples servicios?** Sistema debe permitir reversión selectiva manteniendo el saldo correcto de servicios pendientes
- **¿Qué ocurre si se intenta cancelar un cobro cuando la caja actual no tiene suficiente efectivo?** Sistema debe alertar sobre insuficiencia y requerir autorización para generar saldo negativo temporal
- **¿Cómo se registra una cancelación cuando el comprobante original ya fue entregado al paciente?** Sistema debe generar comprobante de anulación y mantener referencia cruzada con el documento original
- **¿Qué sucede si se cancela un cobro que generó comisiones ya liquidadas?** Sistema debe crear nota de crédito automática y notificar para ajuste en próxima liquidación

## Requirements *(mandatory)*
### Functional Requirements

### Gestión de Apertura y Cierre de Caja

- **FR-001**: Sistema DEBE permitir apertura de caja única por usuario con monto inicial obligatorio (heredado del cierre anterior)
- **FR-002**: Sistema DEBE impedir múltiples cajas abiertas por el mismo usuario simultáneamente
- **FR-003**: Sistema DEBE calcular automáticamente saldo esperado usando fórmula: Monto Inicial + Σ(Ingresos) - Σ(Egresos) = Saldo Final
- **FR-004**: Sistema DEBE requerir conteo físico de efectivo al cierre y registrar diferencias (faltante/sobrante)
- **FR-005**: Una vez cerrada, la caja NO PUEDE ser modificada
- **FR-006**: Sistema DEBE transferir automáticamente el saldo final de cierre como monto inicial del día siguiente

### Gestión de Cobros de Servicios

- **FR-007**: Sistema DEBE permitir registrar cobros de servicios médicos con método de pago (efectivo, tarjeta, transferencia)
- **FR-008**: Cada cobro DEBE generar un comprobante/recibo con número consecutivo
- **FR-009**: Sistema DEBE actualizar automáticamente el saldo de caja al registrar cada cobro
- **FR-010**: Los cobros DEBEN vincularse con servicios específicos o quedas de cuenta generales
- **FR-011**: Sistema DEBE permitir cobros parciales y registrar saldos pendientes
- **FR-011.1**: Sistema DEBE identificar y registrar el origen del servicio (Recepción-Agendado, Recepción-Orden de Llegada, Urgencias, Alta de Internado)
- **FR-011.2**: Sistema DEBE permitir cobros de servicios agendados previamente en recepción
- **FR-011.3**: Sistema DEBE permitir cobros inmediatos de servicios por orden de llegada en recepción
- **FR-011.4**: Sistema DEBE permitir cobros de servicios de urgencias/emergencias con tarifas diferenciadas
- **FR-011.5**: Sistema DEBE permitir cobros de altas de internados incluyendo período de internación
- **FR-011.6**: Sistema DEBE aplicar tarifas diferenciadas según tipo de seguro médico y origen del servicio

### Gestión de Liquidación de Comisiones

- **FR-012**: Sistema DEBE permitir generar liquidaciones de comisiones por profesional y período de fechas
- **FR-013**: Las liquidaciones DEBEN incluir todos los servicios solicitados en recepción y cobrados en el período seleccionado
- **FR-014**: Cada detalle de liquidación DEBE referenciar el ID del servicio solicitado en recepción con su fecha de solicitud
- **FR-015**: Sistema DEBE calcular automáticamente las comisiones según el porcentaje configurado para cada profesional
- **FR-016**: Una liquidación aprobada DEBE generar un movimiento de egreso en caja al procesarse el pago
- **FR-017**: El detalle de movimiento DEBE incluir todos los servicios comprendidos en el período de la liquidación

### Gestión de Egresos y Pagos Varios

- **FR-018**: Sistema DEBE permitir registrar egresos diversos (pagos a proveedores, gastos operativos)
- **FR-019**: Cada egreso DEBE incluir concepto, monto, método de pago y beneficiario
- **FR-020**: Los egresos DEBEN restar automáticamente del saldo de caja
- **FR-021**: Sistema DEBE generar comprobantes de egreso con numeración consecutiva

### Gestión de Cancelaciones y Reversiones

- **FR-022**: Sistema DEBE permitir cancelación de cobros realizados en el día actual con justificación obligatoria
- **FR-023**: Sistema DEBE generar comprobante de anulación automáticamente al cancelar un cobro
- **FR-024**: Sistema DEBE restaurar saldos pendientes del paciente al cancelar cobros de servicios
- **FR-025**: Sistema DEBE revertir todas las formas de pago utilizadas en el cobro original
- **FR-026**: Sistema DEBE requerir autorización de supervisor para cancelar cobros de días anteriores
- **FR-027**: Sistema DEBE ajustar automáticamente comisiones de profesionales al cancelar cobros
- **FR-028**: Sistema DEBE mantener referencia cruzada entre cobro original y su cancelación
- **FR-029**: Sistema DEBE prevenir cancelaciones múltiples del mismo cobro
- **FR-030**: Sistema DEBE validar disponibilidad de efectivo en caja antes de procesar cancelaciones

### Funcionalidades Generales del Sistema

- **FR-031**: Sistema DEBE registrar todos los movimientos clasificándolos como INGRESO o EGRESO con timestamp, usuario, monto y concepto
- **FR-032**: Sistema DEBE generar comprobantes numerados secuencialmente para todos los movimientos
- **FR-033**: Sistema DEBE mantener histórico completo de movimientos para auditoría
- **FR-034**: Sistema DEBE generar reportes exportables en PDF y Excel
- **FR-035**: Sistema DEBE integrar con módulo de pacientes para obtener servicios pendientes
- **FR-036**: Sistema DEBE integrar con módulo de profesionales para liquidación de comisiones
- **FR-037**: Sistema DEBE permitir búsqueda de movimientos por paciente, profesional, fecha y concepto
- **FR-038**: Sistema DEBE validar permisos de usuario antes de cualquier operación financiera
- **FR-039**: Sistema DEBE mostrar desglose detallado en cierre: monto inicial, total ingresos, total egresos, saldo calculado vs. físico
- **FR-040**: Sistema DEBE mostrar en tiempo real durante el día el saldo teórico calculado vs. movimientos registrados

### Key Entities *(include if feature involves data)*

- **Caja**: Representa una sesión de trabajo de cajero - incluye fecha apertura/cierre, monto inicial, monto final físico, saldo calculado, total ingresos, total egresos, diferencia, usuario responsable, estado (abierta/cerrada)
- **Movimiento**: Registro individual de ingreso o egreso - incluye tipo (INGRESO/EGRESO), monto, concepto, timestamp, usuario, documento relacionado, método de pago, estado (activo/cancelado)
- **Comprobante**: Documento generado por cada transacción - número secuencial, datos del paciente/proveedor, detalle de servicios/conceptos, firma digital, tipo (original/anulación)
- **Forma de Pago**: Efectivo, tarjeta crédito/débito, transferencia, cheque - incluye validaciones específicas y datos adicionales requeridos
- **Liquidación de Comisión**: Cálculo automático de pagos a profesionales - vincula servicios cobrados con porcentajes establecidos y genera pagos programados
- **Cancelación**: Registro de reversión de movimientos - incluye movimiento original, motivo, usuario autorizante, timestamp, impacto en cálculo de saldo (se resta/suma según tipo)
- **Autorización**: Registro de aprobaciones de supervisor - incluye tipo de operación, usuario solicitante, usuario autorizante, justificación, fecha/hora
- **Resumen Diario**: Consolidado automático del día - monto inicial, suma de ingresos, suma de egresos, saldo calculado, diferencias registradas, estado de cierre

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cajeros pueden completar apertura/cierre de caja en menos de 3 minutos cada operación
- **SC-002**: Sistema procesa cobros de servicios individuales en menos de 30 segundos
- **SC-003**: 100% de movimientos financieros quedan registrados con trazabilidad completa (usuario, fecha, hora, concepto)
- **SC-004**: Diferencias en cierre de caja no superan el 0.1% del movimiento diario en 95% de los casos
- **SC-005**: Reportes de auditoría se generan en menos de 2 minutos para períodos de hasta 30 días
- **SC-006**: 90% de usuarios logran realizar cobros exitosos sin capacitación adicional
- **SC-007**: Sistema mantiene disponibilidad 99.5% durante horario de atención clínica
- **SC-008**: Liquidación de comisiones se calcula automáticamente con 100% precisión según reglas establecidas
- **SC-009**: Cancelaciones de cobros se procesan en menos de 60 segundos manteniendo integridad de datos
- **SC-010**: 100% de cancelaciones quedan registradas con trazabilidad completa y documentos de respaldo
- **SC-011**: Sistema restaura correctamente saldos de pacientes en 100% de las cancelaciones
- **SC-012**: Menos del 2% de cancelaciones requieren intervención manual por errores del sistema
- **SC-013**: El cálculo automático de saldo (Inicial + Ingresos - Egresos) tiene 100% de precisión matemática
- **SC-014**: La transferencia de saldo final a monto inicial del día siguiente ocurre automáticamente sin errores
- **SC-015**: Sistema muestra desglose de cálculo de saldo en tiempo real con actualización instantánea tras cada movimiento
- **SC-016**: 95% de cierres de caja se completan sin diferencias que requieran justificación adicional
