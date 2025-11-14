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
}

export function DateInputWithCalendar({ value, onChange, placeholder, disabled }: DateInputWithCalendarProps) {
  const [open, setOpen] = React.useState(false)
  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    // Formatear dd/mm/yyyy
    const formatted = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
    onChange(formatted)
    setOpen(false)
  }
  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        pattern="^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$"
        className="w-36"
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
            selected={value ? parseDate(value) : undefined}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function parseDate(str: string): Date | undefined {
  // Espera dd/mm/yyyy
  const [d, m, y] = str.split("/").map(Number)
  if (!d || !m || !y) return undefined
  return new Date(y, m - 1, d)
}
