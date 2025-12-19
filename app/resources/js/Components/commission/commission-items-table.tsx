import React, { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export interface CommissionItem {
  service_request_id: number
  patient_name: string
  service_name: string
  service_amount: number
  commission_percentage: number
  commission_amount: number
  service_date: string
}

interface CommissionItemsTableProps {
  items: CommissionItem[]
  title?: string
  description?: string
  showTitle?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
}

export function CommissionItemsTable({
  items,
  title = 'Servicios Incluidos',
  description,
  showTitle = true,
  searchPlaceholder = 'Buscar por paciente o servicio...',
  emptyMessage = 'No hay servicios en esta liquidación',
}: CommissionItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const columns = useMemo<ColumnDef<CommissionItem>[]>(() => [
    {
      accessorKey: 'patient_name',
      header: 'Paciente',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('patient_name') || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'service_name',
      header: 'Servicio',
      cell: ({ row }) => (
        <div>{row.getValue('service_name') || `Servicio #${row.original.service_request_id}`}</div>
      ),
    },
    {
      accessorKey: 'service_amount',
      header: () => (
        <div className="text-right">Precio</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">{formatCurrency(row.getValue('service_amount'))}</div>
      ),
    },
    {
      accessorKey: 'commission_percentage',
      header: () => (
        <div className="text-right">Comisión %</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <Badge variant="secondary">
            {row.getValue('commission_percentage')}%
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'commission_amount',
      header: () => (
        <div className="text-right">A Cobrar</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-green-700">
          {formatCurrency(row.getValue('commission_amount'))}
        </div>
      ),
    },
    {
      accessorKey: 'service_date',
      header: () => (
        <div className="text-right">Fecha</div>
      ),
      cell: ({ row }) => (
        <div className="text-right text-sm text-muted-foreground">
          {formatDate(row.getValue('service_date'))}
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: setSearchTerm,
  })

  const totals = useMemo(() => {
    return {
      count: items.length,
      totalAmount: items.reduce((sum, item) => sum + item.service_amount, 0),
      totalCommission: items.reduce((sum, item) => sum + item.commission_amount, 0),
    }
  }, [items])

  const filteredRows = table.getRowModel().rows

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline">{totals.count}</Badge>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={showTitle ? '' : 'pt-6'}>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Search className="h-5 w-5 text-muted-foreground mt-2.5" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
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

          {/* Summary */}
          {items.length > 0 && (
            <div className="flex justify-end gap-8 pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totals.totalAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Comisión Total</p>
                <p className="text-lg font-semibold text-green-700">
                  {formatCurrency(totals.totalCommission)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
