# Aranto-ia Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-08

## Active Technologies

- PHP 8.2+ con Laravel 10.x + Laravel, Inertia.js, React 18, Tailwind CSS, MySQL 8.0 (001-modulo-caja)

## Architecture Constraints - CRITICAL RESTRICTIONS

### NO API Controllers - Use Inertia.js Pattern ONLY
- **NEVER** create API controllers (app/Http/Controllers/Api/*)
- **ALWAYS** use Laravel controllers that render Inertia responses
- **PATTERN**: Follow existing controllers like PatientController, InsuranceTypeController
- **ROUTING**: Use web.php and included files (medical.php, cashregister.php, settings.php)
- **FRONTEND**: React components receive data as props from Inertia
- **DATA EXCHANGE**: Use Inertia form submissions, not AJAX/fetch to API endpoints

### Custom Hooks Pattern - MANDATORY DATA ACCESS
- **NEVER** use direct fetch/router calls in React components
- **ALWAYS** use custom hooks as data access layer
- **PATTERN**: Frontend -> Hooks -> Backend -> Database
- **STRUCTURE**: hooks/use[Entity][Action].ts (e.g., useServiceRequests.ts, usePatients.ts)
- **BENEFITS**: Route abstraction, error handling, loading states, cache management
- **RESPONSIBILITY**: Components only handle UI, hooks handle all data operations

### Custom Hooks Examples:
```typescript
// ✅ CORRECT - Component uses hook
const ServiceRequestsIndex = () => {
  const { data, loading, error, refresh } = useServiceRequests()
  // Only UI logic here
}

// ✅ CORRECT - Hook handles all data logic
const useServiceRequests = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  
  const fetchData = () => {
    router.get('/medical/service-requests', ...)
  }
  
  return { data, loading, error, refresh: fetchData }
}

// ❌ INCORRECT - Direct route calls in component
const ServiceRequestsIndex = () => {
  const handleSubmit = () => {
    router.post('/medical/service-requests', data) // ❌ NO!
  }
}
```

### Correct Controller Pattern Example:
```php
public function index(): Response
{
    return Inertia::render('medical/patients/Index', [
        'patients' => Patient::paginate(20),
        'filters' => request()->only(['search', 'status'])
    ]);
}
```

### Route Structure Pattern:
- Main routes in web.php with require statements
- Medical routes in routes/medical.php
- Use Route::resource for CRUD operations
- Additional actions as named routes

## Project Structure

```text
app/
routes/
  web.php (main file with requires)
  medical.php 
  cashregister.php
  settings.php
resources/js/
tests/
```

## Commands

# Add commands for PHP 8.2+ con Laravel 10.x

## Code Style

PHP 8.2+ con Laravel 10.x: Follow standard conventions

## Recent Changes

- 001-modulo-caja: Added PHP 8.2+ con Laravel 10.x + Laravel, Inertia.js, React 18, Tailwind CSS, MySQL 8.0
- Frontend architecture complete: Zustand stores, React Hook Form + Zod validation, Vitest testing
- Security implementation: Spatie Permission with 4 roles and 22 granular permissions
- API Controllers complete: 25 endpoints with full CRUD and audit functionality (T031-T050)
- Ready for React components implementation (T051-T080)

## Commit Guidelines

- Commit at completion of each task phase (T001-T015, T016-T030, etc.)
- Format: "feat(module): brief description"
- Atomic commits: one complete functionality per commit
- Always verify no errors before committing
- Include updated documentation files

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
