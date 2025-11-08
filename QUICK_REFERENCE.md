# 🚀 Quick Reference - CRUD Aranto-ia

## 📋 **Comandos Rápidos**

### **1. Crear CRUD Completo**
```bash
# 1. Crear modelo con migración y controlador
docker compose exec app php artisan make:model NombreModelo -mcr

# 2. Ejecutar migración
docker compose exec app php artisan migrate

# 3. Agregar rutas en routes/medical.php
Route::resource('nombre-plural', NombreModeloController::class);
```

### **2. Estructura de Archivos**
```
app/
├── app/Http/Controllers/NombreModeloController.php
├── app/Models/NombreModelo.php
├── database/migrations/xxxx_create_nombre_modelos_table.php
└── resources/js/
    ├── types/medical.ts (agregar interfaces)
    └── pages/medical/nombre-plural/
        ├── Index.tsx
        ├── Create.tsx
        ├── Edit.tsx
        └── Show.tsx
```

## 🏗️ **Template Rápido**

### **Controlador Base**
```php
class NombreModeloController extends Controller
{
    public function index(): Response
    {
        $items = NombreModelo::latest()->paginate(10)->withQueryString();
        $stats = ['total' => NombreModelo::count()];
        
        return Inertia::render('medical/nombre-plural/Index', [
            'items' => $items,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:tabla',
            'active' => 'required|boolean',
        ]);

        NombreModelo::create($validated);

        return redirect()
            ->route('medical.nombre-plural.index')
            ->with('message', 'Creado exitosamente');
    }

    public function update(Request $request, NombreModelo $modelo): RedirectResponse
    {
        // Similar a store pero con Rule::unique()->ignore($modelo)
        $modelo->update($validated);
        return redirect()->route('...')->with('message', 'Actualizado');
    }

    public function destroy(NombreModelo $modelo): RedirectResponse
    {
        $modelo->delete();
        return redirect()->route('...')->with('message', 'Eliminado');
    }
}
```

### **Modelo Base**
```php
class NombreModelo extends Model
{
    protected $fillable = ['name', 'description', 'active'];
    
    protected $casts = [
        'active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
```

### **TypeScript Types**
```typescript
// En resources/js/types/medical.ts
export interface NombreModelo {
  id: number
  name: string
  description?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface NombreModeloFormData {
  name: string
  description?: string
  active: boolean
}
```

### **Index Component Base**
```tsx
import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { PlusCircle, Eye, Edit, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AppLayout from '@/layouts/app-layout'

export default function NombreModeloIndex({ items, stats }) {
  const columns: ColumnDef<NombreModelo>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }) => {
        const active = row.getValue('active') as boolean
        return <Badge variant={active ? 'default' : 'secondary'}>
          {active ? 'Activo' : 'Inactivo'}
        </Badge>
      }
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/medical/nombre-plural/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )
    }
  ]

  return (
    <AppLayout>
      <Head title="Nombre Plural" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1>Nombre Plural</h1>
          <Button asChild>
            <Link href="/medical/nombre-plural/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nuevo
            </Link>
          </Button>
        </div>
        
        <DataTable
          data={items}
          columns={columns}
          searchPlaceholder="Buscar..."
          searchKey="search"
        />
      </div>
    </AppLayout>
  )
}
```

### **Form Component Base**
```tsx
import React from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function NombreModeloCreate() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/medical/nombre-plural', {
      preserveScroll: true,
      onSuccess: () => toast.success('Creado correctamente'),
      onError: () => toast.error('Error al crear'),
    })
  }

  return (
    <AppLayout>
      <Head title="Crear" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
            required
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={data.active}
            onCheckedChange={(checked) => setData('active', checked as boolean)}
          />
          <Label htmlFor="active">Activo</Label>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href="/medical/nombre-plural">Volver</Link>
          </Button>
          <Button type="submit" disabled={processing}>
            {processing ? 'Guardando...' : 'Crear'}
          </Button>
        </div>
      </form>
    </AppLayout>
  )
}
```

## 🎯 **Flash Messages**

### **En Controlador**
```php
// Éxito
return redirect()->route('...')->with('message', 'Operación exitosa');

// Error  
return redirect()->route('...')->with('error', 'Error en la operación');
```

### **En Componente**
```tsx
import { toast } from 'sonner'

// Éxito manual
toast.success('Mensaje de éxito')

// Error manual
toast.error('Mensaje de error')

// En callbacks de Inertia
post('/ruta', {
  onSuccess: () => toast.success('Éxito'),
  onError: () => toast.error('Error'),
})
```

## 🔧 **Utilidades**

### **Comandos Docker**
```bash
# Entrar al contenedor
docker compose exec app bash

# Ver logs
docker compose logs app --tail=50

# Reiniciar servicios  
docker compose restart

# Limpiar cache Laravel
docker compose exec app php artisan optimize:clear
```

### **Desarrollo Frontend**
```bash
# Iniciar Vite
docker compose exec app npm run dev

# Build producción
docker compose exec app npm run build

# Verificar tipos
docker compose exec app npm run type-check
```

---

## ✅ **Checklist CRUD**

- [ ] Migración creada y ejecutada
- [ ] Modelo con fillable y casts  
- [ ] Controlador con métodos resource
- [ ] Rutas agregadas
- [ ] Types TypeScript definidos
- [ ] Componentes React creados
- [ ] Flash messages funcionando
- [ ] DataTable con searchKey
- [ ] Validaciones client/server
- [ ] Navegación breadcrumbs

---

*Usa esta referencia como base para crear nuevos CRUDs rápidamente.*