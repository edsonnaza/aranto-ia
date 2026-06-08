import { useRefundServicePayment } from '@/hooks/useRefundServicePayment'
import React, { useState } from 'react'

interface Props {
  serviceRequestId: number
  transactionId?: number
  amount: number
}

export function RefundButton({ serviceRequestId, transactionId, amount }: Props) {
  const { refundServicePayment, loading, error } = useRefundServicePayment()
  const [reason, setReason] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRefund = () => {
    setSuccess(false)
    refundServicePayment({
      service_request_id: serviceRequestId,
      transaction_id: transactionId,
      amount,
      reason,
    }, {
      onSuccess: () => setSuccess(true),
      onError: () => setSuccess(false),
    })
  }

  return (
    <div className="space-y-2">
      <input
        type="number"
        min={0.01}
        step={0.01}
        value={amount}
        disabled
        className="border rounded px-2 py-1 w-full"
        placeholder="Monto a devolver"
      />
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="border rounded px-2 py-1 w-full"
        placeholder="Motivo de la devolución (opcional)"
        rows={2}
      />
      <button
        type="button"
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        disabled={loading || amount <= 0}
        onClick={handleRefund}
      >
        Cancelar/Reembolsar
      </button>
      {error && (
        <div className="text-red-500 mt-2">{error}</div>
      )}
      {success && (
        <div className="text-green-600 mt-2">Reembolso realizado correctamente</div>
      )}
    </div>
  )
}
