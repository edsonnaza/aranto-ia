"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
} from "@tanstack/react-table"
import { router } from '@inertiajs/react'
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Settings2,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Types for server-side pagination
export interface PaginatedData<T> {
  data: T[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: PaginatedData<TData>
  searchable?: boolean
  searchPlaceholder?: string
  searchKey?: string
  filterable?: boolean
  selectable?: boolean
  onSearch?: (search: string) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSelectionChange?: (selectedRows: TData[]) => void
  loading?: boolean
  className?: string
  emptyMessage?: string
  pageSizes?: number[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Buscar...",
  searchKey = "search",
  filterable = true,
  selectable = false,
  onSearch,
  onPageChange,
  onPageSizeChange, 
  onSelectionChange,
  loading = false,
  className,
  emptyMessage = "No se encontraron resultados.",
  pageSizes = [10, 20, 30, 50, 100],
}: DataTableProps<TData, TValue>) {
  // State management
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState("")

  // Create table instance
  // Note: React Compiler warning is expected - TanStack Table returns non-memoizable functions by design
  const table = useReactTable({
    data: data.data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true, // Server-side pagination
    pageCount: data.last_page,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: data.current_page - 1, // 0-indexed
        pageSize: data.per_page,
      },
    },
  })

  // Handle search with debounce
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const handleSearch = React.useCallback((value: string) => {
    setSearchValue(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(value)
      } else {
        // Default behavior: update URL with search parameter
        const url = new URL(window.location.href)
        if (value) {
          url.searchParams.set(searchKey, value)
        } else {
          url.searchParams.delete(searchKey)
        }
        url.searchParams.set('page', '1') // Reset to first page
        router.visit(url.toString(), { preserveState: true })
      }
    }, 300)
  }, [onSearch, searchKey])

  // Clear search
  const clearSearch = () => {
    handleSearch("")
  }

  // Handle page changes
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.set('page', page.toString())
      router.visit(url.toString(), { preserveState: true })
    }
  }

  // Handle page size changes
  const handlePageSizeChange = (pageSize: string) => {
    const newPageSize = parseInt(pageSize)
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.set('per_page', pageSize)
      url.searchParams.set('page', '1') // Reset to first page
      router.visit(url.toString(), { preserveState: true })
    }
  }

  // Handle row selection changes
  React.useEffect(() => {
    if (onSelectionChange && selectable) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, onSelectionChange, selectable, table])

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Top toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Search input */}
          {searchable && (
            <div className="relative flex items-center">
              <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 pr-8 w-64"
                disabled={loading}
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 h-full px-2"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Column visibility toggle */}
        {filterable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto h-8">
                <Settings2 className="mr-2 h-4 w-4" />
                Columnas
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom pagination and info */}
      <div className="flex items-center justify-between px-2">
        {/* Selection info */}
        <div className="flex-1 text-sm text-muted-foreground">
          {selectable && (
            <>
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
            </>
          )}
        </div>

        {/* Page size selector */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={`${data.per_page}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={data.per_page} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizes.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page info */}
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {data.current_page} de {data.last_page}
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={data.current_page <= 1}
            >
              <span className="sr-only">Ir a la primera página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(data.current_page - 1)}
              disabled={data.current_page <= 1}
            >
              <span className="sr-only">Ir a la página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(data.current_page + 1)}
              disabled={data.current_page >= data.last_page}
            >
              <span className="sr-only">Ir a la página siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => handlePageChange(data.last_page)}
              disabled={data.current_page >= data.last_page}
            >
              <span className="sr-only">Ir a la última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table summary */}
      {data.total > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Mostrando {data.from} a {data.to} de {data.total} resultados
        </div>
      )}
    </div>
  )
}

// Utility component for sortable column headers
export function DataTableColumnHeader({
  column,
  title,
  className,
}: {
  column: Column<any, unknown>
  title: string
  className?: string
}) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ChevronDown className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

// Utility component for row actions
export function DataTableRowActions({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="flex items-center justify-end space-x-2">
      {children}
    </div>
  )
}