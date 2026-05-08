<?php

namespace App\Notifications;

use App\Models\ServiceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReceptionPaymentUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ServiceRequest $serviceRequest,
        public string $message,
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
            'href' => '/medical/reception',
            'source' => 'reception',
            'type' => 'payment-updated',
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
