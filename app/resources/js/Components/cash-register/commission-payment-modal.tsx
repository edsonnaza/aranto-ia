import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, User, Calendar, DollarSign, FileText, Search, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CommissionLiquidation } from '@/types/commission';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

interface CommissionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentProcessed: () => void;
  approvedLiquidations: CommissionLiquidation[];
}

export function CommissionPaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentProcessed,
  approvedLiquidations = []
}: CommissionPaymentModalProps) {
  const [selectedLiquidation, setSelectedLiquidation] = useState<CommissionLiquidation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Definir columnas para la tabla
  const columns = useMemo<ColumnDef<CommissionLiquidation>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            ID
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-mono text-xs">#{row.original.id}</div>,
        size: 60,
      },
      {
        accessorKey: 'professional.full_name',
        id: 'professional',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Profesional
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {row.original.professional ? 
                  `${row.original.professional.first_name} ${row.original.professional.last_name}` : 
                  'N/A'
                }
              </p>
              {row.original.professional?.specialties && row.original.professional.specialties.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {row.original.professional.specialties[0].name}
                </p>
              )}
            </div>
          </div>
        ),
        filterFn: (row, id, value) => {
          const firstName = row.original.professional?.first_name?.toLowerCase() || '';
          const lastName = row.original.professional?.last_name?.toLowerCase() || '';
          const fullName = `${firstName} ${lastName}`;
          return fullName.includes(value.toLowerCase());
        },
      },
      {
        accessorKey: 'period',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Período
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>{formatDate(row.original.period_start)}</span>
            <span className="text-muted-foreground">-</span>
            <span>{formatDate(row.original.period_end)}</span>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.period_start).getTime();
          const dateB = new Date(rowB.original.period_start).getTime();
          return dateA - dateB;
        },
      },
      {
        accessorKey: 'total_services',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Servicios
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="secondary" className="font-mono">
              {row.original.total_services}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'commission_amount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2"
          >
            Monto a Pagar
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1 font-semibold text-green-600">
            <DollarSign className="h-4 w-4" />
            {formatCurrency(row.original.commission_amount)}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Acción',
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => handleSelectLiquidation(row.original)}
            className="bg-green-600 hover:bg-green-700"
          >
            Pagar
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: approvedLiquidations,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleSelectLiquidation = (liquidation: CommissionLiquidation) => {
    setSelectedLiquidation(liquidation);
    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedLiquidation) return;

    setIsProcessing(true);

    await router.patch(
      `/medical/commissions/${selectedLiquidation.id}/pay`,
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          toast.success('Pago de comisión procesado correctamente');
          onPaymentProcessed();
          handleClose();
        },
        onError: (errors) => {
          console.error('Error procesando pago:', errors);
          const errorMessage = errors?.general?.[0] || 'Error al procesar el pago de comisión';
          toast.error(errorMessage);
        },
        onFinish: () => {
          setIsProcessing(false);
        }
      }
    );
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedLiquidation(null);
      setShowConfirmation(false);
      setGlobalFilter('');
      onClose();
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setSelectedLiquidation(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[85vw]! max-h-[80vh]! overflow-hidden flex flex-col w-full">
        <DialogHeader>
          <DialogTitle>
            {showConfirmation ? 'Confirmar Pago de Comisión' : 'Pago de Comisiones'}
          </DialogTitle>
          <DialogDescription>
            {showConfirmation 
              ? 'Revise los detalles antes de confirmar el pago de esta comisión'
              : 'Seleccione una liquidación aprobada para procesar el pago'}
          </DialogDescription>
        </DialogHeader>

        {!showConfirmation ? (
          // Tabla de liquidaciones aprobadas con buscador
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            {approvedLiquidations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No hay liquidaciones pendientes de pago</p>
                    <p className="text-sm mt-2">
                      Las liquidaciones aprobadas aparecerán aquí para ser procesadas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Buscador */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por profesional..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} de {approvedLiquidations.length} liquidaciones
                  </div>
                </div>

                {/* Tabla */}
                <div className="flex-1 border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} style={{ width: header.getSize() }}>
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
                      {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-24 text-center">
                            <div className="text-muted-foreground">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No se encontraron liquidaciones</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="hover:bg-accent/50 cursor-pointer"
                            onClick={() => handleSelectLiquidation(row.original)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Resumen */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div className="text-muted-foreground">
                    Total a pagar: <span className="font-bold text-green-600 text-base ml-1">
                      {formatCurrency(
                        table.getFilteredRowModel().rows.reduce(
                          (sum, row) => sum + (row.original.commission_amount || 0),
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          // Confirmación de pago
          <div className="space-y-6">
            {selectedLiquidation && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen de Liquidación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Profesional</p>
                        <p className="font-medium">
                          {selectedLiquidation.professional ? 
                            `${selectedLiquidation.professional.first_name} ${selectedLiquidation.professional.last_name}` : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Especialidad</p>
                        <p className="font-medium">
                          {selectedLiquidation.professional?.specialties && selectedLiquidation.professional.specialties.length > 0
                            ? selectedLiquidation.professional.specialties[0].name
                            : 'No especificada'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Período</p>
                        <p className="font-medium">
                          {formatDate(selectedLiquidation.period_start)} - {formatDate(selectedLiquidation.period_end)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Servicios</p>
                        <p className="font-medium">{selectedLiquidation.total_services}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monto Bruto</p>
                        <p className="font-medium">{formatCurrency(selectedLiquidation.gross_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">% Comisión</p>
                        <p className="font-medium">{selectedLiquidation.commission_percentage}%</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold">Monto a Pagar</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(selectedLiquidation.commission_amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Importante:</strong> Esta acción registrará un egreso en la caja actual y marcará la liquidación como pagada. 
                    Esta operación no se puede deshacer automáticamente.
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isProcessing}
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Confirmar Pago
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
