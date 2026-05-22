<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\ServiceRequest;
use App\Models\Professional;
use App\Models\User;
use App\Events\PatientEnteredQueue;
use Illuminate\Support\Facades\Log;

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

    /**
     * Enqueue or update a consultation queue entry from a ServiceRequest.
     * Returns the ConsultationQueue entry or null on failure.
     *
     * @param ServiceRequest $serviceRequest
     * @param int|null $doctorUserId  User id of the doctor (optional, will try to resolve)
     * @param string|null $priority   'normal'|'urgent' (optional)
     * @return ?self
     */
    public static function enqueueFromServiceRequest(ServiceRequest $serviceRequest, ?int $doctorUserId = null, ?string $priority = null): ?self
    {
        try {
            // Try to resolve doctor user id from service request details if not provided
            if (empty($doctorUserId)) {
                $assignedProfessionalId = $serviceRequest->details()->whereNotNull('professional_id')->pluck('professional_id')->first();
                if ($assignedProfessionalId) {
                    $professional = Professional::find($assignedProfessionalId);
                    $doctorUserId = $professional?->user_id ?? null;
                    if (!$doctorUserId && $professional?->email) {
                        $linkedUser = User::where('email', $professional->email)->first();
                        if ($linkedUser && method_exists($linkedUser, 'hasRole') && $linkedUser->hasRole('doctor')) {
                            $doctorUserId = $linkedUser->id;
                        }
                    }
                }
            }

            if (empty($doctorUserId)) {
                Log::warning('No doctor user id found when enqueuing from service request', ['service_request_id' => $serviceRequest->id]);
                return null;
            }

            // Normalize priority
            if (empty($priority)) {
                $priority = ($serviceRequest->priority === 'urgent') ? 'urgent' : 'normal';
            }

            // Prevent duplicate: find existing active entry
            $existing = self::where('reception_id', $serviceRequest->id)
                ->whereIn('status', ['waiting', 'called', 'in_consultation'])
                ->first();

            if ($existing) {
                if ($existing->doctor_id != $doctorUserId || $existing->priority != $priority) {
                    $existing->doctor_id = $doctorUserId;
                    $existing->priority = $priority;
                    $existing->save();
                    event(new PatientEnteredQueue($existing));
                } else {
                    Log::info('Patient already queued with same doctor and priority', ['reception_id' => $serviceRequest->id, 'doctor_id' => $doctorUserId]);
                }

                return $existing;
            }

            $entry = self::create([
                'patient_id' => $serviceRequest->patient_id,
                'reception_id' => $serviceRequest->id,
                'doctor_id' => $doctorUserId,
                'priority' => $priority,
                'status' => 'waiting',
            ]);

            event(new PatientEnteredQueue($entry));

            return $entry;
        } catch (\Throwable $e) {
            Log::error('Error enqueuing service request to consultation queue', ['error' => $e->getMessage(), 'service_request_id' => $serviceRequest->id ?? null]);
            return null;
        }
    }
}
