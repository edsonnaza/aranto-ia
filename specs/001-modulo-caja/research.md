# Research: Módulo de Caja

**Creado**: 2025-10-25  
**Fase**: 0 - Investigación y Decisiones Técnicas  

## Decisiones Técnicas

### Stack Tecnológico

**Decisión**: Laravel 10.x + Inertia.js + React 18 + MySQL 8.0 + Docker + shadcn/ui + Laravel Breeze  
**Rationale**: Stack establecido en constitución del proyecto. Laravel Breeze para autenticación, shadcn/ui para componentes consistentes, React con TypeScript para robustez del frontend. Docker garantiza entorno reproducible en desarrollo y producción.  
**Alternativas consideradas**: Vue.js (descartado por experiencia del equipo), API REST separada (descartado por complejidad), Ant Design (descartado en favor de shadcn/ui)

### Convenciones de Nomenclatura

**Decisión**: Toda la base de datos y APIs en inglés, componentes React en inglés  
**Rationale**: Estándar internacional, mejor para mantenimiento futuro, facilita integración con herramientas externas, evita problemas de encoding.  
**Alternativas consideradas**: Español (descartado por limitaciones técnicas), Mixto (descartado por inconsistencia)

### Arquitectura de Base de Datos

**Decisión**: Modelo relacional con transacciones ACID completas  
**Rationale**: Los datos financieros requieren integridad absoluta. MySQL con InnoDB garantiza transacciones ACID, essential para cálculos de saldo precisos.  
**Alternativas consideradas**: NoSQL (descartado por falta de transacciones ACID), SQLite (descartado por concurrencia limitada)

### Patrón de Cálculo de Saldo

**Decisión**: Cálculo en tiempo real con cache + auditoría  
**Rationale**: Fórmula "Inicial + Ingresos - Egresos" calculada en cada operación garantiza precisión. Cache en Redis para performance, logs de auditoría para trazabilidad.  
**Alternativas consideradas**: Saldo almacenado (descartado por riesgo de inconsistencia), Cálculo bajo demanda (descartado por performance)

### Manejo de Concurrencia

**Decisión**: Locks optimistas con validación en base de datos  
**Rationale**: Múltiples cajeros pueden trabajar simultáneamente, pero cada caja individual debe ser manejada por un solo usuario.  
**Alternativas consideradas**: Locks pesimistas (descartado por impacto en performance), Sin locks (descartado por riesgo de inconsistencia)

### Generación de Comprobantes

**Decisión**: PDF generado server-side con numeración secuencial garantizada  
**Rationale**: Requerimientos fiscales exigen comprobantes numerados secuencialmente sin gaps. Laravel PDF + base de datos garantiza secuencia.  
**Alternativas consideradas**: Cliente-side PDF (descartado por seguridad), Numeración no secuencial (descartado por compliance fiscal)

### Autenticación y Autorización

**Decisión**: Laravel Sanctum + Middleware personalizado  
**Rationale**: Sanctum integra naturalmente con Inertia.js, middleware personalizado para validar permisos de caja por usuario.  
**Alternativas consideradas**: Laravel Passport (sobra funcionalidad), JWT personalizado (innecesario con Sanctum)

### Testing Strategy

**Decisión**: PHPUnit + Feature/Unit tests + Browser tests con Dusk  
**Rationale**: Testing crítico para funciones financieras. Feature tests para flujos completos, Unit tests para cálculos, Browser tests para UI crítica.  
**Alternativas consideradas**: Solo Unit tests (insuficiente para flujos complejos), Solo Feature tests (falta granularidad)

## Integraciones Identificadas

### Con Módulo de Pacientes
- Obtener servicios pendientes de pago
- Actualizar estado de pago tras cobro
- Consultar tipo de seguro médico para precios

### Con Módulo de Profesionales  
- Calcular comisiones automáticamente
- Generar liquidaciones programadas
- Actualizar comisiones tras cancelaciones

### Con Módulo de Servicios
- Obtener precios por tipo de seguro
- Validar servicios activos
- Aplicar descuentos y promociones

## Consideraciones de Seguridad

### Datos Sensibles
- Encriptación de campos financieros en base de datos
- Logs de auditoría inmutables
- Backup automático con retención definida

### Validaciones
- Double-check de cálculos en frontend y backend
- Validación de permisos en cada operación
- Timeout de sesión para usuarios inactivos

## Performance Requirements

### Métricas Objetivo
- Apertura/cierre de caja: <3 segundos
- Cobro individual: <30 segundos  
- Generación de reportes: <2 minutos (30 días)
- Concurrencia: 10 usuarios simultáneos

### Optimizaciones Planeadas
- Indices en tablas de movimientos por fecha/usuario
- Cache de saldos calculados en Redis
- Paginación en listados de movimientos
- Compresión de reportes PDF grandes