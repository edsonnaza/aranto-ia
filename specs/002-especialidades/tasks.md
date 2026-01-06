# Tasks: Módulo de Especialidades (CRUD)

**Feature**: 002-especialidades | **Date**: 2025-01-06 | **Status**: Ready for Development

## Summary

Total Tasks: 24 | Estimated Effort: 2-3 days

### Task Distribution by User Story
- **US1** (Listar): 4 tasks
- **US2** (Crear): 4 tasks
- **US3** (Editar): 4 tasks
- **US4** (Eliminar): 4 tasks
- **US5** (Estado): 4 tasks

### Parallel Opportunities
- Backend (T004-T013) and Frontend (T014-T021) can be developed in parallel
- Each user story phase is independent and can be tested separately

## Dependencies

User story completion order:
1. US1 (Listar) - Must be first, provides base functionality
2. US2 (Crear) - Depends on US1 infrastructure
3. US3 (Editar) - Depends on US1, US2
4. US4 (Eliminar) - Depends on US1, US2, US3
5. US5 (Estado) - Depends on US1, US2, US3

---

## Phase 1: Setup

- [ ] T001 Create database migration for specialties table in `database/migrations/2025_01_06_create_specialties_table.php`
- [ ] T002 Create Specialty model in `app/Models/Specialty.php` with fillable attributes and relationships
- [ ] T003 Create SpecialtyFactory in `database/factories/SpecialtyFactory.php` for testing
- [ ] T004 Create SpecialtySeeder in `database/seeders/SpecialtySeeder.php` with initial data

---

## Phase 2: Backend Infrastructure

- [ ] T005 Create SpecialtyController in `app/Http/Controllers/SpecialtyController.php` with resource methods
- [ ] T006 Create SpecialtyService in `app/Services/SpecialtyService.php` for business logic
- [ ] T007 Create SpecialtyRequest validation in `app/Http/Requests/SpecialtyRequest.php` with store/update rules
- [ ] T008 Register specialty routes in `routes/web.php` using Route::resource('specialties', SpecialtyController::class)

---

## Phase 3: User Story 1 - Listar Especialidades (P1)

### Goal
Administrators can view a paginated list of all specialties with filtering and search capabilities.

### Independent Test Criteria
- ✓ Route `/specialties` renders the index page
- ✓ All specialties are displayed in a table
- ✓ Pagination works correctly (20 per page)
- ✓ Search filters by name
- ✓ Status filter works (active/inactive)

### Implementation Tasks

- [ ] T009 [P] [US1] Create SpecialtyIndex React component in `resources/js/Pages/Settings/Specialties/Index.tsx`
- [ ] T010 [P] [US1] Create useSpecialties custom hook in `resources/js/hooks/useSpecialties.ts` for fetching list
- [ ] T011 [P] [US1] Implement search and filter state management in SpecialtyIndex component
- [ ] T012 [US1] Implement index action in SpecialtyController returning Inertia response with specialties data

---

## Phase 3.1: User Story 2 - Crear Especialidad (P1)

### Goal
Administrators can create new specialties with name, description, and status.

### Independent Test Criteria
- ✓ Form validation prevents empty name submission
- ✓ Unique name validation works
- ✓ Specialty is created and saved to database
- ✓ New specialty appears in list immediately
- ✓ Default status is 'active'

### Implementation Tasks

- [ ] T013 [P] [US2] Create SpecialtyForm React component in `resources/js/Pages/Settings/Specialties/Form.tsx` (reusable for create/edit)
- [ ] T014 [P] [US2] Create useCreateSpecialty custom hook in `resources/js/hooks/useCreateSpecialty.ts` with form submission
- [ ] T015 [P] [US2] Create Create button and modal/page link in SpecialtyIndex component
- [ ] T016 [US2] Implement store action in SpecialtyController with form validation and redirect to index

---

## Phase 3.2: User Story 3 - Editar Especialidad (P1)

### Goal
Administrators can modify existing specialties and changes persist in database.

### Independent Test Criteria
- ✓ Form pre-populates with current specialty data
- ✓ Changes are saved to database
- ✓ Updated values appear in list without page reload (via Inertia)
- ✓ Validation prevents invalid updates
- ✓ Edit preserves existing ID

### Implementation Tasks

- [ ] T017 [P] [US3] Create useEditSpecialty custom hook in `resources/js/hooks/useEditSpecialty.ts` for updating
- [ ] T018 [P] [US3] Add Edit button to each row in SpecialtyIndex with modal/form launch
- [ ] T019 [P] [US3] Modify SpecialtyForm component to accept edit mode with pre-populated values
- [ ] T020 [US3] Implement edit and update actions in SpecialtyController with form validation

---

## Phase 3.3: User Story 4 - Eliminar Especialidad (P2)

### Goal
Administrators can delete specialties with confirmation dialog and appropriate warnings.

### Independent Test Criteria
- ✓ Delete confirmation dialog appears before deletion
- ✓ Specialty is removed from database after confirmation
- ✓ Specialty disappears from list immediately
- ✓ Warning appears if specialty has associated professionals
- ✓ Deletion is logged for audit trail

### Implementation Tasks

- [ ] T021 [P] [US4] Create useDeleteSpecialty custom hook in `resources/js/hooks/useDeleteSpecialty.ts` with confirmation
- [ ] T022 [P] [US4] Add Delete button with confirmation dialog to each row in SpecialtyIndex
- [ ] T023 [P] [US4] Add check for associated professionals before delete
- [ ] T024 [US4] Implement destroy action in SpecialtyController with soft-delete or hard-delete logic

---

## Phase 3.4: User Story 5 - Cambiar Estado (P2)

### Goal
Administrators can toggle specialty status without page reload.

### Independent Test Criteria
- ✓ Status toggle works via button/switch in list
- ✓ Status change persists in database
- ✓ UI updates immediately without reload (via Inertia)
- ✓ Status filter reflects changes
- ✓ Inactive specialties don't appear in medical workflows

### Implementation Tasks

- [ ] T025 [P] [US5] Add status toggle button/switch to each row in SpecialtyIndex
- [ ] T026 [P] [US5] Create useToggleSpecialtyStatus custom hook in `resources/js/hooks/useToggleSpecialtyStatus.ts`
- [ ] T027 [P] [US5] Implement optimistic UI update while request is in flight
- [ ] T028 [US5] Create or update controller method for status toggle (via update action with status param)

---

## Phase 4: Testing & Polish

- [ ] T029 Create Pest tests for SpecialtyController in `tests/Feature/SpecialtyControllerTest.php`
- [ ] T030 Create Pest tests for SpecialtyService in `tests/Unit/SpecialtyServiceTest.php`
- [ ] T031 Verify all validation rules work as expected
- [ ] T032 Test permission checks (only admin can CRUD specialties)
- [ ] T033 Run full integration test (create, read, update, delete flow)
- [ ] T034 Performance test with 1000+ specialties
- [ ] T035 Document API endpoints in QUICK_REFERENCE.md

---

## Implementation Checklist

### Backend Completion
- [ ] Database migration applied
- [ ] Model created with relationships
- [ ] Controller implements all resource actions
- [ ] Validation rules complete
- [ ] Service layer business logic implemented
- [ ] Routes registered

### Frontend Completion
- [ ] Index component displays list
- [ ] Create form functional
- [ ] Edit form functional
- [ ] Delete with confirmation
- [ ] Status toggle works
- [ ] Search/filter responsive
- [ ] All hooks created and tested

### Deployment Ready
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Permissions enforced
- [ ] Documentation complete
- [ ] Git commits atomic and well-documented

