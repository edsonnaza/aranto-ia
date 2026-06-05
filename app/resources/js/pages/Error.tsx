import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'

interface ErrorPageProps {
  status: number
  message?: string
}

export default function Error({ status, message }: ErrorPageProps) {
  const errors: Record<number, { title: string; description: string }> = {
    401: {
      title: 'No Autorizado',
      description: 'Debes estar autenticado para acceder a este recurso.'
    },
    403: {
      title: 'Acceso Prohibido',
      description: message || 'No tienes permiso para acceder a este recurso.'
    },
    404: {
      title: 'No Encontrado',
      description: 'La página que buscas no existe.'
    },
    500: {
      title: 'Error del Servidor',
      description: 'Hubo un error al procesar tu solicitud.'
    },
    503: {
      title: 'Servicio No Disponible',
      description: 'El servicio está temporalmente no disponible.'
    }
  }

  const error = errors[status] || {
    title: `Error ${status}`,
    description: message || 'Hubo un error al procesar tu solicitud.'
  }

  return (
    <AppLayout breadcrumbs={[]}>
      <Head title={`Error ${status}`} />
      
      <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-gray-900">{status}</h1>
            <h2 className="text-2xl font-semibold text-gray-900">
              {error.title}
            </h2>
            <p className="text-gray-600">
              {error.description}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.history.back()}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Volver atrás
            </button>
            
            <a
              href="/"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
