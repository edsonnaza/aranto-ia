import { Head } from '@inertiajs/react'
import {  useMemo, useRef, useEffect, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { router } from '@inertiajs/react'
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, PaginatedData } from '@/components/ui/data-table'
import { Eye, Pencil, Trash2 } from 'lucide-react'

interface MedicalService {
  id: number
  name: string
  code: string
  description?: string
  category?: {
    id: number
    name: string
  }
  duration_minutes: number
  requires_appointment: boolean
  requires_preparation: boolean
  status: string
  active_prices_count: number
  formatted_duration: string
}

interface ServiceCategory {
  id: number
  name: string
}

interface Stats {
  total: number
  active: number
  with_appointment: number
  with_preparation: number
}

interface Filters {
  search?: string
  category_id?: string
  status?: string
  requires_appointment?: boolean
  requires_preparation?: boolean
}

interface MedicalServicesIndexProps {
  services?: PaginatedData<MedicalService>
  categories?: ServiceCategory[]
  filters?: Filters
  stats?: Stats
}

export default function MedicalServicesIndex({ 
  services, 
  filters, 
  stats 
}: MedicalServicesIndexProps) {
  const safeServices = services || {
    data: [],
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
    links: []
  }

  const safeStats = stats || {
    total: 0,
    active: 0,
    with_appointment: 0,
    with_preparation: 0
  }
  const safeFilters = filters || {}

  // Local state for form inputs - prevents losing values during debounce/navigation
  const [localSearch, setLocalSearch] = useState<string>(safeFilters.search || '')
  const [localStatus, setLocalStatus] = useState<string>(safeFilters.status || '')

  const breadcrumbs = [
    { href: '/medical', title: 'Sistema Médico' },
    { href: '/medical/medical-services', title: 'Servicios Médicos', current: true }
  ]

  // Debounce timer for search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = (search: string) => {
    // Update local state immediately to show input value
    setLocalSearch(search)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search - only search if value changed
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (safeFilters.category_id) params.set('category_id', safeFilters.category_id)
      if (safeFilters.status) params.set('status', safeFilters.status)
      router.get(window.location.pathname + '?' + params.toString())
    }, 500) // Wait 500ms after user stops typing
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleStatusChange = (status: string) => {
    // Update local state immediately
    setLocalStatus(status)
    
    const params = new URLSearchParams()
    if (localSearch) params.set('search', localSearch)
    if (safeFilters.category_id) params.set('category_id', safeFilters.category_id)
    if (status && status !== 'all') params.set('status', status)
    router.get(window.location.pathname + '?' + params.toString())
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (localSearch) params.set('search', localSearch)
    if (safeFilters.category_id) params.set('category_id', safeFilters.category_id)
    if (localStatus) params.set('status', localStatus)
    params.set('page', page.toString())
    router.get(window.location.pathname + '?' + params.toString())
  }

  const handlePageSizeChange = (pageSize: number) => {
    const params = new URLSearchParams()
    if (localSearch) params.set('search', localSearch)
    if (safeFilters.category_id) params.set('category_id', safeFilters.category_id)
    if (localStatus) params.set('status', localStatus)
    params.set('per_page', pageSize.toString())
    // Reset to page 1 when changing page size
    router.get(window.location.pathname + '?' + params.toString())
  }

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) {
      router.delete(`/medical/medical-services/${id}`)
    }
  }

  const columns = useMemo<ColumnDef<MedicalService>[]>(() => [
    {
      id: 'name',
      header: 'Servicio',
      accessorKey: 'name',
      cell: ({ row }) => {
        const service = row.original
        return (
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate">{service.name}</div>
            <div className="text-sm text-gray-500 truncate">{service.code}</div>
            {service.description && (
              <div className="text-xs text-gray-400 truncate mt-1">
                {service.description.substring(0, 60)}...
              </div>
            )}
          </div>
        )
      }
    },
    {
      id: 'category',
      header: 'Categoría',
      accessorKey: 'category.name',
      cell: ({ row }) => {
        return <span className="text-sm">{row.original.category?.name || 'Sin categoría'}</span>
      }
    },
    {
      id: 'duration',
      header: 'Duración',
      accessorKey: 'formatted_duration',
      cell: ({ row }) => {
        return <span className="text-sm">{row.original.formatted_duration}</span>
      }
    },
    {
      id: 'features',
      header: 'Características',
      cell: ({ row }) => {
        const service = row.original
        return (
          <div className="flex flex-wrap gap-1">
            {service.requires_appointment && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Cita
              </span>
            )}
            {service.requires_preparation && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                Prep.
              </span>
            )}
          </div>
        )
      }
    },
    {
      id: 'prices',
      header: 'Precios',
      accessorKey: 'active_prices_count',
      cell: ({ row }) => {
        const count = row.original.active_prices_count
        return (
          <span className="text-sm text-gray-600">
            {count} precio{count !== 1 ? 's' : ''}
          </span>
        )
      }
    },
    {
      id: 'status',
      header: 'Estado',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusConfig = {
          active: { label: 'Activo', className: 'bg-green-100 text-green-800' },
          inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800' },
          draft: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-800' },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const service = row.original
        return (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => router.get(`/medical/medical-services/${service.id}`)}
              className="text-indigo-600 hover:text-indigo-900 p-1"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.get(`/medical/medical-services/${service.id}/edit`)}
              className="text-yellow-600 hover:text-yellow-900 p-1"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(service.id, service.name)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      }
    }
  ], [])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Servicios Médicos" />
      
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Servicios Médicos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de servicios médicos y sus precios por tipo de seguro
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => router.get('/medical/medical-services/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="mr-2">+</span>
              Nuevo Servicio
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{safeStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                    <dd className="text-lg font-medium text-gray-900">{safeStats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">⏰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Con Cita</dt>
                    <dd className="text-lg font-medium text-gray-900">{safeStats.with_appointment}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📋</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Preparación</dt>
                    <dd className="text-lg font-medium text-gray-900">{safeStats.with_preparation}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow rounded-lg">
          <DataTable
            columns={columns}
            data={safeServices}
            searchable={true}
            searchPlaceholder="Buscar por nombre, código o descripción..."
            searchKey="search"
            initialSearch={localSearch}
            statusFilterable={true}
            statusOptions={[
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
              { value: 'draft', label: 'Borrador' },
            ]}
            initialStatus={localStatus}
            onSearch={handleSearch}
            onStatusChange={handleStatusChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            emptyMessage="No se encontraron servicios médicos"
            pageSizes={[25, 50, 100]}
          />
        </div>
      </div>
    </AppLayout>
  )
}
