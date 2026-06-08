import { ReactNode } from 'react'

interface SelectItemProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  required?: boolean
  className?: string
}

export default function SelectItem({ 
  value, 
  onValueChange, 
  children, 
  required = false,
  className = ""
}: SelectItemProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      required={required}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    >
      {children}
    </select>
  )
}