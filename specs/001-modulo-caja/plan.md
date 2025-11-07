# Implementation Plan: Módulo de Caja

**Branch**: `001-modulo-caja` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-modulo-caja/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementar módulo completo de caja para clínica médica con funcionalidades de apertura/cierre, cobros de servicios, pagos varios, cancelaciones y auditoría. El sistema debe manejar la fórmula: Saldo Final = Monto Inicial + Σ(Ingresos) - Σ(Egresos) con trazabilidad completa y integración con otros módulos del sistema Aranto.

## ⚠️ **RECOMENDACIÓN OFICIAL: Laravel Starter Kit**

**Actualización 2025-11-04**: Después de la experiencia con configuración manual de TypeScript, se recomienda **oficialmente** usar el **Laravel React Starter Kit** para una implementación más robusta y eficiente.

### Plan Recomendado:
1. **Crear nuevo proyecto con Laravel React Starter Kit**
2. **Migrar solo el backend** que ya tenemos funcionando (modelos, servicios, controladores)
3. **Usar los componentes shadcn/ui** para crear el módulo de caja registradora

**Ventajas**: React 19 + TypeScript nativo, Inertia 2, shadcn/ui integrado, sin conflictos de dependencias, setup en 30 minutos vs. días de configuración manual.

**Documentación completa**: Ver [implementacion-recomendada.md](./implementacion-recomendada.md)

## Technical Context

### Core Stack
**Language/Version**: PHP 8.2+ con Laravel 10.x  
**Frontend Recomendado**: Laravel React Starter Kit (React 19 + TypeScript nativo)  
**Primary Dependencies**: Laravel, Inertia 2, React 19, shadcn/ui, Tailwind CSS V4, MySQL 8.0  
**Storage**: MySQL 8.0 con migraciones Laravel para estructura de base de datos  
**Testing**: PHPUnit para backend, Jest/React Testing Library para frontend  
**Target Platform**: Aplicación web con Docker containerization  
**Project Type**: Web application (Laravel backend + React Starter Kit frontend via Inertia)  

### Frontend Specifics
**UI Framework**: shadcn/ui component library (incluido en Starter Kit)  
**Authentication**: Laravel Breeze integrado en React Starter Kit  
**State Management**: Inertia.js shared data y React hooks  
**Build Tool**: Vite (preconfigurado en Starter Kit)  
**TypeScript**: Nativo y preconfigurado sin conflictos de dependencias

### Infrastructure & DevOps
**Containerization**: Docker con docker-compose  
**Database Admin**: phpMyAdmin en puerto 8080 con credenciales estandarizadas  
**Database Credentials**: 
- Password: `4r4nt0` (MySQL root y phpMyAdmin)
- Database: `aranto_medical`
- User: `root` / `aranto_user`
**Cache**: Redis para sesiones y cache de aplicación  
**Environment**: Docker containers para desarrollo y producción  

### Database Design
**Engine**: MySQL 8.0 InnoDB para transacciones ACID  
**Naming Convention**: English field names (cash_registers, movements, etc.)  
**Decimal Precision**: DECIMAL(10,2) para montos financieros  
**Audit Trail**: Timestamps obligatorios en todas las tablas  

### Application Architecture (Single Responsibility Principle)
**Layered Architecture con responsabilidad única por capa:**

```
Frontend (React + Inertia.js)
├── Pages/          # Vistas principales (Cash Register, Payments, etc.)
├── Components/     # Componentes reutilizables UI (shadcn/ui)
├── Hooks/          # Custom hooks para lógica de estado
├── Utils/          # Funciones utilitarias y helpers
└── Types/          # TypeScript interfaces y tipos

Backend (Laravel)
├── Controllers/    # HTTP request handling y response formatting
├── Services/       # Business logic y reglas de negocio
├── Models/         # Data models con relaciones Eloquent
├── Repositories/   # Data access layer (opcional para casos complejos)
├── Middleware/     # Request/response processing
├── Requests/       # Form validation y data sanitization
└── Resources/      # API response transformation

Database Layer
├── Migrations/     # Schema definition y modificaciones
├── Seeders/        # Initial data population
├── Factories/      # Test data generation
└── Database/       # Connection y query optimization
```

**Separation of Concerns:**
- **Frontend**: Solo presentación y experiencia de usuario
- **Controllers**: Solo routing y HTTP handling (thin controllers)
- **Services**: Business logic y coordinación entre modelos
- **Models**: Data representation y relaciones (no business logic)
- **Database**: Data persistence y integridad  

**Performance Goals**: <500ms response time, soporte para 50 usuarios concurrentes  
**Constraints**: Operación 24/7, respaldo automático, compliance con normativas médicas  
**Scale/Scope**: Clínica pequeña-mediana (5-10 usuarios simultáneos, 200-500 transacciones/día)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **I. Seguridad de Datos y Cumplimiento**: El módulo maneja datos financieros sensibles con trazabilidad completa de usuarios, timestamps y acciones. Todos los movimientos quedan registrados para auditoría. Schema de BD incluye triggers para mantener integridad.

✅ **II. Desarrollo Especificado**: Especificación completa con 5 historias de usuario priorizadas, 30 requerimientos funcionales y criterios de éxito medibles. Documentación técnica completa generada.

✅ **III. Fases Controladas**: ✅ Especificación → ✅ Planificación → ✅ Research → ✅ Data Model → ✅ Contracts → ✅ Quickstart. Siguiente fase: Tareas de implementación.

✅ **IV. Entregas Independientes**: Cada historia de usuario es independiente y testeable. El módulo de caja puede funcionar de forma autónoma antes de integrar otros módulos. APIs diseñadas para integración modular.

✅ **V. Consistencia de Plantillas**: Utilizando templates oficiales de .specify/templates/ para toda la documentación y estructura. Contexto de agente actualizado.

**Estado del Gate Post-Diseño**: ✅ APROBADO - Todas las fases completadas exitosamente, listo para generación de tareas

## Project Structure

### Documentation (this feature)

```text
specs/001-modulo-caja/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-endpoints.yaml
│   └── database-schema.sql
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application (Laravel backend + React frontend via Inertia)
app/
├── Http/
│   ├── Controllers/
│   │   ├── CajaController.php
│   │   ├── MovimientoController.php
│   │   └── ComprobanteController.php
│   ├── Requests/
│   │   ├── AperturaCajaRequest.php
│   │   ├── CierreCajaRequest.php
│   │   └── MovimientoRequest.php
│   └── Middleware/
│       └── CajaMiddleware.php
├── Models/
│   ├── Caja.php
│   ├── Movimiento.php
│   ├── Comprobante.php
│   ├── FormaPago.php
│   └── Cancelacion.php
└── Services/
    ├── CajaService.php
    ├── CalculadoraSaldoService.php
    └── ComprobanteService.php

database/
├── migrations/
│   ├── 2025_10_25_000001_create_cajas_table.php
│   ├── 2025_10_25_000002_create_movimientos_table.php
│   ├── 2025_10_25_000003_create_comprobantes_table.php
│   └── 2025_10_25_000004_create_cancelaciones_table.php
├── factories/
└── seeders/

resources/
├── js/
│   ├── Pages/
│   │   └── Caja/
│   │       ├── Index.jsx
│   │       ├── Apertura.jsx
│   │       ├── Cierre.jsx
│   │       ├── Movimientos.jsx
│   │       └── Reportes.jsx
│   └── Components/
│       └── Caja/
│           ├── ResumenCaja.jsx
│           ├── FormularioCobro.jsx
│           └── ListaMovimientos.jsx
└── views/
    └── caja/
        └── comprobantes/
            ├── cobro.blade.php
            └── anulacion.blade.php

tests/
├── Feature/
│   ├── CajaTest.php
│   ├── MovimientoTest.php
│   └── ComprobanteTest.php
└── Unit/
    ├── CajaServiceTest.php
    └── CalculadoraSaldoServiceTest.php
```

**Structure Decision**: Seleccionada estructura de aplicación web con Laravel backend y React frontend via Inertia.js. Esta decisión se basa en los requerimientos constitucionales del proyecto Aranto que especifican: "Laravel + Inertia + React + Docker + MySQL".

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No hay violaciones constitucionales que requieran justificación. El diseño del módulo de caja sigue todos los principios establecidos en la constitución del proyecto.

## 📊 Estado Actual del Proyecto

### ✅ FASE 1 COMPLETADA: Backend API (T001-T050)
**Commit:** `d5399ce` - feat(caja): implementar API completa con controladores y sistema de permisos

#### Infraestructura (T001-T015)
- [x] Laravel 10.x + Docker + MySQL + Redis
- [x] React 18 + Inertia.js + shadcn/ui + Tailwind CSS
- [x] Modelos de datos con relaciones completas
- [x] Migraciones y seeders funcionales

#### Servicios de Negocio (T016-T030)  
- [x] CashRegisterService - Gestión de sesiones
- [x] PaymentService - Procesamiento de pagos
- [x] AuditService - Trazabilidad completa

#### API Controllers (T031-T050)
- [x] CashRegisterController - 6 endpoints
- [x] TransactionController - 5 endpoints
- [x] AuditController - 6 endpoints
- [x] ServiceController - 7 endpoints
- [x] 25 rutas API con middleware de permisos
- [x] Sistema Spatie Permission: 4 roles, 22 permisos

### 🎯 PRÓXIMA FASE: Frontend Components (T051-T080)
- [ ] CashRegisterDashboard - Dashboard principal
- [ ] PaymentForm - Formularios de cobro
- [ ] AuditReports - Reportes de auditoría
- [ ] ServiceManagement - Gestión de servicios

### 📈 Progreso General: 39% (50/127 tareas)
