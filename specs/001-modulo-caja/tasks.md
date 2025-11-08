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
- [ ] T018.1 [P] Create medical_services table migration in database/migrations/
- [ ] T018.2 [P] Create insurance_types table migration in database/migrations/
- [ ] T018.3 [P] Create service_prices table migration in database/migrations/
- [ ] T018.4 [P] Create service_categories table migration in database/migrations/
- [ ] T018.5 [P] Create patients table migration in database/migrations/
- [ ] T018.6 [P] Create professionals table migration in database/migrations/
- [ ] T018.7 [P] Create specialties table migration in database/migrations/
- [ ] T018.8 [P] Create professional_specialties table migration in database/migrations/
- [ ] T019 Create CashRegister model in app/Models/CashRegister.php (data only, no business logic)
- [ ] T020 [P] Create Movement model in app/Models/Movement.php (data only, no business logic)
- [ ] T021 [P] Create CommissionLiquidation model in app/Models/CommissionLiquidation.php (data only, no business logic)
- [ ] T022 [P] Create CommissionLiquidationDetail model in app/Models/CommissionLiquidationDetail.php (data only, no business logic)
- [ ] T023 [P] Create Receipt model in app/Models/Receipt.php (data only, no business logic)
- [ ] T024 [P] Create MovementDetail model in app/Models/MovementDetail.php (data only, no business logic)
- [ ] T025 [P] Create PaymentMethod model in app/Models/PaymentMethod.php (data only, no business logic)
- [ ] T025.1 [P] Create MedicalService model in app/Models/MedicalService.php (data only, no business logic)
- [ ] T025.2 [P] Create InsuranceType model in app/Models/InsuranceType.php (data only, no business logic)
- [ ] T025.3 [P] Create ServicePrice model in app/Models/ServicePrice.php (data only, no business logic)
- [ ] T025.4 [P] Create ServiceCategory model in app/Models/ServiceCategory.php (data only, no business logic)
- [ ] T025.5 [P] Create Patient model in app/Models/Patient.php (data only, no business logic)
- [ ] T025.6 [P] Create Professional model in app/Models/Professional.php (data only, no business logic)
- [ ] T025.7 [P] Create Specialty model in app/Models/Specialty.php (data only, no business logic)
- [ ] T025.8 [P] Create ProfessionalSpecialty model in app/Models/ProfessionalSpecialty.php (data only, no business logic)
- [ ] T026 [P] Create database seeders for initial data in database/seeders/
- [ ] T027 [P] Setup model relationships only (no business logic in models)
- [ ] T028 [P] Create base service classes structure in app/Services/
- [ ] T029 [P] Create base request validation classes in app/Http/Requests/
- [ ] T030 [P] Setup frontend folder structure (Pages, Components, Hooks, Utils, Types)

## Phase 3.5: Medical Services CRUD, Pricing System & Patient/Professional Registry (P2)

**Purpose**: Complete medical services catalog with pricing by insurance type, plus patient and professional registry with commissions

**Independent Test**: Can create, read, update and delete medical services with different prices per insurance type, register patients with insurance, register professionals with specialties and commission rates

**Database & Models - Services & Pricing**:
- [ ] T030.1 [SERV] Implement medical_services table migration (id, name, code, description, category_id, status, created_at, updated_at)
- [ ] T030.2 [SERV] Implement insurance_types table migration (id, name, code, description, status, created_at, updated_at)
- [ ] T030.3 [SERV] Implement service_categories table migration (id, name, description, created_at, updated_at)
- [ ] T030.4 [SERV] Implement service_prices table migration (id, service_id, insurance_type_id, price, effective_from, effective_until, created_at, updated_at)

**Database & Models - Patients & Professionals**:
- [ ] T030.5 [PAT] Implement patients table migration (document info, personal data, insurance_type_id, emergency contacts)
- [ ] T030.6 [PROF] Implement professionals table migration (personal data, license info, commission_percentage, status)
- [ ] T030.7 [SPEC] Implement specialties table migration (id, name, code, description, status)
- [ ] T030.8 [PROF] Implement professional_specialties pivot table migration (professional_id, specialty_id, certification_date, is_primary)

**Backend Services - Core Business Logic**:
- [ ] T030.9 [SERV] Create MedicalServiceService in app/Services/MedicalServiceService.php (business logic for services)
- [ ] T030.10 [PRIC] Create PricingService in app/Services/PricingService.php (pricing logic by insurance type and date)
- [ ] T030.11 [INS] Create InsuranceTypeService in app/Services/InsuranceTypeService.php (insurance management)
- [ ] T030.12 [PAT] Create PatientService in app/Services/PatientService.php (patient registry and insurance validation)
- [ ] T030.13 [PROF] Create ProfessionalService in app/Services/ProfessionalService.php (professional registry and commission calculation)

**Backend Controllers - API Layer**:
- [ ] T030.14 [SERV] Create MedicalServiceController in app/Http/Controllers/MedicalServiceController.php
- [ ] T030.15 [PRIC] Create ServicePriceController in app/Http/Controllers/ServicePriceController.php
- [ ] T030.16 [INS] Create InsuranceTypeController in app/Http/Controllers/InsuranceTypeController.php
- [ ] T030.17 [PAT] Create PatientController in app/Http/Controllers/PatientController.php
- [ ] T030.18 [PROF] Create ProfessionalController in app/Http/Controllers/ProfessionalController.php
- [ ] T030.19 [SPEC] Create SpecialtyController in app/Http/Controllers/SpecialtyController.php

**Backend Requests & Resources - Validation & Formatting**:
- [ ] T030.20 [SERV] Create MedicalServiceRequest in app/Http/Requests/MedicalServiceRequest.php
- [ ] T030.21 [PRIC] Create ServicePriceRequest in app/Http/Requests/ServicePriceRequest.php
- [ ] T030.22 [PAT] Create PatientRequest in app/Http/Requests/PatientRequest.php
- [ ] T030.23 [PROF] Create ProfessionalRequest in app/Http/Requests/ProfessionalRequest.php
- [ ] T030.24 [SERV] Create MedicalServiceResource in app/Http/Resources/MedicalServiceResource.php
- [ ] T030.25 [PAT] Create PatientResource in app/Http/Resources/PatientResource.php
- [ ] T030.26 [PROF] Create ProfessionalResource in app/Http/Resources/ProfessionalResource.php

**Frontend Components - Services & Pricing**:
- [ ] T030.27 [SERV] Create ServiceList component in resources/js/Components/Services/ServiceList.tsx
- [ ] T030.28 [SERV] Create ServiceForm component in resources/js/Components/Services/ServiceForm.tsx
- [ ] T030.29 [PRIC] Create ServicePriceManager component in resources/js/Components/Services/ServicePriceManager.tsx
- [ ] T030.30 [INS] Create InsuranceTypeSelector component in resources/js/Components/Services/InsuranceTypeSelector.tsx
- [ ] T030.31 [SERV] Create ServiceCategorySelector component in resources/js/Components/Services/ServiceCategorySelector.tsx

**Frontend Components - Patients & Professionals**:
- [ ] T030.32 [PAT] Create PatientList component in resources/js/Components/Patients/PatientList.tsx
- [ ] T030.33 [PAT] Create PatientForm component in resources/js/Components/Patients/PatientForm.tsx
- [ ] T030.34 [PAT] Create PatientSearch component in resources/js/Components/Patients/PatientSearch.tsx
- [ ] T030.35 [PROF] Create ProfessionalList component in resources/js/Components/Professionals/ProfessionalList.tsx
- [ ] T030.36 [PROF] Create ProfessionalForm component in resources/js/Components/Professionals/ProfessionalForm.tsx
- [ ] T030.37 [SPEC] Create SpecialtySelector component in resources/js/Components/Professionals/SpecialtySelector.tsx
- [ ] T030.38 [PROF] Create CommissionSettings component in resources/js/Components/Professionals/CommissionSettings.tsx

**Frontend Pages - Main Views**:
- [ ] T030.39 [SERV] Create services index page in resources/js/Pages/Services/Index.tsx
- [ ] T030.40 [SERV] Create service create/edit page in resources/js/Pages/Services/CreateEdit.tsx
- [ ] T030.41 [INS] Create insurance types management page in resources/js/Pages/Services/InsuranceTypes.tsx
- [ ] T030.42 [SERV] Create service categories management page in resources/js/Pages/Services/Categories.tsx
- [ ] T030.43 [PAT] Create patients index page in resources/js/Pages/Patients/Index.tsx
- [ ] T030.44 [PAT] Create patient create/edit page in resources/js/Pages/Patients/CreateEdit.tsx
- [ ] T030.45 [PROF] Create professionals index page in resources/js/Pages/Professionals/Index.tsx
- [ ] T030.46 [PROF] Create professional create/edit page in resources/js/Pages/Professionals/CreateEdit.tsx

**Frontend Hooks & State - Data Management**:
- [ ] T030.47 [SERV] Create useMedicalServices hook in resources/js/Hooks/useMedicalServices.ts
- [ ] T030.48 [PRIC] Create useServicePricing hook in resources/js/Hooks/useServicePricing.ts
- [ ] T030.49 [PAT] Create usePatients hook in resources/js/Hooks/usePatients.ts
- [ ] T030.50 [PROF] Create useProfessionals hook in resources/js/Hooks/useProfessionals.ts
- [ ] T030.51 [SERV] Create medical services store in resources/js/stores/services.ts
- [ ] T030.52 [PAT] Create patients store in resources/js/stores/patients.ts
- [ ] T030.53 [PROF] Create professionals store in resources/js/stores/professionals.ts

**API Routes & Integration**:
- [ ] T030.54 [API] Implement API routes for medical services CRUD in routes/api.php
- [ ] T030.55 [API] Implement API routes for service pricing in routes/api.php
- [ ] T030.56 [API] Implement API routes for patient registry in routes/api.php
- [ ] T030.57 [API] Implement API routes for professional registry in routes/api.php
- [ ] T030.58 [WEB] Implement web routes for all management pages in routes/web.php
- [ ] T030.59 [SEED] Create seeders for sample data (services, insurance types, patients, professionals) in database/seeders/

**Business Logic Implementation - Advanced Features**:
- [ ] T030.60 [PRIC] Implement service price calculation by insurance type and date with history
- [ ] T030.61 [PRIC] Implement price validation (no gaps, no overlaps) for service-insurance combinations
- [ ] T030.62 [SERV] Implement service search and filtering functionality (by name, category, code)
- [ ] T030.63 [PRIC] Implement bulk price update functionality for insurance types
- [ ] T030.64 [PAT] Implement patient search by document, name, insurance number
- [ ] T030.65 [PROF] Implement professional search by name, license, specialty
- [ ] T030.66 [COMM] Implement commission calculation logic (percentage, fixed, custom methods)
- [ ] T030.67 [VALID] Implement cross-validation (patient insurance valid, professional active, service available)
- [ ] T030.68 [AUDIT] Implement audit trail for all price changes and registry updates
- [ ] T030.69 [REPORT] Implement basic reporting (services by insurance, professionals by specialty)
- [ ] T030.70 [EXPORT] Implement data export functionality (patients list, professionals list, price lists)

## Phase 3.6: Reception Module - Patient Service Requests (P1)

**Purpose**: Complete reception module with "shopping cart" interface for service requests that flow into cash register

**Independent Test**: Receptionist can search patient, confirm insurance, add multiple services with professionals to cart, schedule appointments, and generate service requests that appear in cash register for payment

**Database - Reception Core Tables**:
- [ ] T030.71 [REC] Implement service_requests table migration (patient_id, request_number, status, reception_type, total_amount, payment_status)
- [ ] T030.72 [REC] Implement service_request_details table migration (service_request_id, medical_service_id, professional_id, scheduled_date, pricing, status)
- [ ] T030.73 [REC] Implement service_request_status_history table migration (audit trail for status changes)

**Backend Services - Reception Business Logic**:
- [ ] T030.74 [REC] Create ReceptionService in app/Services/ReceptionService.php (service request creation and management)
- [ ] T030.75 [REC] Create ServiceRequestService in app/Services/ServiceRequestService.php (cart logic, pricing calculation)
- [ ] T030.76 [REC] Create AppointmentService in app/Services/AppointmentService.php (scheduling and availability)

**Backend Controllers - Reception API**:
- [ ] T030.77 [REC] Create ServiceRequestController in app/Http/Controllers/ServiceRequestController.php
- [ ] T030.78 [REC] Create ReceptionController in app/Http/Controllers/ReceptionController.php

**Backend Requests & Resources - Reception Validation**:
- [ ] T030.79 [REC] Create ServiceRequestRequest in app/Http/Requests/ServiceRequestRequest.php
- [ ] T030.80 [REC] Create ServiceRequestResource in app/Http/Resources/ServiceRequestResource.php

**Frontend Components - Patient Search & Selection**:
- [ ] T030.81 [REC] Create PatientSearchable component in resources/js/Components/Reception/PatientSearchable.tsx
- [ ] T030.82 [REC] Create PatientInsuranceConfirmation component in resources/js/Components/Reception/PatientInsuranceConfirmation.tsx

**Frontend Components - Service Cart System**:
- [ ] T030.83 [REC] Create ServiceSearchable component in resources/js/Components/Reception/ServiceSearchable.tsx
- [ ] T030.84 [REC] Create ProfessionalSearchable component in resources/js/Components/Reception/ProfessionalSearchable.tsx
- [ ] T030.85 [REC] Create ServiceCart component in resources/js/Components/Reception/ServiceCart.tsx
- [ ] T030.86 [REC] Create CartItem component in resources/js/Components/Reception/CartItem.tsx
- [ ] T030.87 [REC] Create AppointmentScheduler component in resources/js/Components/Reception/AppointmentScheduler.tsx

**Frontend Components - Request Management**:
- [ ] T030.88 [REC] Create ServiceRequestForm component in resources/js/Components/Reception/ServiceRequestForm.tsx
- [ ] T030.89 [REC] Create RequestStatusBadge component in resources/js/Components/Reception/RequestStatusBadge.tsx
- [ ] T030.90 [REC] Create RequestSummary component in resources/js/Components/Reception/RequestSummary.tsx

**Frontend Pages - Reception Interface**:
- [ ] T030.91 [REC] Create reception dashboard page in resources/js/Pages/Reception/Dashboard.tsx
- [ ] T030.92 [REC] Create new service request page in resources/js/Pages/Reception/CreateRequest.tsx
- [ ] T030.93 [REC] Create pending requests list page in resources/js/Pages/Reception/PendingRequests.tsx
- [ ] T030.94 [REC] Create request history page in resources/js/Pages/Reception/RequestHistory.tsx

**Frontend Hooks & State - Reception Data Management**:
- [ ] T030.95 [REC] Create useServiceCart hook in resources/js/Hooks/useServiceCart.ts
- [ ] T030.96 [REC] Create useServiceRequests hook in resources/js/Hooks/useServiceRequests.ts
- [ ] T030.97 [REC] Create usePriceCalculation hook in resources/js/Hooks/usePriceCalculation.ts
- [ ] T030.98 [REC] Create reception store in resources/js/stores/reception.ts

**API Routes & Integration - Reception Endpoints**:
- [ ] T030.99 [REC] Implement API routes for service requests CRUD in routes/api.php
- [ ] T030.100 [REC] Implement API routes for pricing calculation in routes/api.php
- [ ] T030.101 [REC] Implement web routes for reception pages in routes/web.php
- [ ] T030.102 [REC] Create seeders for sample service requests in database/seeders/

**Business Logic - Advanced Reception Features**:
- [ ] T030.103 [REC] Implement real-time pricing calculation by insurance type
- [ ] T030.104 [REC] Implement service availability checking by professional and date
- [ ] T030.105 [REC] Implement automatic request number generation (REQ-2025-001234)
- [ ] T030.106 [REC] Implement cart total calculation with discounts and taxes
- [ ] T030.107 [REC] Implement request status workflow management
- [ ] T030.108 [REC] Implement service conflict detection (double-booking prevention)

**Integration Features - Reception → Cash Register**:
- [ ] T030.109 [INT] Update cash register to display pending service requests
- [ ] T030.110 [INT] Implement service request selection in cash register payment modal
- [ ] T030.111 [INT] Create automatic linking between payments and service request details
- [ ] T030.112 [INT] Implement partial payment handling for service requests
- [ ] T030.113 [INT] Update movement_details to include service_request_id references
- [ ] T030.114 [INT] Implement automatic status updates (pending_payment → paid)

**Validation & Business Rules - Reception**:
- [ ] T030.115 [VAL] Implement patient insurance validation at request creation
- [ ] T030.116 [VAL] Implement service price availability validation by insurance type
- [ ] T030.117 [VAL] Implement professional availability validation by specialty and service
- [ ] T030.118 [VAL] Implement appointment scheduling conflict detection
- [ ] T030.119 [VAL] Implement cart total validation and price consistency checks
- [ ] T030.120 [VAL] Implement request cancellation and modification validations

## Phase 4: User Story 1 - Gestión de Apertura y Cierre de Caja (P1)

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

## Phase 5: User Story 2 - Cobros de Servicios Médicos (P1)

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

## Phase 5.5: Integración con Módulo de Recepción (P1)

**Purpose**: Integration with reception module for service payment processing

**Independent Test**: Can display pending services from reception and process payments with proper linking

- [ ] T054.1 [INT] Create ServiceRequest model in app/Models/ServiceRequest.php
- [ ] T054.2 [INT] Create migration for service_requests table
- [ ] T054.3 [INT] Add service_request_id field to movement_details table migration
- [ ] T054.4 [INT] Create PendingServicesController in app/Http/Controllers/PendingServicesController.php
- [ ] T054.5 [INT] Implement pending services queue logic in CashRegisterService
- [ ] T054.6 [INT] Create PendingServicesList component in resources/js/components/cash-register/PendingServicesList.tsx
- [ ] T054.7 [INT] Create ServicePaymentModal component in resources/js/components/cash-register/ServicePaymentModal.tsx
- [ ] T054.8 [INT] Add service origin tracking in TransactionModal
- [ ] T054.9 [INT] Implement service request status updates (pending_payment → paid)
- [ ] T054.10 [INT] Add service_request_id linking in MovementDetail creation
- [ ] T054.11 [INT] Create mock data for pending services testing
- [ ] T054.12 [INT] Add pending services view to cash register dashboard
- [ ] T054.13 [INT] Implement service payment processing with proper traceability
- [ ] T054.14 [INT] Add service origin validation in backend

## Phase 6: User Story 3 - Liquidación de Comisiones de Profesionales (P2)

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

## Phase 7: User Story 4 - Pagos Varios y Egresos (P2)

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

## Phase 8: User Story 5 - Cancelación y Reversión de Cobros (P1)

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

## Phase 9: Polish & Cross-Cutting Concerns

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
- Phase 3.5 (Medical Services + Patient/Professional Registry) → Foundational data for entire system
- Phase 3.6 (Reception Module) → Creates service requests that flow into cash register  
- US1 (Cash Register Management) → Must complete first (foundational)
- US2 (Service Payments) → Depends on US1 + Reception Module (needs service requests to process)
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

1. **Complete Phase 1-2** before starting user stories (foundation)
2. **Implement Phase 3.5 (Medical Services + Catastro)** for complete data foundation
3. **Implement Phase 3.6 (Reception Module)** for service request creation workflow
4. **Implement US1 (Cash Register)** for payment processing foundation ✅ COMPLETED
5. **US2 + US5** can be next (service payments with cancellation capability)
6. **US3 + US4** can follow (commissions and expenses)
7. **Phase 9 (Polish)** adds reporting and optimization

Each phase delivers independently testable functionality, enabling incremental feedback and deployment.

**Total Tasks**: 257 (updated to include complete Reception Module with shopping cart interface)
- **Setup + Foundational**: 38 tasks (T001-T030, T018.1-T025.8)
- **Medical Services + Patient/Professional Registry**: 70 tasks (T030.1-T030.70)
- **Reception Module (Shopping Cart Interface)**: 50 tasks (T030.71-T030.120)
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