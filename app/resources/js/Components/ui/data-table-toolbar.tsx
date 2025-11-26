import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { DateInputWithCalendar } from "@/components/ui/date-input-with-calendar"

interface DataTableToolbarProps {
  searchable: boolean
  searchValue: string
  onSearch: (value: string) => void
  onClearSearch: () => void
  searchPlaceholder: string
  loading: boolean
  dateRangeFilterable: boolean
  dateFrom: string | null
  dateTo: string | null
  onDateFromChange: (val: string | null) => void
  onDateToChange: (val: string | null) => void
  insuranceFilterable: boolean
  insuranceType: string
  insuranceTypeOptions: Array<{ id: number; name: string }>
  onInsuranceTypeChange: (val: string) => void
  paymentStatusFilterable: boolean
  paymentStatus: string
  onPaymentStatusChange: (val: string) => void
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  searchable,
  searchValue,
  onSearch,
  onClearSearch,
  searchPlaceholder,
  loading,
  dateRangeFilterable,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  insuranceFilterable,
  insuranceType,
  insuranceTypeOptions,
  onInsuranceTypeChange,
  paymentStatusFilterable,
  paymentStatus,
  onPaymentStatusChange,
}) => (
  <div className="flex flex-1 items-center space-x-2">
    {searchable && (
      <div className="relative flex items-center">
        <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearch(e.target.value)}
          className="pl-8 pr-8 w-64"
          disabled={loading}
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 h-full px-2"
            onClick={onClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )}
    {dateRangeFilterable && (
      <div className="flex items-center space-x-2 ml-4">
        <DateInputWithCalendar
          value={dateFrom}
          onChange={onDateFromChange}
          placeholder="Desde (dd/mm/yyyy)"
          disabled={loading}
        />
        <span className="mx-1">-</span>
        <DateInputWithCalendar
          value={dateTo}
          onChange={onDateToChange}
          placeholder="Hasta (dd/mm/yyyy)"
          disabled={loading}
        />
      </div>
    )}
    {insuranceFilterable && (
      <div className="flex items-center space-x-2 ml-4">
        <Select
          value={insuranceType}
          onValueChange={onInsuranceTypeChange}
          disabled={loading}
        >
          <SelectTrigger className="h-8 w-160px">
            <SelectValue placeholder="Filtrar por seguro" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="all">Todos</SelectItem>
            {insuranceTypeOptions.map(option => (
              <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}
    {paymentStatusFilterable && (
      <div className="flex items-center space-x-2 ml-4">
        <Select
          value={paymentStatus}
          onValueChange={onPaymentStatusChange}
          disabled={loading}
        >
          <SelectTrigger className="h-8 w-160px">
            <SelectValue placeholder="Estado de pago" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
  </div>
)
