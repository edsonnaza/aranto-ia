<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Patient extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'document_type',
        'document_number',
        'first_name',
        'last_name',
        'date_of_birth',
        'phone',
        'email',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'insurance_type_id',
        'insurance_number',
        'insurance_expiry_date',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_of_birth' => 'date',
        'insurance_expiry_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the insurance type for this patient.
     */
    public function insuranceType(): BelongsTo
    {
        return $this->belongsTo(InsuranceType::class);
    }

    /**
     * Check if this patient is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get full name attribute.
     */
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * Get formatted document attribute.
     */
    public function getFormattedDocumentAttribute(): string
    {
        return $this->document_type . ': ' . $this->document_number;
    }

    /**
     * Get age attribute.
     */
    public function getAgeAttribute(): int
    {
        return $this->date_of_birth->age;
    }

    /**
     * Check if insurance is active and not expired.
     */
    public function hasValidInsurance(): bool
    {
        if (!$this->insurance_type_id || !$this->insurance_number) {
            return false;
        }

        if ($this->insurance_expiry_date && $this->insurance_expiry_date->isPast()) {
            return false;
        }

        return $this->insuranceType && $this->insuranceType->isActive();
    }

    /**
     * Check if insurance will expire soon.
     */
    public function insuranceExpiresSoon(int $days = 30): bool
    {
        if (!$this->insurance_expiry_date) {
            return false;
        }

        return $this->insurance_expiry_date->diffInDays(now()) <= $days && 
               !$this->insurance_expiry_date->isPast();
    }

    /**
     * Scope to get only active patients.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to search patients by name or document.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($query) use ($search) {
            $query->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%");
        });
    }

    /**
     * Scope to filter by insurance type.
     */
    public function scopeByInsurance($query, $insuranceTypeId)
    {
        return $query->where('insurance_type_id', $insuranceTypeId);
    }

    /**
     * Scope to get patients with valid insurance.
     */
    public function scopeWithValidInsurance($query)
    {
        return $query->whereNotNull('insurance_type_id')
                    ->whereNotNull('insurance_number')
                    ->where(function ($query) {
                        $query->whereNull('insurance_expiry_date')
                              ->orWhere('insurance_expiry_date', '>=', now());
                    });
    }

    /**
     * Get formatted insurance info.
     */
    public function getInsuranceInfoAttribute(): string
    {
        if (!$this->hasValidInsurance()) {
            return 'Sin seguro válido';
        }

        $info = $this->insuranceType->name . ' - ' . $this->insurance_number;
        
        if ($this->insurance_expiry_date) {
            $info .= ' (Vence: ' . $this->insurance_expiry_date->format('d/m/Y') . ')';
        }

        return $info;
    }
}
