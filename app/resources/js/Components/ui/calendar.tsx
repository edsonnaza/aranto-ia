import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

export interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | { from?: Date; to?: Date }
  onSelect?: (date: Date | undefined) => void
  initialFocus?: boolean
}

export function Calendar({ mode = "single", selected, onSelect, initialFocus }: CalendarProps) {
  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      showOutsideDays
      fixedWeeks
      locale="es"
      modifiersClassNames={{
        selected: "bg-primary text-white",
        today: "border border-primary"
      }}
      className="rounded-md border bg-white shadow-md p-2"
      initialFocus={initialFocus}
    />
  )
}
