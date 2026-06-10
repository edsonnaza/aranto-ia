import { useRef } from 'react'
import { ImageIcon, UploadCloud } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FileUploadFieldProps {
  id: string
  accept?: string
  onChange: (file: File | null) => void
  fileName?: string | null
  hasExistingFile?: boolean
  error?: string
  placeholder: string
  hint?: string
  note?: string
  disabled?: boolean
}

export function FileUploadField({
  id,
  accept,
  onChange,
  fileName,
  hasExistingFile = false,
  error,
  placeholder,
  hint,
  note,
  disabled = false,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full items-center gap-3 rounded-md border border-emerald-300 bg-white px-3 py-3 text-left shadow-xs transition-[color,box-shadow] outline-none',
          'focus-visible:border-emerald-500 focus-visible:ring-[3px] focus-visible:ring-emerald-500/30',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <ImageIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900">
            {fileName || (hasExistingFile ? 'Imagen actual cargada' : placeholder)}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {hint || 'PNG, JPG o WEBP hasta 2 MB.'}
          </div>
        </div>

        <div className="pointer-events-none inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-xs">
          <UploadCloud className="h-4 w-4" />
          Seleccionar
        </div>
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && note && <p className="text-xs text-amber-700">{note}</p>}
    </div>
  )
}
