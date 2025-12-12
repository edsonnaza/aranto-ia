import React from 'react'
import { Check, ChevronsUpDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import type { Professional } from '@/types/medical'

interface ProfessionalSelectorProps {
  professionals: Professional[]
  selectedProfessional?: Professional | null
  onProfessionalSelect: (professional: Professional | null) => void
  placeholder?: string
  disabled?: boolean
  showCommission?: boolean
}

export default function ProfessionalSelector({
  professionals,
  selectedProfessional,
  onProfessionalSelect,
  placeholder = "Seleccionar profesional...",
  disabled = false,
  showCommission = true,
}: ProfessionalSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (professional: Professional) => {
    onProfessionalSelect(professional)
    setOpen(false)
  }

  const handleClear = () => {
    onProfessionalSelect(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProfessional ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">
                {selectedProfessional.first_name} {selectedProfessional.last_name}
              </span>
              {showCommission && selectedProfessional.commission_percentage && (
                <Badge variant="secondary" className="ml-2">
                  {selectedProfessional.commission_percentage}%
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar profesional..." />
          <CommandList>
            <CommandEmpty>No se encontraron profesionales.</CommandEmpty>
            <CommandGroup>
              {professionals.map((professional) => (
                <CommandItem
                  key={professional.id}
                  value={`${professional.first_name} ${professional.last_name} ${professional.license_number || ''}`}
                  onSelect={() => handleSelect(professional)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProfessional?.id === professional.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {professional.first_name} {professional.last_name}
                      </span>
                      {professional.license_number && (
                        <span className="text-sm text-muted-foreground">
                          Lic. {professional.license_number}
                        </span>
                      )}
                      {professional.email && (
                        <span className="text-sm text-muted-foreground">
                          {professional.email}
                        </span>
                      )}
                    </div>
                    {showCommission && professional.commission_percentage && (
                      <Badge variant="outline">
                        {professional.commission_percentage}% comisión
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedProfessional && (
              <CommandGroup>
                <CommandItem onSelect={handleClear}>
                  <span className="text-muted-foreground">Limpiar selección</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}