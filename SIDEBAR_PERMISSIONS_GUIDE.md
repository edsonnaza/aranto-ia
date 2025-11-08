# Control de Acceso por Roles - Implementación en Sidebar

## 🎯 Objetivo
Implementar un sistema de control de acceso que filtre los módulos del sidebar según los permisos del usuario autenticado.

## 📋 Pasos para Implementación

### 1. Backend - Actualizar Respuesta de Inertia

Modificar los controladores para incluir los permisos del usuario:

```php
// En cualquier controlador que use Inertia
use Inertia\Inertia;

return Inertia::render('Dashboard', [
    'auth' => [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
            'roles' => $user->getRoleNames()->toArray(),
        ]
    ],
    // ... otros datos
]);
```

### 2. Frontend - Actualizar Types

Extender la interface User en `/resources/js/types/index.d.ts`:

```typescript
export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    permissions: string[];  // ⬅️ AGREGAR
    roles: string[];        // ⬅️ AGREGAR
    [key: string]: unknown;
}
```

### 3. Usar el Utility de Navegación

En `/resources/js/components/app-sidebar.tsx`:

```tsx
import { getNavigationForUser } from '@/utils/navigation';

export function AppSidebar() {
    const { auth } = usePage<PageProps>();
    
    // Filtrar navegación por permisos
    const mainNavItems = getNavigationForUser(auth.user.permissions || []);

    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* ... header ... */}
            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
            {/* ... footer ... */}
        </Sidebar>
    );
}
```

### 4. Configurar Permisos en Spatie Permission

```php
// En un seeder o comando artisan
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

// Crear permisos
Permission::create(['name' => 'access-treasury']);
Permission::create(['name' => 'access-medical-system']);
Permission::create(['name' => 'access-reports']);
Permission::create(['name' => 'access-settings']);
Permission::create(['name' => 'access-user-management']);

// Crear roles y asignar permisos
$superAdmin = Role::create(['name' => 'super-admin']);
$superAdmin->givePermissionTo([
    'access-treasury',
    'access-medical-system',
    'access-reports',
    'access-settings',
    'access-user-management'
]);

$cashier = Role::create(['name' => 'cashier']);
$cashier->givePermissionTo(['access-treasury']);

$medicalStaff = Role::create(['name' => 'medical-staff']);
$medicalStaff->givePermissionTo(['access-medical-system']);
```

## 🎭 Casos de Uso por Rol

| Rol | Dashboard | Tesorería | Médico | Reportes | Usuarios | Config |
|-----|-----------|-----------|---------|----------|----------|--------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Cajero** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Personal Médico** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Recepcionista** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Visualizador** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

## 🔐 Seguridad Adicional

### Middleware de Rutas

Crear middleware para verificar permisos en cada ruta:

```php
// app/Http/Middleware/CheckModulePermission.php
public function handle($request, Closure $next, $permission)
{
    if (!auth()->user()->can($permission)) {
        abort(403, 'No tienes permisos para acceder a este módulo');
    }
    return $next($request);
}

// En routes/web.php
Route::middleware(['auth', 'check.permission:access-medical-system'])
    ->prefix('medical')
    ->group(function () {
        Route::get('/', [MedicalController::class, 'dashboard']);
        // ... más rutas médicas
    });
```

### Verificación en Componentes

En componentes individuales:

```tsx
import { canAccessModule } from '@/utils/navigation';

export default function SomeComponent() {
    const { auth } = usePage<PageProps>();
    
    // Verificar acceso antes de mostrar contenido sensible
    const canViewMedical = canAccessModule(auth.user.permissions, 'MEDICAL');
    
    return (
        <div>
            {canViewMedical && (
                <Link href="/medical">Ver Sistema Médico</Link>
            )}
        </div>
    );
}
```

## ⚡ Beneficios

1. **Seguridad**: Solo usuarios autorizados ven módulos permitidos
2. **UX Mejorado**: Navegación limpia sin opciones inaccesibles  
3. **Mantenible**: Permisos centralizados y fáciles de modificar
4. **Escalable**: Fácil agregar nuevos módulos y permisos
5. **Consistente**: Misma lógica en toda la aplicación

## 🚨 Importante

- **Backend SIEMPRE debe validar** permisos en controladores
- **Frontend solo mejora UX** - no es seguridad real
- **Usar middleware** en todas las rutas sensibles
- **Probar todos los roles** antes de deploy