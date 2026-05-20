<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
