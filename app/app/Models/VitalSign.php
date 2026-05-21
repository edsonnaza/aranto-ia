<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class VitalSign
 *
 * @property int $id
 * @property int $patient_id
 * @property int|null $medical_record_id
 * @property float|null $temperature
 * @property int|null $pulse
 * @property int|null $spo2
 * @property int|null $respiratory_rate
 * @property int|null $bp_systolic
 * @property int|null $bp_diastolic
 * @property string|null $blood_pressure
 * @property \Illuminate\Support\Carbon|null $recorded_at
 *
 * @property-read \App\Models\Patient $patient
 * @property-read \App\Models\MedicalRecord|null $medicalRecord
 */
class VitalSign extends Model
{
    use HasFactory;

    protected $table = 'vital_signs';

    protected $fillable = [
        'patient_id',
        'medical_record_id',
        'temperature',
        'pulse',
        'spo2',
        'respiratory_rate',
        'bp_systolic',
        'bp_diastolic',
        'blood_pressure',
        'recorded_at',
    ];

    protected $casts = [
        'temperature' => 'float',
        'pulse' => 'integer',
        'spo2' => 'integer',
        'respiratory_rate' => 'integer',
        'bp_systolic' => 'integer',
        'bp_diastolic' => 'integer',
        'recorded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function medicalRecord(): BelongsTo
    {
        return $this->belongsTo(MedicalRecord::class);
    }

    // Scopes / helpers
    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeLatestForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId)->orderByDesc('recorded_at')->orderByDesc('created_at');
    }

    public static function lastForPatient($patientId)
    {
        return self::where('patient_id', $patientId)->orderByDesc('recorded_at')->orderByDesc('created_at')->first();
    }
}
