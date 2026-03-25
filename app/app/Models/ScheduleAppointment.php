<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleAppointment extends Model
{
    use Auditable;

    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_CHECKED_IN = 'checked_in';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no_show';

    public const SOURCE_AGENDA = 'agenda';
    public const SOURCE_RECEPTION = 'reception';
    public const SOURCE_MANUAL = 'manual';

    protected $fillable = [
        'professional_id',
        'patient_id',
        'medical_service_id',
        'medical_service_ids',
        'service_request_id',
        'appointment_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'status',
        'source',
        'notes',
        'cancellation_reason',
        'checked_in_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'medical_service_ids' => 'array',
        'duration_minutes' => 'integer',
        'checked_in_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function medicalService(): BelongsTo
    {
        return $this->belongsTo(MedicalService::class);
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [self::STATUS_CANCELLED, self::STATUS_NO_SHOW]);
    }
}