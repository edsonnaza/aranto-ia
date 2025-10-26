---
description: "Task list for implementing Módulo de Caja (Cash Register Module)"
---

# Tasks: Módulo de Caja

**Input**: Design documents from `/specs/001-modulo-caja/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure following Single Responsibility Principle

- [ ] T001 Initialize Laravel project with Docker setup according to technical specifications
- [ ] T002 [P] Configure Laravel Breeze authentication starter kit
- [ ] T003 [P] Setup Inertia.js with React 18 frontend integration 
- [ ] T004 [P] Install and configure shadcn/ui component library
- [ ] T005 [P] Setup Tailwind CSS with project-specific configuration
- [ ] T006 Configure MySQL 8.0 database with password '4r4nt0' and database 'aranto_medical'
- [ ] T007 Setup Docker Compose with phpMyAdmin on port 8080 using password '4r4nt0'
- [ ] T008 [P] Create base authentication middleware and role management
- [ ] T009 Setup layered project folder structure following Single Responsibility Principle
- [ ] T010 [P] Create environment configuration files (.env) with database credentials
- [ ] T011 [P] Setup Redis container for caching and session management

## Phase 2: Foundational (Database & Core Architecture)

**Purpose**: Core database structure and layered architecture setup following Single Responsibility Principle

- [ ] T012 Create cash_registers table migration in database/migrations/
- [ ] T013 [P] Create movements table migration in database/migrations/
- [ ] T014 [P] Create commission_liquidations table migration in database/migrations/
- [ ] T015 [P] Create commission_liquidation_details table migration in database/migrations/
- [ ] T016 [P] Create receipts table migration in database/migrations/
- [ ] T017 [P] Create movement_details table migration in database/migrations/
- [ ] T018 [P] Create payment_methods table migration in database/migrations/
- [ ] T019 Create CashRegister model in app/Models/CashRegister.php (data only, no business logic)
- [ ] T020 [P] Create Movement model in app/Models/Movement.php (data only, no business logic)
- [ ] T021 [P] Create CommissionLiquidation model in app/Models/CommissionLiquidation.php (data only, no business logic)
- [ ] T022 [P] Create CommissionLiquidationDetail model in app/Models/CommissionLiquidationDetail.php (data only, no business logic)
- [ ] T023 [P] Create Receipt model in app/Models/Receipt.php (data only, no business logic)
- [ ] T024 [P] Create MovementDetail model in app/Models/MovementDetail.php (data only, no business logic)
- [ ] T025 [P] Create PaymentMethod model in app/Models/PaymentMethod.php (data only, no business logic)
- [ ] T026 [P] Create database seeders for initial data in database/seeders/
- [ ] T027 [P] Setup model relationships only (no business logic in models)
- [ ] T028 [P] Create base service classes structure in app/Services/
- [ ] T029 [P] Create base request validation classes in app/Http/Requests/
- [ ] T030 [P] Setup frontend folder structure (Pages, Components, Hooks, Utils, Types)

## Phase 3: User Story 1 - Gestión de Apertura y Cierre de Caja (P1)

**Purpose**: Core cash register opening and closing functionality following layered architecture

**Independent Test**: Can open a cash register with initial amount, perform basic operations, and close with proper balance calculation

**Service Layer (Business Logic)**:
- [ ] T031 [US1] Create CashRegisterService in app/Services/CashRegisterService.php (ALL business logic here)
- [ ] T032 [US1] Implement cash register opening logic with initial amount validation in Service
- [ ] T033 [US1] Implement cash register closing logic with balance calculation formula in Service
- [ ] T034 [US1] Implement business rule: only one cash register open per user in Service

**Controller Layer (HTTP Handling)**:
- [ ] T035 [US1] Create CashRegisterController in app/Http/Controllers/CashRegisterController.php (thin controller)
- [ ] T036 [US1] Create CashRegisterRequest in app/Http/Requests/CashRegisterRequest.php (validation only)
- [ ] T037 [US1] Create CashRegisterResource in app/Http/Resources/CashRegisterResource.php (response formatting)
- [ ] T038 [US1] Implement API routes for cash register operations in routes/api.php

**Frontend Components (UI Only)**:
- [ ] T039 [US1] Create CashRegisterOpen component in resources/js/Components/CashRegister/CashRegisterOpen.jsx
- [ ] T040 [US1] Create CashRegisterClose component in resources/js/Components/CashRegister/CashRegisterClose.jsx
- [ ] T041 [US1] Create CashRegisterStatus component in resources/js/Components/CashRegister/CashRegisterStatus.jsx

**Frontend Hooks (State Management)**:
- [ ] T042 [US1] Create useCashRegister hook in resources/js/Hooks/useCashRegister.js (state management)
- [ ] T043 [US1] Create useBalance hook in resources/js/Hooks/useBalance.js (balance calculations)

**Frontend Pages (Views)**:
- [ ] T044 [US1] Create cash register opening page in resources/js/Pages/CashRegister/Open.jsx
- [ ] T045 [US1] Create cash register closing page in resources/js/Pages/CashRegister/Close.jsx
- [ ] T046 [US1] Create cash register dashboard page in resources/js/Pages/CashRegister/Dashboard.jsx

**Frontend Utils (Helpers)**:
- [ ] T047 [US1] Create currency formatters in resources/js/Utils/formatters.js
- [ ] T048 [US1] Create validation helpers in resources/js/Utils/validators.js

**Routes and Integration**:
- [ ] T049 [US1] Implement web routes for cash register pages in routes/web.php
- [ ] T050 [US1] Add real-time balance calculation display using hooks
- [ ] T051 [US1] Implement form validation using Request classes

## Phase 4: User Story 2 - Cobros de Servicios Médicos (P1)

**Purpose**: Service payment processing with multiple payment methods and service origins

**Independent Test**: Can register service payments from different origins (scheduled reception, walk-in reception, emergency, inpatient discharge) with different payment methods and generate receipts

- [ ] T037 [US2] Create PaymentController in app/Http/Controllers/PaymentController.php
- [ ] T038 [US2] Create PaymentService in app/Services/PaymentService.php
- [ ] T039 [US2] Implement payment processing logic for multiple payment methods
- [ ] T040 [US2] Implement receipt generation with consecutive numbering
- [ ] T041 [US2] Create PaymentForm component in resources/js/Components/Payment/PaymentForm.jsx
- [ ] T042 [US2] Create PaymentMethodSelector component in resources/js/Components/Payment/PaymentMethodSelector.jsx
- [ ] T043 [US2] Create ReceiptPreview component in resources/js/Components/Payment/ReceiptPreview.jsx
- [ ] T044 [US2] Create ServiceSelector component in resources/js/Components/Payment/ServiceSelector.jsx
- [ ] T045 [US2] Create ServiceOriginSelector component in resources/js/Components/Payment/ServiceOriginSelector.jsx
- [ ] T046 [US2] Implement API routes for payment operations in routes/api.php
- [ ] T047 [US2] Create payment processing page in resources/js/Pages/Payment/Create.jsx
- [ ] T048 [US2] Create payment history page in resources/js/Pages/Payment/History.jsx
- [ ] T049 [US2] Implement service origin detection logic (Reception-Scheduled, Reception-Walk-in, Emergency, Inpatient-Discharge)
- [ ] T050 [US2] Implement partial payment functionality with origin tracking
- [ ] T051 [US2] Add payment validation and error handling per service origin
- [ ] T052 [US2] Implement automatic cash register balance updates
- [ ] T053 [US2] Add receipt printing functionality with service origin details
- [ ] T054 [US2] Implement inpatient period tracking for discharge payments

## Phase 5: User Story 3 - Liquidación de Comisiones de Profesionales (P2)

**Purpose**: Commission liquidation system linked to reception services

**Independent Test**: Can generate commission liquidations filtering by professional and date range, including service request references

- [ ] T055 [US3] Create CommissionController in app/Http/Controllers/CommissionController.php
- [ ] T056 [US3] Create CommissionService in app/Services/CommissionService.php
- [ ] T057 [US3] Implement commission calculation logic based on professional percentages
- [ ] T058 [US3] Implement liquidation generation filtering by professional and date range
- [ ] T059 [US3] Create CommissionLiquidationForm component in resources/js/Components/Commission/CommissionLiquidationForm.jsx
- [ ] T060 [US3] Create CommissionReport component in resources/js/Components/Commission/CommissionReport.jsx
- [ ] T061 [US3] Create ProfessionalSelector component in resources/js/Components/Commission/ProfessionalSelector.jsx
- [ ] T062 [US3] Create DateRangeFilter component in resources/js/Components/Commission/DateRangeFilter.jsx
- [ ] T063 [US3] Implement API routes for commission operations in routes/api.php
- [ ] T064 [US3] Create commission liquidation page in resources/js/Pages/Commission/Create.jsx
- [ ] T065 [US3] Create commission history page in resources/js/Pages/Commission/History.jsx
- [ ] T066 [US3] Implement service request ID referencing in liquidation details
- [ ] T067 [US3] Add commission payment processing through cash register
- [ ] T068 [US3] Implement liquidation approval workflow
- [ ] T069 [US3] Add commission calculation validation and error handling

## Phase 6: User Story 4 - Pagos Varios y Egresos (P2)

**Purpose**: Various payments and operational expenses management

**Independent Test**: Can register different types of expenses with proper categorization and cash register balance updates

- [ ] T070 [US4] Create ExpenseController in app/Http/Controllers/ExpenseController.php
- [ ] T071 [US4] Create ExpenseService in app/Services/ExpenseService.php
- [ ] T072 [US4] Implement expense registration logic with categorization
- [ ] T073 [US4] Implement supplier payment functionality
- [ ] T074 [US4] Create ExpenseForm component in resources/js/Components/Expense/ExpenseForm.jsx
- [ ] T075 [US4] Create ExpenseCategory component in resources/js/Components/Expense/ExpenseCategory.jsx
- [ ] T076 [US4] Create SupplierSelector component in resources/js/Components/Expense/SupplierSelector.jsx
- [ ] T077 [US4] Implement API routes for expense operations in routes/api.php
- [ ] T078 [US4] Create expense registration page in resources/js/Pages/Expense/Create.jsx
- [ ] T079 [US4] Create expense history page in resources/js/Pages/Expense/History.jsx
- [ ] T080 [US4] Implement expense voucher generation
- [ ] T081 [US4] Add expense validation and approval workflow
- [ ] T082 [US4] Implement automatic cash register balance deduction

## Phase 7: User Story 5 - Cancelación y Reversión de Cobros (P1)

**Purpose**: Payment cancellation and reversal system with audit trail

**Independent Test**: Can cancel payments with proper justification, maintaining complete audit trail and cross-references

- [ ] T083 [US5] Create CancellationController in app/Http/Controllers/CancellationController.php
- [ ] T084 [US5] Create CancellationService in app/Services/CancellationService.php
- [ ] T085 [US5] Implement payment cancellation logic with reversal movements
- [ ] T086 [US5] Implement cross-reference system between original and cancelled payments
- [ ] T087 [US5] Create CancellationForm component in resources/js/Components/Cancellation/CancellationForm.jsx
- [ ] T088 [US5] Create CancellationJustification component in resources/js/Components/Cancellation/CancellationJustification.jsx
- [ ] T089 [US5] Create CancellationConfirmation component in resources/js/Components/Cancellation/CancellationConfirmation.jsx
- [ ] T090 [US5] Implement API routes for cancellation operations in routes/api.php
- [ ] T091 [US5] Create payment cancellation page in resources/js/Pages/Cancellation/Create.jsx
- [ ] T092 [US5] Create cancellation history page in resources/js/Pages/Cancellation/History.jsx
- [ ] T093 [US5] Implement supervisor authorization for old payments cancellation
- [ ] T094 [US5] Add automatic commission adjustment for cancelled payments
- [ ] T095 [US5] Implement balance validation before processing cancellations
- [ ] T096 [US5] Add complete audit trail for all cancellation operations

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, reporting, and system optimization

- [ ] T097 [P] Create comprehensive reporting system in app/Services/ReportService.php
- [ ] T098 [P] Implement daily cash register summary reports
- [ ] T099 [P] Create movement audit trail functionality
- [ ] T100 [P] Add system-wide search and filtering capabilities
- [ ] T101 [P] Implement data export functionality (PDF, Excel)
- [ ] T102 [P] Create user permission and role validation
- [ ] T103 [P] Add real-time dashboard with key metrics
- [ ] T104 [P] Implement system backup and recovery procedures
- [ ] T105 [P] Add comprehensive error handling and logging
- [ ] T106 [P] Create user documentation and help system
- [ ] T107 [P] Implement performance optimization for large datasets
- [ ] T108 [P] Add security auditing and compliance features

## Dependencies

**Sequential User Story Implementation**:
- US1 (Cash Register Management) → Must complete first (foundational)
- US2 (Service Payments) → Depends on US1 (needs open cash register)
- US5 (Payment Cancellations) → Depends on US2 (needs payments to cancel)
- US3 (Commission Liquidations) → Depends on US2 (needs service payments)
- US4 (Various Expenses) → Depends on US1 (needs cash register operations)

**Within User Stories**: Tests → Models → Services → Controllers → API Routes → Components → Pages → Integration

## Parallel Opportunities

### Setup Phase (All Parallel)
- Database migrations can run simultaneously
- Frontend component setup can be done in parallel
- Docker configuration is independent

### Development Phase (Per User Story)
- Frontend components within each story can be developed in parallel
- Model creation is parallelizable once migrations are complete
- API routes can be implemented alongside controllers

## MVP Scope Recommendation

**Phase 1-3 (Setup + US1)** provides a complete, testable cash register system:
- Cash register opening/closing
- Basic balance calculation
- Audit trail foundation
- User authentication and authorization

This MVP allows immediate testing and feedback while providing core business value.

## Implementation Strategy

1. **Complete Phase 1-2** before starting user stories
2. **Implement US1 completely** before moving to other stories (foundational)
3. **US2 + US5** can be next (core payment functionality with all service origins)
4. **US3 + US4** can follow (complementary features)
5. **Polish phase** adds reporting and optimization

Each phase delivers independently testable functionality, enabling incremental feedback and deployment.

**Total Tasks**: 127 (updated to include layered architecture and Docker configuration)
- **Setup + Foundational**: 30 tasks (T001-T030)
- **User Stories**: 85 tasks (T031-T115)  
- **Polish**: 12 tasks (T116-T127)

**Architecture Compliance**:
- ✅ Single Responsibility Principle enforced in all layers
- ✅ Thin controllers (HTTP handling only)
- ✅ Services contain all business logic
- ✅ Models handle data relationships only
- ✅ Frontend hooks manage state
- ✅ Utils provide pure functions

**Docker Configuration**:
- ✅ MySQL 8.0 with password '4r4nt0'
- ✅ phpMyAdmin on port 8080 with same credentials
- ✅ Redis for caching and sessions
- ✅ Database 'aranto_medical' with user 'aranto_user'

**Service Origin Coverage**:
- ✅ Reception-Scheduled (servicios agendados)
- ✅ Reception-Walk-in (orden de llegada)
- ✅ Emergency (urgencias)  
- ✅ Inpatient-Discharge (altas de internado)