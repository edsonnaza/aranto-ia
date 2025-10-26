# Arquitectura Frontend - Módulo de Caja Aranto IA

## Stack Tecnológico

### Core
- **React 18** + **Inertia.js** + **Laravel 10.x**
- **TypeScript** (jsconfig.json configurado)
- **Tailwind CSS** + **shadcn/ui**
- **Vite** (build tool)

### Estado y Lógica
- **Zustand** - Estado global moderno y simple
- **React Hook Form + Zod** - Validación robusta de formularios
- **TanStack Query** - Cache y sincronización de datos del servidor

### Testing
- **Backend**: PHPUnit (Laravel estándar)
- **Frontend**: Vitest + Testing Library (mejor integración con Vite)

### Manejo de Errores y Notificaciones
- **Error Boundaries** - Captura de errores de componentes
- **shadcn/ui Toast** - Notificaciones consistentes
- **Backend Response Standard** - Respuestas estandarizadas (200, 400, 500, etc.)

## Estructura de Capas

```
resources/js/
├── Components/           # Componentes reutilizables UI
│   ├── ui/              # shadcn/ui components
│   ├── forms/           # Componentes de formularios
│   ├── layout/          # Layout components
│   └── shared/          # Componentes compartidos
├── Pages/               # Páginas principales (Inertia)
│   ├── CashRegister/    # Módulo de caja
│   ├── Dashboard/       # Dashboard principal
│   └── Auth/            # Autenticación
├── Hooks/               # Custom hooks para lógica de estado
│   ├── api/             # Hooks para llamadas API
│   ├── forms/           # Hooks para manejo de formularios
│   └── utils/           # Hooks de utilidades
├── Services/            # Llamadas API y lógica de negocio
│   ├── api/             # Servicios de API
│   ├── validation/      # Esquemas de validación Zod
│   └── utils/           # Utilidades de servicios
├── Stores/              # Estado global (Zustand)
│   ├── cashRegister.js  # Estado del módulo de caja
│   ├── auth.js          # Estado de autenticación
│   └── notifications.js # Estado de notificaciones
├── Types/               # Definiciones TypeScript
├── Utils/               # Utilidades y helpers
└── Constants/           # Constantes y configuraciones
```

## Principios Arquitectónicos

### 1. Single Responsibility Principle
- Cada componente tiene una responsabilidad específica
- Hooks separados para lógica de estado vs UI
- Servicios dedicados para cada dominio de negocio

### 2. Flujo de Datos Unidireccional
```
API ← Services ← Hooks ← Components ← Pages
```

### 3. Patrones de Diseño

#### Container/Presentational
- **Container Components**: Manejan lógica y estado
- **Presentational Components**: Solo renderizan UI

#### Custom Hooks
- Reutilización de lógica de estado
- Separación de concerns
- Testing más fácil

#### Compound Components
- Componentes complejos con sub-componentes
- API flexible y componible

#### Render Props/Children as Function
- Máxima flexibilidad en composición
- Inversión de control

## Estándares de Respuesta del Backend

### Estructura de Respuesta Estandarizada
```php
// 200 - Éxito
{
    "success": true,
    "data": {...},
    "message": "Operación exitosa"
}

// 400 - Error de validación
{
    "success": false,
    "errors": {
        "field": ["Error message"]
    },
    "message": "Datos de entrada inválidos"
}

// 500 - Error del servidor
{
    "success": false,
    "message": "Error interno del servidor",
    "error_code": "INTERNAL_ERROR"
}
```

## Manejo de Permisos y Roles

### Decisión Pendiente
- **Opción A**: Laravel Breeze básico + implementación custom
- **Opción B**: Laravel Starter Kit con sidebar
- **Permisos**: Considerar Laravel Spatie Permission

### Middleware de Seguridad
- Autenticación en todas las rutas protegidas
- Validación de permisos por rol
- Rate limiting en APIs críticas

## Componentes de UI

### Layout Base
- Sidebar navigation (si se usa starter kit)
- Header con usuario y notificaciones
- Breadcrumbs para navegación
- Footer con información del sistema

### Módulo de Caja - Componentes Principales
- `CashRegisterDashboard` - Vista principal
- `CashRegisterSession` - Manejo de sesiones
- `PaymentForm` - Formulario de pagos
- `TransactionList` - Lista de transacciones
- `AuditReports` - Reportes de auditoría

## Estado Global (Zustand)

### Cash Register Store
```javascript
interface CashRegisterState {
  activeSession: CashRegisterSession | null;
  transactions: Transaction[];
  summary: SessionSummary;
  isLoading: boolean;
  error: string | null;
}
```

### Notification Store
```javascript
interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}
```

## Testing Strategy

### Backend (PHPUnit)
- Unit tests para servicios
- Feature tests para endpoints
- Database tests con RefreshDatabase

### Frontend (Vitest + Testing Library)
- Unit tests para hooks y utilidades
- Integration tests para componentes
- E2E tests para flujos críticos

## Convenciones de Código

### Naming
- **Componentes**: PascalCase (CashRegisterDashboard)
- **Hooks**: camelCase con prefijo use (useCashRegister)
- **Services**: camelCase (cashRegisterService)
- **Stores**: camelCase (cashRegisterStore)

### Estructura de Archivos
- Un componente por archivo
- Index.js para exports centralizados
- Tests junto al archivo (.test.js)

### TypeScript
- Interfaces para props de componentes
- Types para datos del backend
- Strict mode habilitado

---

**Última actualización**: 25 de octubre de 2025
**Versión**: 1.0
**Proyecto**: Aranto IA - Módulo de Caja