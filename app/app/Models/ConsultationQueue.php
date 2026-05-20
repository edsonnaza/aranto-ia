<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationQueue extends Model
{
    protected $table = 'consultation_queue';

    protected $fillable = [
        'patient_id',
        'reception_id',
        'doctor_id',
        'status',
        'priority',
        'called_at',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'called_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function reception(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'reception_id');
    }

    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting');
    }

    public function scopeCalled($query)
    {
        return $query->where('status', 'called');
    }

    public function scopeInConsultation($query)
    {
        return $query->where('status', 'in_consultation');
    }
}
