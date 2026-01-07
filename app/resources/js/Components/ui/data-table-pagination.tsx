import * as React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface DataTablePaginationProps {
  currentPage: number
  lastPage: number
  perPage: number
  pageSizes: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: string) => void
  loading?: boolean
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  lastPage,
  perPage,
  pageSizes,
  onPageChange,
  onPageSizeChange,
  loading,
}) => (
  <div className="flex items-center space-x-6 lg:space-x-8">
    <div className="flex items-center space-x-2">
      <p className="text-sm font-medium">Filas por página</p>
      <Select
        value={`${perPage}`}
        onValueChange={onPageSizeChange}
        disabled={loading}
      >
        <SelectTrigger className="h-8 w-70px">
          <SelectValue placeholder={perPage} />
        </SelectTrigger>
        <SelectContent side="top">
          {pageSizes.map(size => (
            <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="flex w-100px items-center justify-center text-sm font-medium">
      Página {currentPage} de {lastPage}
    </div>
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="icon" className="hidden h-8 w-8 lg:flex" onClick={() => onPageChange(1)} disabled={currentPage <= 1}>
        <span className="sr-only">Ir a la primera página</span>
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
        <span className="sr-only">Ir a la página anterior</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= lastPage}>
        <span className="sr-only">Ir a la página siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="hidden h-8 w-8 lg:flex" onClick={() => onPageChange(lastPage)} disabled={currentPage >= lastPage}>
        <span className="sr-only">Ir a la última página</span>
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
)
