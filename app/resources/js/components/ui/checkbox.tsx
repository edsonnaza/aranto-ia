import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-emerald-300 bg-white text-white shadow-xs outline-none transition-shadow data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 dark:border-emerald-700/60 dark:bg-emerald-950 dark:data-[state=checked]:border-emerald-500 dark:data-[state=checked]:bg-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-[3px] focus-visible:ring-emerald-500/30 dark:focus-visible:border-emerald-400 dark:focus-visible:ring-emerald-400/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
