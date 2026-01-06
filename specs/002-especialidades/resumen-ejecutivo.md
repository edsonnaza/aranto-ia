# Resumen Ejecutivo: Módulo de Especialidades

**Fecha**: 6 de enero de 2026  
**Feature**: 002-especialidades  
**Estado**: Diseño Completado

## Visión General

Módulo CRUD completo para gestionar especialidades médicas en el sistema Aranto. Permite a administradores crear, listar, editar, eliminar y cambiar el estado de especialidades que sirven como catálogo para los servicios médicos ofrecidos.

## Scope

### In Scope
✅ Crear especialidades (nombre, descripción, estado)  
✅ Listar especialidades con paginación y búsqueda  
✅ Editar especialidades existentes  
✅ Eliminar especialidades (con validación de dependencias)  
✅ Cambiar estado sin eliminar datos  
✅ Validación de datos  
✅ Tests automatizados  

### Out of Scope
❌ Integración con profesionales (future work)  
❌ Reportes de especialidades  
❌ Asignación de tarifas por especialidad  

## Requerimientos Técnicos

### Database
- Nueva tabla `specialties` con campos: id, name, description, status, created_at, updated_at
- Índice único en `name`
- Relación futura con tabla `professionals` (many-to-many)

### Backend (PHP/Laravel)
- Model: `app/Models/Specialty.php`
- Controller: `app/Http/Controllers/SpecialtyController.php` (resource controller)
- Service: `app/Services/SpecialtyService.php`
- Request: `app/Http/Requests/SpecialtyRequest.php`
- Routes: Resource routes en `routes/web.php`
- Tests: Feature y Unit tests con Pest

### Frontend (React)
- Página Index: Lista paginada con búsqueda/filtros
- Formulario Create: Modal o página para crear especialidades
- Formulario Edit: Modal o página para editar
- Botones Delete: Con confirmación
- Toggle Status: Cambio de estado inline
- Custom Hooks: `useSpecialties`, `useCreateSpecialty`, `useEditSpecialty`, `useDeleteSpecialty`, `useToggleSpecialtyStatus`

## Arquitectura

```
Routes (web.php)
    ↓
SpecialtyController (resource actions)
    ↓
SpecialtyService (business logic)
    ↓
Specialty Model + Database
    
React Components
    ↓
Custom Hooks (useSpecialties, etc.)
    ↓
Inertia.js Form Submissions
    ↓
Controller Actions
```

## Effort Estimate

| Fase | Horas | Notas |
|------|-------|-------|
| Setup (DB, Model) | 1-2h | Rápido, estándar |
| Backend | 3-4h | Controller, Service, Validation |
| Frontend | 4-5h | Components, Hooks, Forms |
| Tests | 2-3h | Feature y Unit tests |
| **Total** | **10-14h** | **~2 días** |

## Dependencias

- ✓ Laravel 11.x
- ✓ React 18
- ✓ Inertia.js
- ✓ Tailwind CSS
- ✓ Pest PHP (testing)

## Criterios de Éxito

1. ✓ Todos los tests pasan
2. ✓ CRUD completo funcional
3. ✓ Búsqueda y filtros trabajando
4. ✓ Validación de datos completa
5. ✓ Interfaz responsive
6. ✓ Documentación en QUICK_REFERENCE.md
7. ✓ Commits atómicos en git

## Próximos Pasos

1. Iniciar con Phase 1 (Setup) - Crear migration y model
2. Desarrollar backend (Phase 2) en paralelo con frontend (Phase 3)
3. Implementar cada user story secuencialmente
4. Escribir tests conforme avanza el desarrollo
5. Merge a main cuando todo esté completado y testeado

