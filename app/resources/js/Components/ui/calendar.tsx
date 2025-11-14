import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { es } from "date-fns/locale"

import type { DateRange } from "react-day-picker"

export interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | DateRange
  onSelect?: (date: Date | Date[] | DateRange | undefined) => void
  initialFocus?: boolean
}

export function Calendar({ mode = "single", selected, onSelect, initialFocus }: CalendarProps) {
  // 'required' is only needed for 'range' mode
  const baseProps = {
    selected,
    onSelect,
    showOutsideDays: true,
    locale: es,
    modifiersClassNames: {
      selected: "bg-primary text-white",
      today: "border border-primary"
    },
    className: "rounded-md border bg-white shadow-md p-2",
    initialFocus,
  };

  let dayPickerProps: import("react-day-picker").DayPickerProps;

  if (mode === "range") {
    dayPickerProps = {
      ...baseProps,
      mode: "range",
      // Only pass selected if it's a DateRange or undefined
      selected: typeof selected === "object" && selected !== null && "from" in selected
        ? (selected as DateRange)
        : undefined,
      required: false,
    };
  } else if (mode === "multiple") {
    dayPickerProps = {
      ...baseProps,
      mode: "multiple",
      // Only pass selected if it's an array or undefined
      selected: Array.isArray(selected) ? selected : undefined,
    };
  } else {
    dayPickerProps = {
      ...baseProps,
      mode: "single",
      // Only pass selected if it's a Date or undefined
      selected: selected instanceof Date ? selected : undefined,
    };
  }

  return (
    <DayPicker {...dayPickerProps} />
  );
}
