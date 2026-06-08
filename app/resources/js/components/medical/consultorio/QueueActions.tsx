import { Button } from '@/components/ui/button'
import type { QueueItem } from '@/hooks/medical/useConsultorioRealtime'

interface QueueActionsProps {
  item: QueueItem
  onCall: () => void
  onStart: () => void
}

const isWaiting = (status: string) => status === 'waiting'
const isCalled = (status: string) => status === 'called'
const isInConsultation = (status: string) => status === 'in_consultation'

export default function QueueActions({ item, onCall, onStart }: QueueActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onCall}
        disabled={!isWaiting(item.status)}
      >
        Llamar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onStart}
        disabled={!isCalled(item.status)}
      >
        Iniciar
      </Button>
    </div>
  )
}
