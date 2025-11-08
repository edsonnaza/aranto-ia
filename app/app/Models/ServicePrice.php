<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * @property int $id
 * @property int $service_id
 * @property int $insurance_type_id
 * @property float $price
 * @property \Illuminate\Support\Carbon $effective_from
 * @property \Illuminate\Support\Carbon|null $effective_until
 * @property int|null $created_by
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read string $formatted_price
 * @property-read string $status
 * @property-read int|null $days_until_expiry
 */
class ServicePrice extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'service_id',
        'insurance_type_id',
        'price',
        'effective_from',
        'effective_until',
        'created_by',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'float',
        'effective_from' => 'date',
        'effective_until' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the medical service this price belongs to.
     */
    public function medicalService(): BelongsTo
    {
        return $this->belongsTo(MedicalService::class, 'service_id');
    }

    /**
     * Get the insurance type this price is for.
     */
    public function insuranceType(): BelongsTo
    {
        return $this->belongsTo(InsuranceType::class);
    }

    /**
     * Get the user who created this price.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if this price is currently active.
     */
    public function isActive(?Carbon $date = null): bool
    {
        $date = $date ?? Carbon::now();
        $checkDate = $date->toDateString();

        return Carbon::parse($this->effective_from)->toDateString() <= $checkDate && 
               ($this->effective_until === null || Carbon::parse($this->effective_until)->toDateString() >= $checkDate);
    }

    /**
     * Check if this price is expired.
     */
    public function isExpired(?Carbon $date = null): bool
    {
        if ($this->effective_until === null) {
            return false;
        }

        $date = $date ?? Carbon::now();
        return Carbon::parse($this->effective_until)->toDateString() < $date->toDateString();
    }

    /**
     * Check if this price is future.
     */
    public function isFuture(?Carbon $date = null): bool
    {
        $date = $date ?? Carbon::now();
        return Carbon::parse($this->effective_from)->toDateString() > $date->toDateString();
    }

    /**
     * Scope to get only active prices.
     */
    public function scopeActive($query, ?Carbon $date = null)
    {
        $date = $date ?? Carbon::now();
        $dateString = $date->toDateString();

        return $query->where('effective_from', '<=', $dateString)
                    ->where(function ($query) use ($dateString) {
                        $query->whereNull('effective_until')
                              ->orWhere('effective_until', '>=', $dateString);
                    });
    }

    /**
     * Scope to get prices for specific insurance type.
     */
    public function scopeForInsurance($query, $insuranceTypeId)
    {
        return $query->where('insurance_type_id', $insuranceTypeId);
    }

    /**
     * Scope to get prices for specific service.
     */
    public function scopeForService($query, $serviceId)
    {
        return $query->where('service_id', $serviceId);
    }

    /**
     * Get formatted price.
     */
    public function getFormattedPriceAttribute(): string
    {
        return '₲ ' . number_format($this->price, 0, ',', '.');
    }

    /**
     * Get price status (active, expired, future).
     */
    public function getStatusAttribute(): string
    {
        if ($this->isFuture()) {
            return 'future';
        }

        if ($this->isExpired()) {
            return 'expired';
        }

        return 'active';
    }

    /**
     * Get days until expiry (null if no expiry date).
     */
    public function getDaysUntilExpiryAttribute(): ?int
    {
        if ($this->effective_until === null) {
            return null;
        }

        return Carbon::now()->diffInDays($this->effective_until, false);
    }

    /**
     * Check if price will expire soon (within specified days).
     */
    public function expiresSoon(int $days = 30): bool
    {
        if ($this->effective_until === null) {
            return false;
        }

        $expiryDate = Carbon::createFromFormat('Y-m-d', $this->effective_until);
        return $expiryDate->diffInDays(Carbon::now()) <= $days && !$this->isExpired();
    }
}
