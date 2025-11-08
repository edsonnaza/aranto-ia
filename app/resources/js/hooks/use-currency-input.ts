import { useController, Control, FieldPath, FieldValues, RegisterOptions } from "react-hook-form"
import type { CurrencyInputProps } from "@/components/ui/currency-input"

interface UseCurrencyInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<CurrencyInputProps, "value" | "onChange" | "name"> {
  name: TName
  control?: Control<TFieldValues>
  defaultValue?: number
  rules?: RegisterOptions<TFieldValues, TName>
  shouldUnregister?: boolean
}

/**
 * Hook for integrating CurrencyInput with React Hook Form
 * 
 * @example
 * ```tsx
 * const { field, fieldState } = useCurrencyInput({
 *   name: "amount",
 *   control,
 *   rules: { required: "Amount is required" }
 * });
 * 
 * return <CurrencyInput {...field} error={fieldState.error?.message} />
 * ```
 */
export function useCurrencyInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: UseCurrencyInputProps<TFieldValues, TName>) {
  const {
    name,
    control,
    defaultValue = 0,
    rules,
    shouldUnregister,
    ...inputProps
  } = props

  const {
    field,
    fieldState,
    formState: { isSubmitting }
  } = useController({
    name,
    control,
    defaultValue: defaultValue as TFieldValues[TName],
    rules,
    shouldUnregister,
  })

  return {
    field: {
      ...field,
      value: field.value ?? defaultValue,
      onChange: (value: number) => field.onChange(value),
      disabled: inputProps.disabled || isSubmitting,
      ...inputProps,
    },
    fieldState,
    formState: { isSubmitting },
  }
}