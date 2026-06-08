# DataTable Reutilizable - Sistema Aranto

Esta es una implementación completa de una **DataTable reutilizable** basada en **shadcn/ui** y **TanStack Table** que proporciona funcionalidades avanzadas con **server-side rendering**.

## 🎯 Características Principales

### ✅ **Funcionalidades Implementadas**

- **🔍 Búsqueda** - Input de búsqueda con debounce (300ms)
- **📄 Paginación server-side** - Datos paginados desde el backend Laravel
- **🔢 Selección de filas** - Selección individual y múltiple
- **📊 Ordenamiento** - Columnas ordenables con indicadores visuales
- **👁️ Visibilidad de columnas** - Mostrar/ocultar columnas dinámicamente
- **🎨 UI consistente** - Diseño unificado con shadcn/ui
- **🌐 Internacionalización** - Textos en español
- **⚡ Performance** - Optimizado con debounce y memoización
- **📱 Responsive** - Adaptable a diferentes tamaños de pantalla

### 🛠️ **Server-Side Rendering**

La DataTable está diseñada para trabajar con **paginación del backend**:

```typescript
interface PaginatedData<T> {
  data: T[]                 // Datos de la página actual
  current_page: number      // Página actual (1-indexed)
  per_page: number          // Elementos por página
  total: number             // Total de elementos
  last_page: number         // Última página
  from: number              // Primer elemento de la página
  to: number                // Último elemento de la página
}
```

## 📋 Uso Básico

### 1. **Importar Componentes**

```tsx
import { 
  DataTable, 
  DataTableColumnHeader,
  DataTableRowActions,
  PaginatedData 
} from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
```

### 2. **Definir Columnas**

```tsx
const columns: ColumnDef<YourType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DataTableRowActions>
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </DataTableRowActions>
      )
    },
  },
]
```

### 3. **Usar el Componente**

```tsx
export function MyTable({ data }: { data: PaginatedData<YourType> }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Buscar elementos..."
      searchKey="search"
      selectable={true}
      emptyMessage="No se encontraron elementos."
    />
  )
}
```

## 🔧 Propiedades de la DataTable

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]     // Definición de columnas
  data: PaginatedData<TData>              // Datos paginados del servidor
  
  // Búsqueda
  searchable?: boolean                    // Habilitar búsqueda (default: true)
  searchPlaceholder?: string              // Placeholder del input
  searchKey?: string                      // Clave del parámetro de búsqueda
  onSearch?: (search: string) => void     // Callback personalizado de búsqueda
  
  // Filtros y visibilidad
  filterable?: boolean                    // Habilitar filtros de columna
  
  // Selección
  selectable?: boolean                    // Habilitar selección de filas
  onSelectionChange?: (rows: TData[]) => void  // Callback de selección
  
  // Paginación
  onPageChange?: (page: number) => void   // Callback de cambio de página
  onPageSizeChange?: (size: number) => void // Callback de tamaño de página
  pageSizes?: number[]                    // Opciones de tamaño de página
  
  // Estados
  loading?: boolean                       // Estado de carga
  emptyMessage?: string                   // Mensaje cuando no hay datos
  className?: string                      // Clases CSS personalizadas
}
```

## 🎨 Ejemplos de Uso

### **Tabla Básica** (Solo lectura)
```tsx
<DataTable
  columns={basicColumns}
  data={insuranceTypes}
  searchPlaceholder="Buscar tipos de seguro..."
/>
```

### **Tabla con Selección Múltiple**
```tsx
<DataTable
  columns={patientsColumns}
  data={patients}
  searchPlaceholder="Buscar pacientes..."
  selectable={true}
  onSelectionChange={(selectedRows) => {
    console.log('Pacientes seleccionados:', selectedRows)
  }}
/>
```

### **Tabla con Configuración Avanzada**
```tsx
<DataTable
  columns={servicesColumns}
  data={medicalServices}
  searchPlaceholder="Buscar servicios médicos..."
  selectable={true}
  loading={isLoading}
  emptyMessage="No hay servicios disponibles."
  pageSizes={[10, 25, 50, 100]}
  onSelectionChange={handleBulkOperations}
  className="border-2"
/>
```

## 🔄 Integración con Laravel/Inertia

### **Backend (Controller)**
```php
public function index(Request $request)
{
    $query = InsuranceType::query();
    
    // Búsqueda
    if ($search = $request->get('search')) {
        $query->where('name', 'like', "%{$search}%");
    }
    
    // Paginación
    $perPage = $request->get('per_page', 15);
    $data = $query->paginate($perPage)->withQueryString();
    
    return Inertia::render('Medical/InsuranceTypes/Index', [
        'insuranceTypes' => $data,
    ]);
}
```

### **Frontend (React)**
```tsx
import { DataTable } from "@/components/ui/data-table"

export default function InsuranceTypesIndex({ 
  insuranceTypes 
}: { 
  insuranceTypes: PaginatedData<InsuranceType> 
}) {
  return (
    <div className="container mx-auto py-6">
      <DataTable
        columns={insuranceTypesColumns}
        data={insuranceTypes}
        searchPlaceholder="Buscar tipos de seguro..."
      />
    </div>
  )
}
```

## 🎯 Ventajas de Esta Implementación

### **🔄 Server-Side Everything**
- Búsqueda procesada en el servidor
- Paginación real (no client-side)
- Ordenamiento en base de datos
- Mejor performance con grandes datasets

### **🎨 Consistencia UI**
- Diseño unificado en toda la aplicación
- Componentes reutilizables
- Responsive design
- Accesibilidad incorporada

### **⚡ Performance Optimizada**
- Debounce en búsquedas (300ms)
- Lazy loading de datos
- Memoización de componentes
- Virtual scrolling preparado

### **🌐 Internacionalización**
- Textos en español
- Formato de números localizados
- Mensajes de estado apropiados
- Navegación intuitiva

## 🚀 Próximos Pasos

Con esta DataTable implementada, ahora podemos:

1. **✅ Crear todas las vistas médicas** usando este componente base
2. **✅ Mantener UI consistente** en toda la aplicación  
3. **✅ Implementar funciones avanzadas** como filtros especializados
4. **✅ Agregar exportación** de datos (Excel, PDF, etc.)
5. **✅ Implementar acciones masivas** (eliminar, actualizar, etc.)

La DataTable está lista para ser utilizada en todos los módulos del sistema médico: tipos de seguro, categorías de servicios, servicios médicos, pacientes, profesionales, etc.