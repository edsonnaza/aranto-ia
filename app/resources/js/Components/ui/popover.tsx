import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

export interface PopoverContentProps extends PopoverPrimitive.PopoverContentProps {
  align?: "start" | "center" | "end"
  className?: string
}

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ align = "center", className, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={4}
    className={`z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${className || ""}`}
    {...props}
  />
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName
