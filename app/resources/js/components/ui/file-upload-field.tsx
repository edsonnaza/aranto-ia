import { useRef } from 'react'
import { ImageIcon, MousePointerClick } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FileUploadFieldProps {
  id: string
  accept?: string
  onChange?: (file: File | null) => void
  onChangeMultiple?: (files: File[]) => void
  multiple?: boolean
  fileName?: string | null
  fileNames?: string[]
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
  onChangeMultiple,
  multiple = false,
  fileName,
  fileNames,
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
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (multiple) {
            onChangeMultiple?.(files)
          } else {
            onChange?.(files[0] ?? null)
          }

          event.target.value = ''
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group flex w-full cursor-pointer items-center gap-3 rounded-md border border-emerald-300 bg-white px-3 py-3 text-left shadow-xs transition-[color,box-shadow,background-color,border-color] outline-none hover:border-emerald-400 hover:bg-emerald-50/40',
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
            {multiple
              ? (fileNames?.length
                ? `${fileNames.length} archivo(s) seleccionados`
                : hasExistingFile
                  ? 'Archivos adjuntos cargados'
                  : placeholder)
              : (fileName || (hasExistingFile ? 'Imagen actual cargada' : placeholder))}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {hint || 'PNG, JPG o WEBP hasta 2 MB.'}
          </div>
        </div>

        <div className="pointer-events-none inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-xs transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-100">
          <MousePointerClick className="h-4 w-4" />
          Seleccionar
        </div>
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && note && <p className="text-xs text-amber-700">{note}</p>}
    </div>
  )
}
