import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const isDateLike = type === "date" || type === "datetime-local"
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { onClick, style, ...restProps } = props
  const dateIconStyle = isDateLike
    ? {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23111111' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 2v4'/%3E%3Cpath d='M16 2v4'/%3E%3Crect width='18' height='18' x='3' y='4' rx='2'/%3E%3Cpath d='M3 10h18'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.875rem center",
        backgroundSize: "1rem 1rem",
      }
    : undefined
  const mergedStyle = {
    ...(style ?? {}),
    ...(dateIconStyle ?? {}),
  }
  const handleClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
    onClick?.(event)

    if (event.defaultPrevented || !isDateLike) {
      return
    }

    const target = inputRef.current
    const showPicker = target && "showPicker" in target ? (target.showPicker as (() => void) | undefined) : undefined

    if (showPicker) {
      try {
        showPicker.call(target)
      } catch {
        // Some browsers restrict showPicker in edge cases; native focus remains as fallback.
      }
    }
  }

  return (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      {...restProps}
      className={cn(
        "border border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-emerald-950 file:text-foreground placeholder:text-muted-foreground selection:bg-emerald-600 selection:text-white flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-emerald-500 dark:focus-visible:border-emerald-400 focus-visible:ring-emerald-500/30 dark:focus-visible:ring-emerald-400/20 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        isDateLike &&
          "cursor-pointer px-3 pr-12 [appearance:textfield] [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:pr-2 [&::-webkit-datetime-edit]:min-w-0 [&::-webkit-datetime-edit]:overflow-hidden [&::-webkit-datetime-edit]:pr-2 [&::-webkit-datetime-edit]:text-left [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
        className
      )}
      style={mergedStyle}
      onClick={handleClick}
    />
  )
}

export { Input }
