<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $document_type
 * @property string $document_number
 * @property string $first_name
 * @property string $last_name
 * @property \Illuminate\Support\Carbon|null $date_of_birth
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $address
 * @property string|null $professional_license
 * @property \Illuminate\Support\Carbon|null $license_expiry_date
 * @property string|null $title
 * @property float $commission_percentage
 * @property string $commission_calculation_method
 * @property string $status
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $hire_date
 * @property \Illuminate\Support\Carbon|null $termination_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read string $full_name
 * @property-read string $formatted_document
 * @property-read float $years_of_service
 * @property-read string $commission_method_description
 */
class Professional extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'document_type',
        'document_number',
        'identification',
        'license_number',
        'first_name',
        'last_name',
        'date_of_birth',
        'phone',
        'email',
        'address',
        'professional_license',
        'license_expiry_date',
        'title',
        'commission_percentage',
        'commission_calculation_method',
        'status',
        'hire_date',
        'termination_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_of_birth' => 'datetime',
        'license_expiry_date' => 'datetime',
        'commission_percentage' => 'float',
        'hire_date' => 'datetime',
        'termination_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Boot the model. Always eager load commissionSettings.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::addGlobalScope('with_commission_settings', function ($builder) {
            $builder->with('commissionSettings');
        });
    }

    /**
     * Get the specialties for this professional.
     */
    public function specialties(): BelongsToMany
    {
        return $this->belongsToMany(Specialty::class, 'professional_specialties')
                    ->withPivot(['certification_date', 'certification_number', 'is_primary'])
                    ->withTimestamps();
    }

    /**
     * Get primary specialty for this professional (as relationship).
     */
    public function specialty()
    {
        return $this->belongsToMany(Specialty::class, 'professional_specialties')
                    ->withPivot(['certification_date', 'certification_number', 'is_primary'])
                    ->wherePivot('is_primary', true)
                    ->limit(1);
    }

    /**
     * Get primary specialty for this professional (as relationship).
     */
    public function primarySpecialty()
    {
        return $this->belongsToMany(Specialty::class, 'professional_specialties')
                    ->withPivot(['certification_date', 'certification_number', 'is_primary'])
                    ->wherePivot('is_primary', true)
                    ->limit(1);
    }

    /**
     * Get commissions for this professional.
     */
    public function commissions(): HasMany
    {
        return $this->hasMany(ProfessionalCommission::class);
    }

    /**
     * Get commission settings for this professional.
     */
    public function commissionSettings()
    {
        return $this->hasOne(ProfessionalCommissionSettings::class);
    }

    /**
     * Get services associated with this professional.
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(MedicalService::class, 'professional_services')
                    ->withTimestamps();
    }

    /**
     * Check if this professional is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->termination_date === null;
    }

    /**
     * Get full name attribute.
     */
    public function getFullNameAttribute(): string
    {
        return trim($this->title . ' ' . $this->first_name . ' ' . $this->last_name);
    }

    /**
     * Get formatted document attribute.
     */
    public function getFormattedDocumentAttribute(): string
    {
        return $this->document_type . ': ' . $this->document_number;
    }

    /**
     * Check if license is valid and not expired.
     */
    public function hasValidLicense(): bool
    {
        if (!$this->professional_license) {
            return false;
        }

        if ($this->license_expiry_date && $this->license_expiry_date->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Check if license will expire soon.
     */
    public function licenseExpiresSoon(int $days = 30): bool
    {
        if (!$this->license_expiry_date) {
            return false;
        }

        return $this->license_expiry_date->diffInDays(now()) <= $days && 
               !$this->license_expiry_date->isPast();
    }

    /**
     * Calculate commission for a given amount.
     */
    public function calculateCommission(float $amount): float
    {
        $percentage = $this->commission_percentage;
        return $amount * ($percentage / 100);
    }

    /**
     * Get years of service.
     */
    public function getYearsOfServiceAttribute(): float
    {
        $endDate = $this->termination_date ?? now();
        return $this->hire_date->diffInYears($endDate, true);
    }

    /**
     * Scope to get only active professionals.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->whereNull('termination_date');
    }

    /**
     * Scope to search professionals by name, document or license.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($query) use ($search) {
            $query->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%")
                  ->orWhere('professional_license', 'like', "%{$search}%");
        });
    }

    /**
     * Scope to filter by specialty.
     */
    public function scopeBySpecialty($query, $specialtyId)
    {
        return $query->whereHas('specialties', function ($query) use ($specialtyId) {
            $query->where('specialty_id', $specialtyId);
        });
    }

    /**
     * Scope to get professionals with valid licenses.
     */
    public function scopeWithValidLicense($query)
    {
        return $query->whereNotNull('professional_license')
                    ->where(function ($query) {
                        $query->whereNull('license_expiry_date')
                              ->orWhere('license_expiry_date', '>=', now());
                    });
    }

    /**
     * Get commission calculation method description.
     */
    public function getCommissionMethodDescriptionAttribute(): string
    {
        return match($this->commission_calculation_method) {
            'percentage' => 'Porcentaje fijo',
            'fixed' => 'Monto fijo',
            'tiered' => 'Escalonado',
            default => 'No definido'
        };
    }

    /**
     * Add specialty to professional.
     */
    public function addSpecialty(Specialty $specialty, array $pivotData = []): void
    {
        $this->specialties()->attach($specialty->id, array_merge([
            'certification_date' => now(),
            'is_primary' => false,
        ], $pivotData));
    }

    /**
     * Set primary specialty.
     */
    public function setPrimarySpecialty(Specialty $specialty): void
    {
        // Remove primary from all specialties
        $this->specialties()->updateExistingPivot($this->specialties->pluck('id'), ['is_primary' => false]);
        
        // Set new primary
        $this->specialties()->updateExistingPivot($specialty->id, ['is_primary' => true]);
    }
}
