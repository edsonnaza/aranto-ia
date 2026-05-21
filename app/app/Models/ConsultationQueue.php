<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class ConsultationQueue
 *
 * @property int $id
 * @property int $patient_id
 * @property int|null $reception_id
 * @property int|null $doctor_id
 * @property string $status
 * @property int|null $priority
 * @property \Illuminate\Support\Carbon|null $called_at
 * @property \Illuminate\Support\Carbon|null $started_at
 * @property \Illuminate\Support\Carbon|null $finished_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \App\Models\Patient $patient
 * @property-read \App\Models\User|null $doctor
 */
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
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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
