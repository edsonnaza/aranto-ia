import { useRefundServicePayment } from '@/hooks/useRefundServicePayment'

interface Props {
  serviceRequestId: number
}

export function RefundButton({ serviceRequestId }: Props) {
  const { refund, loading, error, result } = useRefundServicePayment()

  return (
    <div>
      <button
        type="button"
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        disabled={loading}
        onClick={() => refund(serviceRequestId)}
      >
        Cancelar/Reembolsar
      </button>
      {error && (
        <div className="text-red-500 mt-2">{error}</div>
      )}
      {result?.success && (
        <div className="text-green-600 mt-2">Reembolso realizado correctamente</div>
      )}
    </div>
  )
}
