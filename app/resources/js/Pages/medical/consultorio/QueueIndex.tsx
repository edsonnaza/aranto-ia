import React from 'react'
import { Head, router, Link } from '@inertiajs/react'
import { useConsultorioNotifications } from '@/hooks/medical/useConsultorioNotifications'
import { toast } from 'sonner'
import { getPriorityLabel, getQueueStatusLabel } from '@/utils/formatters'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'

interface QueueIndexProps {
  queue: any
}

export default function QueueIndex({ queue }: QueueIndexProps) {
  function playDing() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.value = 0.03
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      setTimeout(() => { o.stop(); ctx.close().catch(() => {}) }, 180)
    } catch (e) {
      // ignore audio errors
    }
  }

  useConsultorioNotifications(() => {
    // Reproducir sonido y recargar la lista de la cola cuando entra un paciente nuevo
    playDing()
    toast.success('Nuevo paciente en la cola')
    router.reload({ only: ['queue'], preserveUrl: true })
  })

  return (
    <AppLayout breadcrumbs={[{ title: 'Consultorio', href: '/medical/consultorio' }, { title: 'Lista de Espera', href: '' }]}> 
      <Head title="Lista de Espera - Consultorio" />

      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Mi Cola de Pacientes</h1>

        <div className="space-y-2">
          {queue.data?.length ? queue.data.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{item.patient.display}</div>
                <div className="text-sm text-gray-500">Prioridad: {getPriorityLabel(item.priority)} • {item.created_at}{item.status ? ` • ${getQueueStatusLabel(item.status)}` : ''}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/medical/patients/${item.patient.id}/medical-records/create`} className="inline-block">
                  <Button>Atender</Button>
                </Link>
                <Button variant="outline" onClick={() => router.post(`/medical/consultorio/queue/${item.id}/call`)}>Llamar</Button>
                <Button variant="ghost" onClick={() => router.post(`/medical/consultorio/queue/${item.id}/start`)}>Iniciar</Button>
              </div>
            </div>
          )) : (
            <div className="text-gray-500">No hay pacientes en la cola.</div>
          )}
        </div>

        <div className="pt-4">
          {/* Simple pagination controls from Inertia paginator */}
          {queue.links?.map((link: any, idx: number) => (
            <span key={idx} className="mx-1" dangerouslySetInnerHTML={{ __html: link.url ? `<a href='${link.url}'>${link.label}</a>` : link.label }} />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
