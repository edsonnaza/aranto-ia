<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $description
 * @property bool $requires_authorization
 * @property float $coverage_percentage
 * @property bool $has_copay
 * @property float $copay_amount
 * @property string|null $contact_name
 * @property string|null $contact_phone
 * @property string|null $contact_email
 * @property string|null $billing_address
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * 
 * @property-read string $formatted_copay
 * @property-read string $formatted_coverage
 */
class InsuranceType extends Model
{
    /** @use HasFactory<\Database\Factories\InsuranceTypeFactory> */
    use HasFactory;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'coverage_percentage',
        'deductible_amount',
        'active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'active' => 'boolean',
        'coverage_percentage' => 'float',
        'deductible_amount' => 'float',
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
     * Get all patients with this insurance type (legacy single insurance).
     */
    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    /**
     * Get all patients with this insurance type via many-to-many.
     */
    public function patientsWithInsurance(): BelongsToMany
    {
        return $this->belongsToMany(Patient::class, 'patient_insurances')
            ->withPivot([
                'insurance_number',
                'valid_from',
                'valid_until', 
                'coverage_percentage',
                'is_primary',
                'status',
                'notes'
            ])
            ->withTimestamps();
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
        $coveragePercentage = $this->coverage_percentage;
        $copayAmount = $this->copay_amount;
        
        $coverageAmount = $totalAmount * ($coveragePercentage / 100);
        $patientAmount = $totalAmount - $coverageAmount;
        
        if ($this->has_copay) {
            $patientAmount += $copayAmount;
        }

        return [
            'total_amount' => $totalAmount,
            'coverage_amount' => $coverageAmount,
            'patient_amount' => $patientAmount,
            'copay_amount' => $this->has_copay ? $copayAmount : 0,
        ];
    }
}
