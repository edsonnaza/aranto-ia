import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs hover:bg-emerald-700 dark:hover:bg-emerald-400 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/40",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-emerald-600 dark:border-emerald-400 bg-white dark:bg-emerald-950 text-emerald-700 dark:text-white shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-900 dark:hover:text-emerald-200 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/40",
        secondary:
          "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-900 dark:text-white shadow-xs hover:bg-emerald-200 dark:hover:bg-emerald-800/40 focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/40",
        ghost: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-900 dark:hover:text-white focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/40",
        link: "text-emerald-700 dark:text-emerald-400 underline-offset-4 hover:underline focus-visible:ring-emerald-500/50 dark:focus-visible:ring-emerald-400/40",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
