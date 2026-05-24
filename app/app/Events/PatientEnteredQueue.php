<?php

namespace App\Events;

use App\Models\ConsultationQueue;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class PatientEnteredQueue implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public ConsultationQueue $entry;

    public function __construct(ConsultationQueue $entry)
    {
        $this->entry = $entry->load('patient');
    }

    public function broadcastOn()
    {
        return [
            new PrivateChannel('doctor.' . $this->entry->doctor_id . '.queue'),
            new PrivateChannel('consultorio.' . $this->entry->doctor_id),
            new Channel('waiting-room'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'patient.added';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->entry->id,
            'patient' => [
                'id' => $this->entry->patient->id,
                'name' => $this->entry->patient->full_name ?? ($this->entry->patient->first_name . ' ' . $this->entry->patient->last_name),
            ],
            'doctor_id' => $this->entry->doctor_id,
            'status' => $this->entry->status,
            'priority' => $this->entry->priority,
            'created_at' => $this->entry->created_at?->toDateTimeString(),
        ];
    }
}
