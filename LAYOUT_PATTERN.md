# Patrón de Layout Base - Aranto Medical System

## Estructura Estándar de Páginas

Todas las páginas del sistema deben seguir el patrón establecido en `cash-register/dashboard.tsx`:

### 1. Estructura Base Requerida

```tsx
import { Head } from '@inertiajs/react';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Nombre del Módulo',
        href: '/modulo',
    },
];

export default function ComponentName(props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Título de la Página" />
            
            <div className="space-y-6">
                <HeadingSmall
                    title="Título Principal"
                    description="Descripción de la funcionalidad"
                />
                
                {/* Contenido de la página */}
            </div>
        </AppLayout>
    );
}
```

### 2. Elementos Obligatorios

1. **AppLayout**: Layout principal con sidebar y navegación
2. **Head**: Meta información de la página
3. **HeadingSmall**: Encabezado estándar con título y descripción
4. **breadcrumbs**: Navegación breadcrumb apropiada
5. **div con space-y-6**: Contenedor principal con espaciado

### 3. Patrones de Breadcrumbs

#### Sistema Médico
```tsx
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sistema Médico', href: '/medical' },
    { title: 'Tipos de Seguro', href: '/medical/insurance-types' }, // opcional para sub-páginas
];
```

#### Tesorería
```tsx
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Tesorería', href: '/cash-register' },
];
```

### 4. Convenciones de Naming

- **Head title**: "Nombre Módulo - Funcionalidad"
- **HeadingSmall title**: Título descriptivo del módulo
- **HeadingSmall description**: Breve descripción de la funcionalidad

### 5. Estructura de Contenido

El contenido dentro del `div className="space-y-6"` debe seguir este orden:

1. **Statistics Cards** (si aplica)
2. **Action Bar** con botones principales
3. **Main Content** (tabla, formulario, etc.)
4. **Modals** al final

### 6. Ejemplos por Módulo

#### Página Index (Listados)
- Statistics cards con métricas
- Botón de "Crear nuevo" en action bar
- DataTable con datos paginados

#### Página Create/Edit (Formularios)
- Form container
- Validation messages
- Save/Cancel buttons

#### Página Show (Detalle)
- Information cards
- Related data sections
- Action buttons

### 7. Navegación en Sidebar

#### Regla Obligatoria para Nuevos Módulos
**TODO MÓDULO QUE TENGA SU PROPIO DASHBOARD O COMPONENTES PRINCIPALES DEBE TENER ENTRADA EN EL SIDEBAR**

#### Estructura del Sidebar (`/resources/js/components/app-sidebar.tsx`)

```tsx
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Tesorería',
        href: { url: '/cash-register', method: 'get' },
        icon: DollarSign,
    },
    {
        title: 'Sistema Médico',
        href: { url: '/medical', method: 'get' },
        icon: Stethoscope,
    },
    // Agregar nuevos módulos aquí siguiendo el mismo patrón
];
```

#### Patrón para Nuevos Módulos en Sidebar

1. **Importar icono apropiado** de lucide-react
2. **Agregar entrada** en `mainNavItems[]`
3. **Usar convención de nombres** descriptiva
4. **Apuntar al dashboard** del módulo (`/modulo` no `/modulo/subpagina`)
5. **Mantener orden lógico** de módulos por importancia

#### Ejemplo de Implementación

```tsx
// 1. Importar icono
import { BookOpen, Folder, LayoutGrid, DollarSign, Stethoscope, Settings } from 'lucide-react';

// 2. Agregar al array de navegación
const mainNavItems: NavItem[] = [
    // ... otros items
    {
        title: 'Configuración',           // Nombre descriptivo
        href: { url: '/settings', method: 'get' },  // Apunta al dashboard del módulo
        icon: Settings,                   // Icono representativo
    },
];
```

#### Iconos Recomendados por Módulo

- **Tesorería/Finanzas**: `DollarSign`, `CreditCard`, `Banknote`
- **Médico/Salud**: `Stethoscope`, `Heart`, `Activity`
- **Usuarios/Pacientes**: `Users`, `UserCheck`, `User`
- **Configuración**: `Settings`, `Cog`, `Sliders`
- **Reportes**: `BarChart`, `PieChart`, `TrendingUp`
- **Inventario**: `Package`, `Archive`, `Boxes`
- **Seguridad**: `Shield`, `Lock`, `Key`

#### Criterios para Inclusión en Sidebar

✅ **SÍ incluir si:**
- Es un módulo principal del sistema
- Tiene su propio dashboard/página principal
- Los usuarios necesitan acceso frecuente
- Contiene múltiples funcionalidades relacionadas

❌ **NO incluir si:**
- Es una sub-funcionalidad de otro módulo
- Es una página de configuración menor
- Es solo un modal o componente auxiliar
- Tiene acceso muy esporádico

#### Ejemplo Real: Implementación del Sistema Médico

```tsx
// 1. Se agregó el icono Stethoscope al import
import { BookOpen, Folder, LayoutGrid, DollarSign, Stethoscope } from 'lucide-react';

// 2. Se agregó la entrada en mainNavItems
{
    title: 'Sistema Médico',              // Nombre claro y descriptivo
    href: { url: '/medical', method: 'get' },  // Apunta al dashboard médico
    icon: Stethoscope,                    // Icono representativo del área médica
},

// 3. Se creó Dashboard.tsx como página principal del módulo
// 4. Desde el dashboard se puede navegar a sub-módulos:
//    - /medical/patients
//    - /medical/insurance-types  
//    - /medical/professionals
//    - /medical/service-categories
```

#### Jerarquía de Navegación Establecida

```
Sidebar → Dashboard del Módulo → Sub-módulos → Funciones específicas

Ejemplo:
[Sidebar] Sistema Médico → /medical (Dashboard)
                        ├── /medical/patients (Sub-módulo)
                        │   ├── /medical/patients/create
                        │   ├── /medical/patients/{id}
                        │   └── /medical/patients/{id}/edit
                        ├── /medical/insurance-types (Sub-módulo)
                        │   ├── /medical/insurance-types/create
                        │   ├── /medical/insurance-types/{id}
                        │   └── /medical/insurance-types/{id}/edit
                        └── ... otros sub-módulos
```

**Regla de Oro**: El sidebar SIEMPRE apunta al dashboard principal del módulo, nunca directamente a sub-funcionalidades.

#### Control de Acceso por Roles en Sidebar

**REGLA CRÍTICA**: Los items del sidebar DEBEN filtrarse según los permisos del usuario autenticado.

```tsx
// Ejemplo de implementación con roles/permisos
const getFilteredNavItems = (userPermissions: string[]): NavItem[] => {
    const allNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
            permission: null, // Siempre visible
        },
        {
            title: 'Tesorería',
            href: { url: '/cash-register', method: 'get' },
            icon: DollarSign,
            permission: 'access-treasury', // Requiere permiso específico
        },
        {
            title: 'Sistema Médico',
            href: { url: '/medical', method: 'get' },
            icon: Stethoscope,
            permission: 'access-medical-system',
        },
    ];

    return allNavItems.filter(item => 
        !item.permission || userPermissions.includes(item.permission)
    );
};
```

#### Estructura de Permisos Recomendada

```
Permisos de Módulos Principales:
- access-treasury          (Ver módulo de tesorería)
- access-medical-system    (Ver módulo médico)
- access-reports          (Ver módulo de reportes)
- access-settings         (Ver configuración)

Permisos Granulares (por sub-módulo):
- medical.patients.view    (Ver pacientes)
- medical.patients.create  (Crear pacientes)
- medical.insurance.manage (Gestionar seguros)
- treasury.transactions    (Gestionar transacciones)
```

#### Implementación en AppSidebar

```tsx
// app-sidebar.tsx modificado con control de acceso
export function AppSidebar() {
    const { auth } = usePage<PageProps>(); // Obtener usuario autenticado
    const userPermissions = auth.user.permissions || []; // Asumir que vienen del backend
    
    // Filtrar items según permisos del usuario
    const visibleNavItems = getFilteredNavItems(userPermissions);
    
    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* ... header ... */}
            <SidebarContent>
                <NavMain items={visibleNavItems} />
            </SidebarContent>
            {/* ... footer ... */}
        </Sidebar>
    );
}
```

#### Casos de Uso por Rol

```
Administrador:
✅ Dashboard, Tesorería, Sistema Médico, Reportes, Configuración

Cajero:
✅ Dashboard, Tesorería
❌ Sistema Médico, Configuración

Médico/Recepcionista:
✅ Dashboard, Sistema Médico
❌ Tesorería, Configuración

Solo Consulta:
✅ Dashboard, Reportes (solo lectura)
❌ Tesorería, Sistema Médico
```

#### Integración con Backend

El controlador debe enviar los permisos del usuario:

```php
// En el controlador que renderiza la página
return Inertia::render('Dashboard', [
    'auth' => [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'permissions' => $user->getAllPermissions()->pluck('name'), // Spatie Permission
            'roles' => $user->getRoleNames(),
        ]
    ]
]);
```

### 8. NO Usar

❌ **No usar layouts personalizados** como `MedicalLayout`
❌ **No duplicar** la estructura de navegación
❌ **No cambiar** el patrón de breadcrumbs establecido
❌ **No crear** módulos sin entrada en sidebar (si califican según criterios)
❌ **No usar iconos inconsistentes** - mantener la familia lucide-react
❌ **No mostrar módulos** sin verificar permisos del usuario
❌ **No hardcodear** la navegación - siempre filtrar por permisos

### 9. Componentes Compartidos Disponibles

- `HeadingSmall`: Para encabezados de página
- `DataTable`: Para listados con paginación
- Components shadcn/ui para formularios y UI
- Modals y dialogs estándar

Este patrón asegura consistencia visual y funcional en toda la aplicación.