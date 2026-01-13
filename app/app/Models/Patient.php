<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $document_type
 * @property string $document_number
 * @property string $first_name
 * @property string $last_name
 * @property \Illuminate\Support\Carbon $birth_date
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $address
 * @property string|null $emergency_contact_name
 * @property string|null $emergency_contact_phone
 * @property int|null $insurance_type_id
 * @property string|null $insurance_number
 * @property \Illuminate\Support\Carbon|null $insurance_valid_until
 * @property float|null $insurance_coverage_percentage
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * 
 * @property-read string $full_name
 * @property-read string $formatted_document
 * @property-read int $age
 * @property-read string $insurance_info
 */
class Patient extends Model
{
    /** @use HasFactory<\Database\Factories\PatientFactory> */
    use HasFactory;
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
        'birth_date',
        'gender',
        'phone',
        'email',
        'address',
        'city',
        'state',
        'postal_code',
        'emergency_contact_name',
        'emergency_contact_phone',
        'insurance_type_id',
        'insurance_number',
        'insurance_valid_until',
        'insurance_coverage_percentage',
        'status',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'birth_date' => 'date',
        'insurance_valid_until' => 'datetime',
        'insurance_coverage_percentage' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the primary insurance type for this patient (backward compatibility).
     */
    public function insuranceType(): BelongsTo
    {
        return $this->belongsTo(InsuranceType::class);
    }

    /**
     * Get all insurances for this patient (many-to-many).
     */
    public function insurances(): BelongsToMany
    {
        return $this->belongsToMany(InsuranceType::class, 'patient_insurances')
            ->withPivot([
                'insurance_number',
                'valid_from',
                'valid_until', 
                'coverage_percentage',
                'is_primary',
                'status',
                'notes'
            ])
            ->withTimestamps()
            ->wherePivot('status', 'active')
            ->orderByPivot('is_primary', 'desc');
    }

    /**
     * Get the primary insurance.
     */
    public function primaryInsurance(): BelongsToMany
    {
        return $this->insurances()
            ->wherePivot('is_primary', true);
    }

    /**
     * Get active insurances.
     */
    public function activeInsurances(): BelongsToMany
    {
        return $this->insurances()
            ->where('valid_until', '>=', now())
            ->orWhereNull('valid_until');
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
     * Get the patient's age in years.
     */
    public function getAgeAttribute(): int
    {
        if (!$this->birth_date) {
            return 0;
        }
        return $this->birth_date->age;
    }

    /**
     * Check if this patient has any valid insurance.
     */
    public function hasValidInsurance(): bool
    {
        // Check if has any active insurance via many-to-many
        $hasActiveInsurance = $this->activeInsurances()->exists();
        
        // Fallback to legacy single insurance for backward compatibility
        if (!$hasActiveInsurance && $this->insurance_type_id) {
            if (!$this->insurance_valid_until || $this->insurance_valid_until->isFuture()) {
                return $this->insuranceType && $this->insuranceType->status === 'active';
            }
        }
        
        return $hasActiveInsurance;
    }

    /**
     * Get the primary insurance info.
     */
    public function getPrimaryInsuranceInfo(): ?object
    {
        $primary = $this->primaryInsurance()->first();
        if ($primary) {
            return (object) [
                'name' => $primary->name,
                'code' => $primary->code,
                'number' => $primary->pivot->insurance_number,
                'valid_until' => $primary->pivot->valid_until,
                'coverage_percentage' => $primary->pivot->coverage_percentage,
            ];
        }
        
        // Fallback to legacy insurance
        if ($this->insurance_type_id && $this->insuranceType) {
            return (object) [
                'name' => $this->insuranceType->name,
                'code' => $this->insuranceType->code,
                'number' => $this->insurance_number,
                'valid_until' => $this->insurance_valid_until,
                'coverage_percentage' => $this->insurance_coverage_percentage ?? 100,
            ];
        }
        
        return null;
    }

    /**
     * Add a new insurance to this patient.
     */
    public function addInsurance(int $insuranceTypeId, array $details = []): void
    {
        // If this is set as primary, remove primary from others
        if ($details['is_primary'] ?? false) {
            $this->insurances()->updateExistingPivot(
                $this->insurances()->get()->pluck('id'), 
                ['is_primary' => false]
            );
        }

        $this->insurances()->syncWithoutDetaching([
            $insuranceTypeId => array_merge([
                'insurance_number' => null,
                'valid_from' => now(),
                'valid_until' => null,
                'coverage_percentage' => 100.00,
                'is_primary' => false,
                'status' => 'active',
                'notes' => null,
            ], $details)
        ]);
    }

    /**
     * Set default insurance as "Particular" for new patients.
     */
    protected static function booted(): void
    {
        static::created(function (Patient $patient) {
            // Auto-assign "Particular" insurance if no insurance_type_id is set
            if (!$patient->insurance_type_id) {
                $particularInsurance = InsuranceType::where('code', 'PARTICULAR')->first();
                if ($particularInsurance) {
                    $patient->addInsurance($particularInsurance->id, [
                        'is_primary' => true,
                        'insurance_number' => 'PARTICULAR-' . $patient->document_number,
                        'notes' => 'Seguro particular asignado automáticamente'
                    ]);
                }
            }
        });
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
        $primaryInfo = $this->getPrimaryInsuranceInfo();
        
        if (!$primaryInfo) {
            return 'Sin seguro válido';
        }

        $info = $primaryInfo->name;
        
        if ($primaryInfo->number) {
            $info .= ' - ' . $primaryInfo->number;
        }
        
        if ($primaryInfo->valid_until) {
            $validUntil = \Carbon\Carbon::parse($primaryInfo->valid_until);
            $info .= ' (Vence: ' . $validUntil->format('d/m/Y') . ')';
        }

        // Show total number of insurances if more than one
        $totalInsurances = $this->insurances()->count();
        if ($totalInsurances > 1) {
            $info .= " + " . ($totalInsurances - 1) . " más";
        }

        return $info;
    }
}
