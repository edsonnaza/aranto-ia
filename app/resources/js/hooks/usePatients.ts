import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import { patientRoutes } from '@/config/routes'

/**
 * Custom hook for patient-related API operations
 * Centralizes all patient route handling in one place
 * 
 * Routes are configured in resources/js/config/routes.ts
 * Which sources from .env variables
 * If routes change, update .env or config/routes.ts
 * 
 * Usage:
 * ```tsx
 * const { deletePatient, isDeleting } = usePatients()
 * 
 * const handleDelete = async (patientId: number) => {
 *   await deletePatient(patientId)
 * }
 * ```
 */
export function usePatients() {
  const deletePatient = async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      router.delete(patientRoutes.delete(id), {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Paciente eliminado correctamente')
          resolve()
        },
        onError: () => {
          toast.error('Error al eliminar el paciente')
          reject(new Error('Failed to delete patient'))
        },
      })
    })
  }

  const viewPatient = (id: number): void => {
    router.visit(patientRoutes.show(id))
  }

  const editPatient = (id: number): void => {
    router.visit(patientRoutes.edit(id))
  }

  const createPatient = (): void => {
    router.visit(patientRoutes.create())
  }

  return {
    deletePatient,
    viewPatient,
    editPatient,
    createPatient,
  }
}
