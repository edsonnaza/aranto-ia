import { useState } from 'react'

interface CodeGenerationOptions {
  name: string
  categoryId?: string | number | null
}

interface CodeGenerationResult {
  code: string
  is_valid: boolean
  is_unique: boolean
}

export interface UseServiceCodeGeneratorReturn {
  generatedCode: string
  isGenerating: boolean
  isCodeEditable: boolean
  error: string | null
  generateCode: (options: CodeGenerationOptions) => Promise<void>
  setCodeEditable: (editable: boolean) => void
  clearCode: () => void
}

/**
 * Hook para manejar la generación automática de códigos de servicio
 * Sigue el patrón de responsabilidad única y abstracción de datos
 */
export const useServiceCodeGenerator = (): UseServiceCodeGeneratorReturn => {
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCodeEditable, setIsCodeEditable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateCode = async (options: CodeGenerationOptions): Promise<void> => {
    const { name, categoryId } = options

    // Validar que tenemos los datos mínimos
    if (!name || name.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Obtener el token CSRF desde el meta tag
      const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

      if (!token) {
        throw new Error('Token CSRF no encontrado')
      }

      const response = await fetch('/medical/medical-services-generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name,
          category_id: categoryId ? Number(categoryId) : null,
        }),
      })

      if (!response.ok) {
        if (response.status === 419) {
          throw new Error('Sesión expirada. Por favor recarga la página.')
        }
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const result: CodeGenerationResult = await response.json()

      if (result && result.code) {
        setGeneratedCode(result.code)
      } else {
        throw new Error('No se pudo generar el código')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error generando código: ${errorMessage}`)
      console.error('Error en generación de código:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const setCodeEditable = (editable: boolean) => {
    setIsCodeEditable(editable)
    if (editable) {
      // Si se hace editable, limpiar el código generado
      setGeneratedCode('')
    }
    setError(null)
  }

  const clearCode = () => {
    setGeneratedCode('')
    setIsCodeEditable(false)
    setError(null)
  }

  return {
    generatedCode,
    isGenerating,
    isCodeEditable,
    error,
    generateCode,
    setCodeEditable,
    clearCode,
  }
}