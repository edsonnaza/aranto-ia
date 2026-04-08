<?php

namespace App\Events;

use App\Models\ServiceRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PendingServicePaymentRequested implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public ServiceRequest $serviceRequest)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('cash-register.pending-services')];
    }

    public function broadcastAs(): string
    {
        return 'cash-register.pending-service-created';
    }

    public function broadcastWith(): array
    {
        $serviceRequest = $this->serviceRequest->loadMissing(['patient', 'details']);

        return [
            'message' => sprintf(
                'Nueva solicitud pendiente para cobrar: %s',
                $serviceRequest->request_number,
            ),
            'service_request' => [
                'id' => $serviceRequest->id,
                'request_number' => $serviceRequest->request_number,
                'patient_name' => $serviceRequest->patient?->full_name,
                'total_amount' => (float) $serviceRequest->total_amount,
                'request_date' => $serviceRequest->request_date?->format('Y-m-d'),
                'request_time' => $serviceRequest->request_time,
                'reception_type' => $serviceRequest->reception_type,
                'services_count' => $serviceRequest->details->count(),
            ],
        ];
    }
}