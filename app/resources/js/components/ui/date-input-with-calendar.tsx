import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"

export interface DateInputWithCalendarProps {
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  format?: "iso" | "local"
  className?: string
}

export function DateInputWithCalendar({ value, onChange, placeholder, disabled, format = "local", className }: DateInputWithCalendarProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date>(() => {
    const parsed = value ? parseDate(value) : new Date()
    return parsed || new Date()
  })
  
  const parsedDate = value ? parseDate(value) : undefined
  
  type DateRange = { from: Date | undefined; to?: Date | undefined }
  const handleSelect = (date: Date | Date[] | DateRange | undefined) => {
    if (!date) return
    let selectedDate: Date | undefined
    if (date instanceof Date) {
      selectedDate = date
    } else if (Array.isArray(date) && date.length > 0 && date[0] instanceof Date) {
      selectedDate = date[0]
    } else if (typeof date === "object" && "from" in date && date.from instanceof Date) {
      selectedDate = date.from
    }
    if (!selectedDate) return
    const formatted = formatDateValue(selectedDate, format)
    onChange(formatted)
    setOpen(false)
  }

  // Actualizar el mes cuando cambia el valor
  React.useEffect(() => {
    if (value && open) {
      const parsed = parseDate(value)
      if (parsed) {
        setMonth(parsed)
      }
    }
  }, [value, open])

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`.trim()}>
      <Input
        type="text"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        pattern={format === "iso"
          ? "^\\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$"
          : "^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\\d{4}$"}
        className="min-w-0 flex-1"
        onKeyDown={e => {
          if (e.key === 'Enter') e.preventDefault();
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            type="button" 
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function parseDate(str: string): Date | undefined {
  const parts = str.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return undefined

  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = parts
    return new Date(y, m - 1, d)
  }

  if (str.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const [d, m, y] = parts
    return new Date(y, m - 1, d)
  }

  return undefined
}

function formatDateValue(date: Date, format: "iso" | "local"): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  if (format === "iso") {
    return `${year}-${month}-${day}`
  }

  return `${day}-${month}-${year}`
}
