<?php

namespace App\Notifications;

use App\Models\ServiceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CashPendingServiceNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ServiceRequest $serviceRequest,
        public string $message,
        public string $type,
    ) {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => $this->message,
            'href' => '/cash-register/pending-services',
            'source' => 'cash',
            'type' => $this->type,
            'service_request' => [
                'id' => $this->serviceRequest->id,
                'request_number' => $this->serviceRequest->request_number,
                'patient_name' => $this->serviceRequest->patient?->full_name,
                'payment_status' => $this->serviceRequest->payment_status,
                'status' => $this->serviceRequest->status,
            ],
        ];
    }
}
