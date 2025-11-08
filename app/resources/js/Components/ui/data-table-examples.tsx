/**
 * DataTable Usage Examples
 * 
 * This file demonstrates how to use the reusable DataTable component
 * with different scenarios commonly found in the medical system.
 */

import { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader, DataTableRowActions, PaginatedData } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react"

// Example 1: Insurance Types Table
export interface InsuranceType {
  id: number
  name: string
  coverage_percentage: number
  is_active: boolean
  created_at: string
  patients_count: number
}

export const insuranceTypesColumns: ColumnDef<InsuranceType>[] = [
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
    accessorKey: "coverage_percentage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cobertura %" />
    ),
    cell: ({ row }) => {
      const percentage = parseFloat(row.getValue("coverage_percentage"))
      return (
        <div className="text-right font-mono">
          {percentage.toFixed(1)}%
        </div>
      )
    },
  },
  {
    accessorKey: "patients_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pacientes" />
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="secondary">
          {row.getValue("patients_count")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active")
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const insuranceType = row.original

      return (
        <DataTableRowActions>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DataTableRowActions>
      )
    },
  },
]

// Example usage component for Insurance Types
export function InsuranceTypesTable({ 
  data 
}: { 
  data: PaginatedData<InsuranceType> 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tipos de Seguro</h2>
          <p className="text-muted-foreground">
            Gestiona los tipos de seguro médico y sus coberturas.
          </p>
        </div>
        <Button>
          Nuevo Tipo de Seguro
        </Button>
      </div>
      
      <DataTable
        columns={insuranceTypesColumns}
        data={data}
        searchPlaceholder="Buscar tipos de seguro..."
        searchKey="search"
        emptyMessage="No se encontraron tipos de seguro."
      />
    </div>
  )
}

// Example 2: Patients Table (more complex with selection)
export interface Patient {
  id: number
  first_name: string
  last_name: string
  identification: string
  email: string
  phone: string
  insurance_type: {
    name: string
    coverage_percentage: number
  }
  is_active: boolean
  last_visit: string
}

export const patientsColumns: ColumnDef<Patient>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
        className="rounded"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="rounded"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre Completo" />
    ),
    cell: ({ row }) => {
      const patient = row.original
      return (
        <div className="flex flex-col">
          <div className="font-medium">
            {patient.first_name} {patient.last_name}
          </div>
          <div className="text-sm text-muted-foreground">
            {patient.identification}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "insurance_type",
    header: "Seguro",
    cell: ({ row }) => {
      const insuranceType = row.getValue("insurance_type") as Patient["insurance_type"]
      return (
        <div className="flex flex-col">
          <div className="font-medium">{insuranceType.name}</div>
          <div className="text-sm text-muted-foreground">
            {insuranceType.coverage_percentage}% cobertura
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active")
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const patient = row.original

      return (
        <DataTableRowActions>
          <Button variant="outline" size="sm">
            Ver Historial
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Ver perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar información
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Programar cita
              </DropdownMenuItem>
              <DropdownMenuItem>
                Enviar mensaje
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DataTableRowActions>
      )
    },
  },
]

// Example usage component for Patients with selection
export function PatientsTable({ 
  data 
}: { 
  data: PaginatedData<Patient> 
}) {
  const handleSelectionChange = (selectedRows: Patient[]) => {
    console.log("Selected patients:", selectedRows)
    // Handle bulk operations here
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">
            Gestiona la información de los pacientes registrados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Importar Pacientes
          </Button>
          <Button>
            Nuevo Paciente
          </Button>
        </div>
      </div>
      
      <DataTable
        columns={patientsColumns}
        data={data}
        searchPlaceholder="Buscar pacientes por nombre, email o identificación..."
        searchKey="search"
        selectable={true}
        onSelectionChange={handleSelectionChange}
        emptyMessage="No se encontraron pacientes."
        pageSizes={[10, 25, 50, 100]}
      />
    </div>
  )
}

// Example 3: Simple table with custom loading and error states
export function ServicesTable({ 
  data, 
  loading = false 
}: { 
  data: PaginatedData<any>
  loading?: boolean 
}) {
  return (
    <DataTable
      columns={[
        {
          accessorKey: "name",
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Servicio" />
          ),
        },
        {
          accessorKey: "price",
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Precio" />
          ),
          cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "EUR",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
          },
        },
      ]}
      data={data}
      loading={loading}
      searchPlaceholder="Buscar servicios..."
      emptyMessage="No hay servicios disponibles."
      className="mt-4"
    />
  )
}