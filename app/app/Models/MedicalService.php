<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class MedicalService extends Model
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
        'category_id',
        'duration_minutes',
        'requires_appointment',
        'requires_preparation',
        'preparation_instructions',
        'default_commission_percentage',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'requires_appointment' => 'boolean',
        'requires_preparation' => 'boolean',
        'default_commission_percentage' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the category this service belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    /**
     * Get all prices for this service.
     */
    public function servicePrices(): HasMany
    {
        return $this->hasMany(ServicePrice::class, 'service_id');
    }

    /**
     * Get current active prices for this service.
     */
    public function currentPrices(): HasMany
    {
        $today = Carbon::now()->format('Y-m-d');
        
        return $this->servicePrices()
            ->where('effective_from', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('effective_until')
                      ->orWhere('effective_until', '>=', $today);
            });
    }

    /**
     * Check if this service is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if this service requires appointment.
     */
    public function requiresAppointment(): bool
    {
        return $this->requires_appointment;
    }

    /**
     * Check if this service requires preparation.
     */
    public function requiresPreparation(): bool
    {
        return $this->requires_preparation;
    }

    /**
     * Scope to get only active services.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by category.
     */
    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Scope to filter services that require appointment.
     */
    public function scopeRequiresAppointment($query)
    {
        return $query->where('requires_appointment', true);
    }

    /**
     * Get price for specific insurance type.
     */
    public function getPriceForInsurance(InsuranceType $insuranceType, Carbon $date = null): ?ServicePrice
    {
        $date = $date ?? Carbon::now();
        $dateString = $date->format('Y-m-d');

        return $this->servicePrices()
            ->where('insurance_type_id', $insuranceType->id)
            ->where('effective_from', '<=', $dateString)
            ->where(function ($query) use ($dateString) {
                $query->whereNull('effective_until')
                      ->orWhere('effective_until', '>=', $dateString);
            })
            ->orderBy('effective_from', 'desc')
            ->first();
    }

    /**
     * Get all current prices grouped by insurance type.
     */
    public function getCurrentPricesByInsurance(): array
    {
        $prices = [];
        $currentPrices = $this->currentPrices()->with('insuranceType')->get();

        foreach ($currentPrices as $price) {
            $prices[$price->insuranceType->code] = [
                'insurance_type' => $price->insuranceType->name,
                'price' => $price->price,
                'formatted_price' => '₲ ' . number_format($price->price, 0, ',', '.'),
            ];
        }

        return $prices;
    }

    /**
     * Get formatted duration.
     */
    public function getFormattedDurationAttribute(): string
    {
        if ($this->duration_minutes < 60) {
            return $this->duration_minutes . ' minutos';
        }

        $hours = intval($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($minutes === 0) {
            return $hours . ' hora' . ($hours > 1 ? 's' : '');
        }

        return $hours . 'h ' . $minutes . 'm';
    }

    /**
     * Calculate commission amount for this service.
     */
    public function calculateCommission(float $servicePrice, float $customPercentage = null): float
    {
        $percentage = $customPercentage ?? $this->default_commission_percentage;
        return $servicePrice * ($percentage / 100);
    }
}
