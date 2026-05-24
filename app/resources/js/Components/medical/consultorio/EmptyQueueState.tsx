import { Button } from '@/components/ui/button'
import { Link } from '@inertiajs/react'

export default function EmptyQueueState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Cola vacía</p>
      <h2 className="mt-3 text-xl font-semibold text-slate-900">No hay pacientes activos en tu turno</h2>
      <p className="mt-2 text-sm text-slate-600">Cuando un paciente llegue a tu consultorio, aparecerá aquí en tiempo real.</p>
      <Link href="/medical/consultorio/waiting-room" className="inline-block mt-5">
        <Button variant="default">Ver sala de espera pública</Button>
      </Link>
    </div>
  )
}
