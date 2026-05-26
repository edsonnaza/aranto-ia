<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PatientCalled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $patientId,
        public string $patientName,
        public ?int $doctorId = null,
        public ?string $doctorName = null
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('waiting-room'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'patient.called';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->patientId,
            'patient' => ['name' => $this->patientName],
            'doctor_id' => $this->doctorId,
            'doctor_name' => $this->doctorName,
            'called_at' => now()->toIso8601String(),
        ];
    }
}