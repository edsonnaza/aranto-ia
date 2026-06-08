import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value?: number | string | null
  onChange?: (value: number) => void
  onRawChange?: (rawValue: string) => void
  placeholder?: string
  allowNegative?: boolean
  maxValue?: number
  minValue?: number
  prefix?: string
  showPrefix?: boolean
  error?: string | boolean
}

/**
 * Currency Input Component with real-time formatting
 * 
 * Features:
 * - Real-time thousands separator formatting (6.000.000)
 * - Paraguay Guaraní format (dots for thousands, comma for decimals)
 * - Automatic parsing to numeric values
 * - Validation and error handling
 * - Optional prefix (₲) display
 * - Min/max value constraints
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onChange,
      onRawChange,
      placeholder = "0",
      allowNegative = false,
      maxValue,
      minValue = 0,
      prefix = "₲",
      showPrefix = false,
      error,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>("")
    const [isFocused, setIsFocused] = React.useState(false)

    // Format number with thousands separator for display
    const formatForDisplay = React.useCallback((num: number | string | null): string => {
      if (num === null || num === undefined || num === "") return ""
      
      const numericValue = typeof num === 'string' ? parseFloat(num) : num
      if (isNaN(numericValue)) return ""
      
      // Check if has decimals
      const hasDecimals = numericValue % 1 !== 0
      
      if (hasDecimals) {
        // Format with decimals: 3.000.000,50
        const [intPart, decPart] = numericValue.toFixed(2).split(".")
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        return `${formattedInt},${decPart}`
      } else {
        // Format without decimals: 3.000.000
        return Math.floor(numericValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      }
    }, [])

    // Parse display value to number
    const parseDisplayValue = React.useCallback((displayValue: string): number => {
      if (!displayValue) return 0
      
      // Remove thousands separators and convert decimal comma to dot
      const cleanValue = displayValue
        .replace(/\./g, "") // Remove thousands separators
        .replace(",", ".") // Convert decimal separator
      
      const parsed = parseFloat(cleanValue)
      return isNaN(parsed) ? 0 : parsed
    }, [])

    // Update display value when value prop changes
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatForDisplay(value ?? null))
      }
    }, [value, formatForDisplay, isFocused])

    // Handle input change with real-time formatting
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        
        // Allow empty value
        if (inputValue === "") {
          setDisplayValue("")
          onChange?.(0)
          onRawChange?.("")
          return
        }

        // Validate input format (numbers, dots, one comma max)
        const validInput = /^[\d.,]*$/.test(inputValue)
        if (!validInput) return

        // Count commas (max 1 allowed)
        const commaCount = (inputValue.match(/,/g) || []).length
        if (commaCount > 1) return

        // Parse and validate numeric value
        const numericValue = parseDisplayValue(inputValue)
        
        // Check min/max constraints
        if (minValue !== undefined && numericValue < minValue) return
        if (maxValue !== undefined && numericValue > maxValue) return
        if (!allowNegative && numericValue < 0) return

        // Update display with formatted value
        const formatted = formatForDisplay(numericValue)
        setDisplayValue(formatted)

        // Call callbacks
        onChange?.(numericValue)
        onRawChange?.(formatted)
      },
      [
        parseDisplayValue,
        formatForDisplay,
        onChange,
        onRawChange,
        minValue,
        maxValue,
        allowNegative,
      ]
    )

    // Handle focus events
    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true)
        props.onFocus?.(e)
      },
      [props]
    )

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false)
        
        // Reformat on blur to ensure consistency
        if (displayValue) {
          const numericValue = parseDisplayValue(displayValue)
          const formatted = formatForDisplay(numericValue)
          setDisplayValue(formatted)
          onChange?.(numericValue)
        }
        
        props.onBlur?.(e)
      },
      [displayValue, parseDisplayValue, formatForDisplay, onChange, props]
    )

    // Handle key events for better UX
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true) ||
          (e.keyCode === 90 && e.ctrlKey === true) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
          return
        }
        
        // Ensure that it's a number or comma/dot and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
          (e.keyCode < 96 || e.keyCode > 105) && 
          e.keyCode !== 188 && // comma
          e.keyCode !== 190 && // period
          e.keyCode !== 110) { // decimal point
          e.preventDefault()
        }
        
        props.onKeyDown?.(e)
      },
      [props]
    )

    // Determine input styling based on state
    const inputClassName = cn(
      error && "border-destructive focus-visible:ring-destructive/20",
      showPrefix && "pl-8",
      className
    )

    return (
      <div className="relative">
        {showPrefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {prefix}
          </div>
        )}
        
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClassName}
          {...props}
        />
        
        {error && typeof error === 'string' && (
          <p className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }