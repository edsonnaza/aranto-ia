<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class MedicalRecord
 *
 * @property int $id
 * @property int $patient_id
 * @property int|null $doctor_id
 * @property \Illuminate\Support\Carbon|null $consultation_date
 * @property string|null $reason
 * @property array|null $vital_signs
 * @property int|null $created_by
 * @property int|null $updated_by
 *
 * @property-read \App\Models\Patient $patient
 * @property-read \App\Models\User|null $doctor
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\MedicalRecordFile[] $files
 */
class MedicalRecord extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $auditableEvents = ['created', 'updated', 'deleted'];

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'consultation_date',
        'reason',
        'symptoms',
        'diagnosis',
        'treatment',
        'notes',
        'vital_signs',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'consultation_date' => 'datetime',
        'vital_signs' => 'array',
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

    public function prescriptions(): HasMany
    {
        return $this->hasMany(MedicalPrescription::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(MedicalRecordFile::class);
    }

    public function amendments(): HasMany
    {
        return $this->hasMany(MedicalRecordAmendment::class)->orderBy('created_at', 'asc');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
