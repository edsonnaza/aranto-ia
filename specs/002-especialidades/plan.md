# Implementation Plan: Módulo de Especialidades

**Branch**: `002-especialidades` | **Date**: 2025-01-06 | **Spec**: [spec.md](./spec.md)

## Summary

Implementar módulo completo de CRUD para especialidades médicas. El sistema debe permitir a administradores listar, crear, editar, eliminar y cambiar estado de especialidades. Cada especialidad tiene nombre, descripción y estado (activa/inactiva).

## Technical Context

### Core Stack
**Language/Version**: PHP 8.2+ con Laravel 11.x  
**Frontend**: React 18, Tailwind CSS, Inertia.js  
**Primary Dependencies**: Laravel, Inertia.js, React, Tailwind CSS, MySQL 8.0  
**Storage**: MySQL 8.0 con migraciones Laravel  
**Testing**: Pest PHP para backend, Vitest para frontend  
**Project Type**: Web application (Laravel backend + React frontend via Inertia)

### Architecture Constraints - CRITICAL RESTRICTIONS

#### NO API Controllers - Use Inertia.js Pattern ONLY
- **NEVER** create API controllers (app/Http/Controllers/Api/*)
- **ALWAYS** use Laravel controllers that render Inertia responses
- **PATTERN**: Follow existing controllers like PatientController, InsuranceTypeController
- **ROUTING**: Use web.php and resource routes
- **FRONTEND**: React components receive data as props from Inertia
- **DATA EXCHANGE**: Use Inertia form submissions, not AJAX/fetch

#### Custom Hooks Pattern - MANDATORY DATA ACCESS
- **NEVER** use direct fetch/router calls in React components
- **ALWAYS** use custom hooks as data access layer
- **STRUCTURE**: hooks/use[Entity][Action].ts (e.g., useSpecialties.ts)
- **BENEFITS**: Route abstraction, error handling, loading states
- **RESPONSIBILITY**: Components only handle UI, hooks handle all data operations

### Database Model
```
specialties table:
- id (bigint, primary key)
- name (varchar(100), unique)
- description (text, nullable)
- status (enum: active, inactive)
- created_at (timestamp)
- updated_at (timestamp)
```

### Dependencies
- No dependencies on other features (can be developed independently)
- Should integrate with professional module later (professionals have specialties)

## Implementation Strategy

### MVP Scope
- Phase 1: Setup (database migration, model, factory)
- Phase 2: Backend (controller, validation, service)
- Phase 3: Frontend (components, hooks, form)
- Phase 4: Tests

### Parallel Opportunities
- Backend (controller, service, validation) can be developed in parallel with frontend (components, hooks)
- Each CRUD operation is independent

