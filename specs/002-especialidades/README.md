# 📋 Módulo de Especialidades (002-especialidades)

## 📌 Overview

Módulo CRUD completo para gestionar especialidades médicas. Incluye operaciones de **Create, Read, Update, Delete** y cambio de estado de especialidades.

## 📂 Documentos

| Documento | Descripción |
|-----------|-------------|
| [spec.md](./spec.md) | Especificación con 5 user stories completos |
| [plan.md](./plan.md) | Plan de implementación y contexto técnico |
| [data-model.md](./data-model.md) | Esquema de base de datos |
| [tasks.md](./tasks.md) | **35 tareas detalladas** organizadas por fase |
| [resumen-ejecutivo.md](./resumen-ejecutivo.md) | Resumen ejecutivo y estimación de esfuerzo |

## 🎯 User Stories

| ID | Prioridad | Descripción | Estado |
|----|-----------|-------------|--------|
| US1 | **P1** | Listar especialidades | 📋 Ready |
| US2 | **P1** | Crear especialidad | 📋 Ready |
| US3 | **P1** | Editar especialidad | 📋 Ready |
| US4 | **P2** | Eliminar especialidad | 📋 Ready |
| US5 | **P2** | Cambiar estado | 📋 Ready |

## ⚡ Quick Start

### Para empezar el desarrollo:

```bash
# 1. Ver todos los tasks
cat tasks.md

# 2. Iniciar con Phase 1 (Setup)
# - T001: Crear migration
# - T002: Crear model
# - T003: Crear factory
# - T004: Crear seeder

# 3. Continuar con Phase 2 (Backend)
# - T005-T008: Controller, Service, Validation, Routes

# 4. Desarrollar Frontend en paralelo (Phase 3)
# - T009-T028: Components, Hooks, Forms por cada US

# 5. Testing & Polish (Phase 4)
# - T029-T035: Tests, validations, documentación
```

## 📊 Distribución de Trabajo

```
Total: 35 tareas

Phases:
- Setup (Phase 1):           4 tasks
- Backend (Phase 2):         4 tasks
- US1 - Listar (Phase 3):    4 tasks
- US2 - Crear (Phase 3.1):   4 tasks
- US3 - Editar (Phase 3.2):  4 tasks
- US4 - Eliminar (Phase 3.3): 4 tasks
- US5 - Estado (Phase 3.4):  4 tasks
- Testing & Polish (Phase 4): 7 tasks
```

## ⏱️ Estimación

- **Esfuerzo Total**: 10-14 horas
- **Duración Estimada**: 2 días
- **Parallelizable**: Backend + Frontend pueden desarrollarse simultáneamente

## 🏗️ Arquitectura

```
Inertia.js (Router + Props)
├── React Components
│   ├── SpecialtyIndex (lista)
│   └── SpecialtyForm (crear/editar)
└── Custom Hooks
    ├── useSpecialties (listar)
    ├── useCreateSpecialty (crear)
    ├── useEditSpecialty (editar)
    ├── useDeleteSpecialty (eliminar)
    └── useToggleSpecialtyStatus (estado)
        ↓
Laravel Routes (routes/web.php)
    ↓
SpecialtyController (resource actions)
    ↓
SpecialtyService (business logic)
    ↓
SpecialtyRequest (validation)
    ↓
Specialty Model
    ↓
Database (specialties table)
```

## ✅ Criterios de Éxito

- [ ] Todos los tests pasan
- [ ] CRUD completo funcional
- [ ] Búsqueda y filtros trabajando
- [ ] Validación de datos completa
- [ ] Interfaz responsive
- [ ] Documentación actualizada
- [ ] Commits atómicos

## 📚 Referencias

Ver también:
- [plan.md](./plan.md) para contexto técnico
- [tasks.md](./tasks.md) para detalles de implementación
- [QUICK_REFERENCE.md](../../QUICK_REFERENCE.md) para patrones del proyecto

