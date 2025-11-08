<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InsuranceType extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'code',
        'description',
        'requires_authorization',
        'coverage_percentage',
        'has_copay',
        'copay_amount',
        'contact_name',
        'contact_phone',
        'contact_email',
        'billing_address',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'requires_authorization' => 'boolean',
        'coverage_percentage' => 'decimal:2',
        'has_copay' => 'boolean',
        'copay_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all service prices for this insurance type.
     */
    public function servicePrices(): HasMany
    {
        return $this->hasMany(ServicePrice::class);
    }

    /**
     * Get all patients with this insurance type.
     */
    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    /**
     * Check if this insurance type is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if this insurance type requires authorization.
     */
    public function requiresAuthorization(): bool
    {
        return $this->requires_authorization;
    }

    /**
     * Check if this insurance type has copay.
     */
    public function hasCopay(): bool
    {
        return $this->has_copay;
    }

    /**
     * Get the copay amount formatted.
     */
    public function getFormattedCopayAttribute(): string
    {
        if (!$this->has_copay) {
            return 'Sin copago';
        }

        return '₲ ' . number_format($this->copay_amount, 0, ',', '.');
    }

    /**
     * Get the coverage percentage formatted.
     */
    public function getFormattedCoverageAttribute(): string
    {
        return $this->coverage_percentage . '%';
    }

    /**
     * Scope to get only active insurance types.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get insurance types that require authorization.
     */
    public function scopeRequiresAuthorization($query)
    {
        return $query->where('requires_authorization', true);
    }

    /**
     * Calculate patient amount after insurance coverage.
     */
    public function calculatePatientAmount(float $totalAmount): array
    {
        $coverageAmount = $totalAmount * ($this->coverage_percentage / 100);
        $patientAmount = $totalAmount - $coverageAmount;
        
        if ($this->has_copay) {
            $patientAmount += $this->copay_amount;
        }

        return [
            'total_amount' => $totalAmount,
            'coverage_amount' => $coverageAmount,
            'patient_amount' => $patientAmount,
            'copay_amount' => $this->has_copay ? $this->copay_amount : 0,
        ];
    }
}
