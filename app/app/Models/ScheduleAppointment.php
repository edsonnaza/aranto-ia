<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $professional_id
 * @property int $patient_id
 * @property int|null $medical_service_id
 * @property array|null $medical_service_ids
 * @property int|null $service_request_id
 * @property \Illuminate\Support\Carbon $appointment_date
 * @property string $start_time
 * @property string $end_time
 * @property int $duration_minutes
 * @property string $status
 * @property string $source
 * @property string|null $notes
 * @property string|null $cancellation_reason
 * @property \Illuminate\Support\Carbon|null $checked_in_at
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \App\Models\Professional|null $professional
 * @property-read \App\Models\Patient|null $patient
 * @property-read \App\Models\MedicalService|null $medicalService
 * @property-read \App\Models\ServiceRequest|null $serviceRequest
 */
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