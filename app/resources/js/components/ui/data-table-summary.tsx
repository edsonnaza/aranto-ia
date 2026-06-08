import * as React from "react"

interface DataTableSummaryProps {
  from: number
  to: number
  total: number
}

export const DataTableSummary: React.FC<DataTableSummaryProps> = ({ from, to, total }) => (
  <div className="text-xs text-muted-foreground text-center">
    Mostrando {from} a {to} de {total} resultados
  </div>
)
