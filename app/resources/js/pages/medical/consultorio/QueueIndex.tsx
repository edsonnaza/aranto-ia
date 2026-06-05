import { Head, router, usePage } from '@inertiajs/react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import AppLayout from '@/layouts/app-layout'
import useConsultorioRealtime, {
  QueueItem,
  QueuePagination,
  RealtimePayload,
} from '@/hooks/medical/useConsultorioRealtime'
import QueueHeader from '@/components/medical/consultorio/QueueHeader'
import QueueCard from '@/components/medical/consultorio/QueueCard'
import EmptyQueueState from '@/components/medical/consultorio/EmptyQueueState'
import PaginationControls from '@/components/medical/consultorio/PaginationControls'

interface QueueIndexProps {
  queue: QueuePagination
}

const enrichQueueItem = (payload: RealtimePayload): QueueItem => ({
  id: payload.id,
  patient: {
    id: payload.patient.id,
    first_name: '',
    last_name: '',
    display: payload.patient.name,
  },
  status: payload.status,
  priority: payload.priority ?? 'normal',
  created_at: payload.created_at ?? new Date().toISOString(),
  called_at: payload.called_at ?? null,
  started_at: payload.started_at ?? null,
  finished_at: payload.finished_at ?? null,
})

interface PageProps {
  auth?: {
    user?: {
      id: number
    }
  }
}

export default function QueueIndex({ queue }: QueueIndexProps) {
  const page = usePage<PageProps & Record<string, unknown>>()
  const doctorId = page.props?.auth?.user?.id ?? null
  const [itemMap, setItemMap] = useState<Record<number, QueueItem>>({})
  const [removedIds, setRemovedIds] = useState<number[]>([])

  const queueItems = useMemo(() => {
    const baseItems = queue.data ?? []
    const merged = baseItems
      .map((item) => itemMap[item.id] ?? item)
      .filter((item) => !removedIds.includes(item.id))

    const extraItems = Object.values(itemMap).filter(
      (item) => !baseItems.some((baseItem) => baseItem.id === item.id) && !removedIds.includes(item.id)
    )

    return [...extraItems, ...merged]
  }, [queue.data, itemMap, removedIds])

  const updateItem = useCallback((payload: RealtimePayload) => {
    setItemMap((prev) => ({
      ...prev,
      [payload.id]: {
        ...(prev[payload.id] ?? enrichQueueItem(payload)),
        status: payload.status,
        called_at: payload.called_at ?? prev[payload.id]?.called_at ?? null,
        started_at: payload.started_at ?? prev[payload.id]?.started_at ?? null,
        finished_at: payload.finished_at ?? prev[payload.id]?.finished_at ?? null,
      },
    }))
  }, [])

  const removeItem = useCallback((payload: RealtimePayload) => {
    setRemovedIds((current) => (current.includes(payload.id) ? current : [...current, payload.id]))
  }, [])

  useConsultorioRealtime(doctorId, {
    onPatientAdded(payload) {
      setRemovedIds((current) => current.filter((id) => id !== payload.id))
      setItemMap((current) => {
        if (current[payload.id]) {
          return current
        }

        toast.success('Nuevo paciente en tu cola')
        return {
          ...current,
          [payload.id]: enrichQueueItem(payload),
        }
      })
    },
    onPatientCalled(payload) {
      updateItem(payload)
      toast.success('Paciente llamado')
    },
    onPatientStarted(payload) {
      updateItem(payload)
      toast('Paciente en consulta')
    },
    onPatientFinished(payload) {
      removeItem(payload)
      toast.success('Consulta finalizada')
    },
    playSound: true,
  })

  const handleCall = useCallback((itemId: number) => {
    router.post(`/medical/consultorio/queue/${itemId}/call`)
  }, [])

  const handleStart = useCallback((itemId: number) => {
    router.post(`/medical/consultorio/queue/${itemId}/start`)
  }, [])

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Consultorio', href: '/medical/consultorio' },
        { title: 'Lista de Espera', href: '' },
      ]}
    >
      <Head title="Lista de Espera - Consultorio" />

      <div className="space-y-6">
        <QueueHeader pagination={queue} />

        <section className="space-y-4">
          {queueItems.length === 0 ? (
            <EmptyQueueState />
          ) : (
            queueItems.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                onCall={() => handleCall(item.id)}
                onStart={() => handleStart(item.id)}
              />
            ))
          )}
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <div className="text-sm text-slate-500">Actualización realtime activa para tu cola de consultorio.</div>
          <PaginationControls links={queue.links} />
        </footer>
      </div>
    </AppLayout>
  )
}
