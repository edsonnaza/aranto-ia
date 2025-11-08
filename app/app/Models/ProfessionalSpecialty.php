<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessionalSpecialty extends Pivot
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'professional_specialties';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'professional_id',
        'specialty_id',
        'certification_date',
        'certification_number',
        'is_primary',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'certification_date' => 'date',
        'is_primary' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the professional that owns this certification.
     */
    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }

    /**
     * Get the specialty for this certification.
     */
    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    /**
     * Check if this is a primary specialty.
     */
    public function isPrimary(): bool
    {
        return $this->is_primary;
    }

    /**
     * Scope to get only primary specialties.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to get certifications for a specific professional.
     */
    public function scopeForProfessional($query, $professionalId)
    {
        return $query->where('professional_id', $professionalId);
    }

    /**
     * Scope to get certifications for a specific specialty.
     */
    public function scopeForSpecialty($query, $specialtyId)
    {
        return $query->where('specialty_id', $specialtyId);
    }

    /**
     * Get formatted certification info.
     */
    public function getFormattedCertificationAttribute(): string
    {
        $info = $this->specialty->name;
        
        if ($this->certification_number) {
            $info .= ' (Cert: ' . $this->certification_number . ')';
        }
        
        if ($this->certification_date) {
            $info .= ' - Desde: ' . $this->certification_date->format('d/m/Y');
        }
        
        if ($this->is_primary) {
            $info .= ' [PRINCIPAL]';
        }

        return $info;
    }
}
