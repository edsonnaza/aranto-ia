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
import { ChevronDown, ChevronUp, ChevronsUpDown, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableSummary } from "@/components/ui/data-table-summary"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface PaginatedData<T> {
  data: T[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  links: Array<{ url: string | null; label: string; active: boolean }>
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: PaginatedData<TData>
  searchable?: boolean
  searchPlaceholder?: string
  searchKey?: string
  filterable?: boolean
  selectable?: boolean
  dateRangeFilterable?: boolean
  insuranceFilterable?: boolean
  insuranceTypeOptions?: Array<{ id: number; name: string }>
  paymentStatusFilterable?: boolean
  statusFilterable?: boolean
  statusOptions?: Array<{ value: string; label: string }>
  onSearch?: (search: string) => void
  onDateRangeChange?: (dateRange: { from: string | null; to: string | null }) => void
  onStatusChange?: (status: string) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSelectionChange?: (selectedRows: TData[]) => void
  loading?: boolean
  className?: string
  emptyMessage?: string
  pageSizes?: number[]
  initialDateFrom?: string
  initialDateTo?: string
  initialPaymentStatus?: string
  initialStatus?: string
  initialInsuranceType?: string
}

function DataTableInner<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const {
    columns,
    data,
    searchable = true,
    searchPlaceholder = "Buscar...",
    searchKey = "search",
    filterable = true,
    selectable = false,
    dateRangeFilterable = false,
    insuranceFilterable = false,
    statusFilterable = false,
    paymentStatusFilterable = false,
    onSearch,
    onDateRangeChange,
    onStatusChange,
    onPageChange,
    onPageSizeChange,
    onSelectionChange,
    loading = false,
    className,
    emptyMessage = "No se encontraron resultados.",
    pageSizes = [10, 20, 30, 50, 100],
    initialDateFrom = "",
    initialDateTo = "",
    initialStatus = "",
    initialPaymentStatus = "",
    initialInsuranceType = "",
    insuranceTypeOptions = [],
    statusOptions = [],
  } = props

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchValue, setSearchValue] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState<string | null>(initialDateFrom || null)
  const [dateTo, setDateTo] = React.useState<string | null>(initialDateTo || null)
  const [status, setStatus] = React.useState<string>(initialStatus || "all")
  const [insuranceType, setInsuranceType] = React.useState<string>(initialInsuranceType || "all")
  const [paymentStatus, setPaymentStatus] = React.useState<string>(initialPaymentStatus || "all")

  const memoData = React.useMemo(() => data.data, [data.data])
  const memoColumns = React.useMemo(() => columns, [columns])

  const table = useReactTable({
  data: memoData,
  columns: memoColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: data.last_page,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: data.current_page - 1,
        pageSize: data.per_page,
      },
    },
  })

  // Notify parent when row selection changes (returns currently selected rows on this page)
  React.useEffect(() => {
    if (initialPaymentStatus) {
      setPaymentStatus(initialPaymentStatus)
    }
    if (initialInsuranceType) {
      setInsuranceType(initialInsuranceType)
    }
  }, [initialPaymentStatus, initialInsuranceType])

  React.useEffect(() => {
    if (!onSelectionChange) return
  const selectedIndices = Object.keys(rowSelection).filter((k) => (rowSelection as Record<string, boolean>)[k])
    const selectedRows = selectedIndices.map((i) => data.data[Number(i)])
    onSelectionChange(selectedRows)
  }, [rowSelection, data.data, onSelectionChange])

  const handlePageChange = (page: number) => {
    if (onPageChange) return onPageChange(page)
    const url = new URL(window.location.href)
    url.searchParams.set('page', page.toString())
    router.visit(url.toString(), { preserveState: true })
  }

  const handlePageSizeChange = (size: string) => {
    const pageSize = Number(size)
    if (onPageSizeChange) return onPageSizeChange(pageSize)
    const url = new URL(window.location.href)
    url.searchParams.set('per_page', pageSize.toString())
    url.searchParams.set('page', '1')
    router.visit(url.toString(), { preserveState: true })
  }

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchValue(value)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = setTimeout(() => {
        if (onSearch) return onSearch(value)
        const url = new URL(window.location.href)
        if (value) url.searchParams.set(searchKey, value)
        else url.searchParams.delete(searchKey)
        url.searchParams.set('page', '1')
        router.visit(url.toString(), { preserveState: true })
      }, 300)
    },
    [onSearch, searchKey]
  )

  const clearSearch = () => handleSearch("")

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <DataTableToolbar
          searchable={searchable}
          searchValue={searchValue}
          onSearch={handleSearch}
          onClearSearch={clearSearch}
          searchPlaceholder={searchPlaceholder}
          loading={loading}
          dateRangeFilterable={dateRangeFilterable}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={(val) => {
            setDateFrom(val)
            if (onDateRangeChange) onDateRangeChange({ from: val, to: dateTo })
          }}
          onDateToChange={(val) => {
            setDateTo(val)
            if (onDateRangeChange) onDateRangeChange({ from: dateFrom, to: val })
          }}
          statusFilterable={statusFilterable}
          status={status}
          statusOptions={statusOptions}
          onStatusChange={(val) => {
            setStatus(val)
            if (onStatusChange) onStatusChange(val)
          }}
          insuranceFilterable={insuranceFilterable}
          insuranceType={insuranceType}
          insuranceTypeOptions={insuranceTypeOptions}
          onInsuranceTypeChange={(val) => {
            setInsuranceType(val)
            const url = new URL(window.location.href)
            if (val !== 'all') url.searchParams.set('insurance_type', val)
            else url.searchParams.delete('insurance_type')
            url.searchParams.set('page', '1')
            router.visit(url.toString(), { preserveState: true })
          }}
          paymentStatusFilterable={paymentStatusFilterable}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={(val) => {
            setPaymentStatus(val)
            const url = new URL(window.location.href)
            if (val !== 'all') url.searchParams.set('payment_status', val)
            else url.searchParams.delete('payment_status')
            url.searchParams.set('page', '1')
            router.visit(url.toString(), { preserveState: true })
          }}
        />

        {filterable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto h-8">
                <Settings2 className="mr-2 h-4 w-4" />
                Columnas
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-200px">
              <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows && table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectable && (
            <>
              {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
            </>
          )}
        </div>
        <DataTablePagination
          currentPage={data.current_page}
          lastPage={data.last_page}
          perPage={data.per_page}
          pageSizes={pageSizes}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      </div>

      {data.total > 0 && (
        <DataTableSummary from={data.from} to={data.to} total={data.total} />
      )}
    </div>
  )
}

export const DataTable = React.memo(DataTableInner) as <TData, TValue>(props: DataTableProps<TData, TValue>) => React.ReactElement

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>
  title: string
  className?: string
}) {
  if (!column.getCanSort()) return <div className={className}>{title}</div>

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

export function DataTableRowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end space-x-2">{children}</div>
}