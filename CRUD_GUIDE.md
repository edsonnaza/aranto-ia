# 📋 Guía Completa para CRUD en Aranto-ia

## 🎯 **Estructura Base del Sistema**

### **Stack Tecnológico:**
- **Backend**: Laravel 10.x + Inertia.js
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Components**: shadcn/ui + Lucide Icons
- **State**: Zustand + React Hook Form + Zod
- **Database**: MySQL 8.0
- **Development**: Docker + Vite Hot Reload

---

## 🏗️ **Arquitectura del CRUD**

### **1. Estructura de Directorios**

```
app/
├── app/
│   ├── Http/Controllers/         # Controladores Laravel
│   ├── Models/                   # Modelos Eloquent
│   └── Services/                 # Lógica de negocio
├── database/
│   ├── migrations/               # Migraciones de BD
│   └── seeders/                  # Datos iniciales
└── resources/js/
    ├── components/ui/            # Componentes base (shadcn/ui)
    ├── pages/medical/            # Páginas por módulo
    │   ├── insurance-types/      # Ejemplo: Insurance Types
    │   │   ├── Index.tsx         # Listado con DataTable
    │   │   ├── Create.tsx        # Formulario de creación
    │   │   ├── Edit.tsx          # Formulario de edición
    │   │   └── Show.tsx          # Vista detallada
    │   ├── patients/             # CRUD de Pacientes
    │   └── professionals/        # CRUD de Profesionales
    ├── types/                    # Definiciones TypeScript
    │   ├── medical.ts            # Types del módulo médico
    │   └── index.ts              # Types generales
    └── providers/                # Proveedores globales
        └── FlashMessageProvider.tsx # Sistema de toasts
```

---

## 🔄 **Pasos para Crear un CRUD Completo**

### **PASO 1: Base de Datos**

#### **1.1 Crear Migración**
```bash
docker compose exec app php artisan make:migration create_[table_name]_table
```

#### **1.2 Definir Esquema** 
```php
// database/migrations/xxxx_create_example_table.php
Schema::create('examples', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100);
    $table->text('description')->nullable();
    $table->boolean('active')->default(true);
    $table->timestamps();
    
    // Índices
    $table->index('name');
    $table->index('active');
});
```

#### **1.3 Ejecutar Migración**
```bash
docker compose exec app php artisan migrate
```

---

### **PASO 2: Modelo Eloquent**

#### **2.1 Crear Modelo**
```bash
docker compose exec app php artisan make:model Example
```

#### **2.2 Configurar Modelo**
```php
// app/Models/Example.php
class Example extends Model
{
    protected $fillable = [
        'name',
        'description', 
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relaciones
    public function relatedModels(): HasMany
    {
        return $this->hasMany(RelatedModel::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
```

---

### **PASO 3: Controlador**

#### **3.1 Crear Controlador**
```bash
docker compose exec app php artisan make:controller ExampleController --resource
```

#### **3.2 Implementar Métodos**
```php
// app/Http/Controllers/ExampleController.php
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ExampleController extends Controller
{
    public function index(): Response
    {
        $examples = Example::query()
            ->when(request('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when(request('status'), function ($query, $status) {
                if ($status !== 'all') {
                    $query->where('active', $status === 'active');
                }
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $stats = [
            'total' => Example::count(),
            'active' => Example::where('active', true)->count(),
            'inactive' => Example::where('active', false)->count(),
        ];

        return Inertia::render('medical/examples/Index', [
            'examples' => $examples,
            'stats' => $stats,
            'filters' => request()->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('medical/examples/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:examples'],
            'description' => ['nullable', 'string', 'max:500'],
            'active' => ['required', 'boolean'],
        ]);

        Example::create($validated);

        return redirect()
            ->route('medical.examples.index')
            ->with('message', 'Ejemplo creado exitosamente.');
    }

    public function show(Example $example): Response
    {
        $example->loadCount(['relatedModels']);
        
        return Inertia::render('medical/examples/Show', [
            'example' => $example,
        ]);
    }

    public function edit(Example $example): Response
    {
        return Inertia::render('medical/examples/Edit', [
            'example' => $example,
        ]);
    }

    public function update(Request $request, Example $example): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('examples')->ignore($example)],
            'description' => ['nullable', 'string', 'max:500'],
            'active' => ['required', 'boolean'],
        ]);

        $example->update($validated);

        return redirect()
            ->route('medical.examples.index')
            ->with('message', 'Ejemplo actualizado exitosamente.');
    }

    public function destroy(Example $example): RedirectResponse
    {
        // Verificar dependencias
        if ($ejemplo->relatedModels()->exists()) {
            return redirect()
                ->route('medical.examples.index')
                ->with('error', 'No se puede eliminar porque tiene registros relacionados.');
        }

        $ejemplo->delete();

        return redirect()
            ->route('medical.examples.index')
            ->with('message', 'Ejemplo eliminado exitosamente.');
    }
}
```

---

### **PASO 4: Rutas**

#### **4.1 Definir Rutas** 
```php
// routes/medical.php
Route::prefix('medical')->name('medical.')->middleware(['auth', 'verified'])->group(function () {
    Route::resource('examples', ExampleController::class);
});
```

---

### **PASO 5: TypeScript Types**

#### **5.1 Definir Interfaces**
```typescript
// resources/js/types/medical.ts
export interface Example {
  id: number
  name: string
  description?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ExampleFormData {
  name: string
  description?: string
  active: boolean
}

export interface ExampleStats {
  total: number
  active: number
  inactive: number
}
```

---

### **PASO 6: Componentes React**

#### **6.1 Index Component (Listado)**
```tsx
// resources/js/pages/medical/examples/Index.tsx
import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { PlusCircle, Pencil, Eye, Trash2 } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, /* ... */ } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Example, PaginatedData, ExampleStats } from '@/types/medical'
import { type BreadcrumbItem } from '@/types'

interface ExamplesIndexProps {
  examples: PaginatedData<Example>
  stats: ExampleStats
  filters: { search?: string; status?: string }
}

export default function ExamplesIndex({ examples, stats, filters }: ExamplesIndexProps) {
  const handleDelete = (id: number) => {
    router.delete(`/medical/examples/${id}`, {
      preserveScroll: true,
      onSuccess: () => toast.success('Eliminado correctamente'),
      onError: () => toast.error('Error al eliminar'),
    })
  }

  const columns: ColumnDef<Example>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }) => {
        const active = row.getValue('active') as boolean
        return (
          <Badge variant={active ? 'default' : 'secondary'}>
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      },
    },
    // ... más columnas
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/medical/examples/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {/* ... más acciones */}
        </div>
      ),
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Ejemplos - Sistema Médico" />
      
      <div className="space-y-6">
        <HeadingSmall title="Ejemplos" description="Gestión de ejemplos" />
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          {/* ... más cards */}
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Ejemplos</CardTitle>
              <Button asChild>
                <Link href="/medical/examples/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Ejemplo
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={examples}
              columns={columns}
              searchPlaceholder="Buscar..."
              searchKey="search"
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
```

#### **6.2 Create Component**
```tsx
// resources/js/pages/medical/examples/Create.tsx
import React from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import HeadingSmall from '@/components/heading-small'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function ExamplesCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    post('/medical/examples', {
      preserveScroll: true,
      onSuccess: () => toast.success('Ejemplo creado correctamente'),
      onError: () => toast.error('Error al crear el ejemplo'),
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Crear Ejemplo" />
      
      <div className="space-y-6">
        <HeadingSmall title="Crear Ejemplo" />
        
        <Card>
          <CardHeader>
            <CardTitle>Información del Ejemplo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Nombre del ejemplo"
                  className={errors.name ? 'border-red-500' : ''}
                  required
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* ... más campos */}

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" asChild>
                  <Link href="/medical/examples">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Guardando...' : 'Crear Ejemplo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
```

#### **6.3 Edit Component**
Similar a Create pero con datos precargados y método PUT.

#### **6.4 Show Component**
Vista de solo lectura con detalles completos del registro.

---

## 🎨 **Componentes Estándar**

### **DataTable Props**
```typescript
interface DataTableProps<TData> {
  data: PaginatedData<TData>
  columns: ColumnDef<TData>[]
  searchPlaceholder?: string
  searchKey?: string
}
```

### **Flash Messages**
```typescript
// En controlador
return redirect()->route('...')->with('flash', [
    'success' => 'Mensaje de éxito',
    'error' => 'Mensaje de error'
]);
```

### **Breadcrumbs**
```typescript
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Sistema Médico', href: '/medical' },
  { title: 'Módulo', href: '/medical/module' },
  { title: 'Acción' }, // Sin href para página actual
]
```

---

## 🔧 **Herramientas de Desarrollo**

### **Comandos Útiles**
```bash
# Crear migración
docker compose exec app php artisan make:migration create_table_name

# Crear modelo con controlador y migración
docker compose exec app php artisan make:model ModelName -mcr

# Ejecutar migraciones
docker compose exec app php artisan migrate

# Rollback migración
docker compose exec app php artisan migrate:rollback

# Crear seeder
docker compose exec app php artisan make:seeder TableNameSeeder

# Limpiar cache
docker compose exec app php artisan optimize:clear
```

### **Verificación de Errores**
```bash
# Ver logs de Laravel
docker compose logs app --tail=50

# Verificar errores TypeScript
npm run type-check

# Ver errores en tiempo real
docker compose exec app tail -f storage/logs/laravel.log
```

---

## 📋 **Checklist para Nuevo CRUD**

- [ ] **Base de Datos**
  - [ ] Migración creada y ejecutada
  - [ ] Seeder con datos iniciales (opcional)

- [ ] **Backend**
  - [ ] Modelo con fillable y casts
  - [ ] Controlador con todos los métodos
  - [ ] Rutas configuradas
  - [ ] Validaciones implementadas

- [ ] **Frontend**
  - [ ] Types TypeScript definidos
  - [ ] Index component con DataTable
  - [ ] Create component con formulario
  - [ ] Edit component con datos precargados  
  - [ ] Show component de solo lectura

- [ ] **Integración**
  - [ ] Flash messages funcionando
  - [ ] Navegación entre páginas
  - [ ] Validaciones del cliente
  - [ ] Manejo de errores
  - [ ] Breadcrumbs configurados

- [ ] **Testing**
  - [ ] Todas las operaciones CRUD funcionan
  - [ ] Validaciones client/server
  - [ ] Mensajes de éxito/error
  - [ ] Responsive design
  - [ ] Performance optimizada

---

## 🎯 **Próximos Pasos**

1. **Completar Insurance Types**: Asegurar que todas las operaciones funcionen
2. **Patients CRUD**: Aplicar esta estructura
3. **Professionals CRUD**: Implementar funcionalidades avanzadas
4. **Testing**: Crear tests unitarios y de integración
5. **Optimización**: Performance y UX improvements

---

*Esta guía debe mantenerse actualizada conforme el proyecto evolucione.*