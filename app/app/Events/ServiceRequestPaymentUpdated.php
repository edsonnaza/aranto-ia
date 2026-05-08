<?php

namespace App\Events;

use App\Models\ServiceRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ServiceRequestPaymentUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public ServiceRequest $serviceRequest)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('medical.reception.service-requests')];
    }

    public function broadcastAs(): string
    {
        return 'medical.reception.payment-updated';
    }

    public function broadcastWith(): array
    {
        $serviceRequest = $this->serviceRequest->loadMissing(['patient', 'details']);

        $message = $serviceRequest->payment_status === ServiceRequest::PAYMENT_PAID
            ? sprintf('Pago completado en caja: %s', $serviceRequest->request_number)
            : sprintf('Pago parcial registrado en caja: %s', $serviceRequest->request_number);

        return [
            'message' => $message,
            'service_request' => [
                'id' => $serviceRequest->id,
                'request_number' => $serviceRequest->request_number,
                'patient_name' => $serviceRequest->patient?->full_name,
                'total_amount' => (float) $serviceRequest->total_amount,
                'paid_amount' => (float) $serviceRequest->paid_amount,
                'payment_status' => $serviceRequest->payment_status,
                'status' => $serviceRequest->status,
                'request_date' => $serviceRequest->request_date?->format('Y-m-d'),
                'request_time' => $serviceRequest->request_time,
                'reception_type' => $serviceRequest->reception_type,
                'services_count' => $serviceRequest->details->count(),
            ],
        ];
    }
}
