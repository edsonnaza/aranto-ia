<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\InsuranceType;
use App\Traits\Auditable;

/**
 * @property int $id
 * @property string $name
 * @property string|null $code
 * @property string|null $description
 * @property int|null $category_id
 * @property int $duration_minutes
 * @property bool $requires_appointment
 * @property bool $requires_preparation
 * @property string|null $preparation_instructions
 * @property float $default_commission_percentage
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * 
 * @property-read string $formatted_duration
 */
class MedicalService extends Model
{
    /** @use HasFactory<\Database\Factories\MedicalServiceFactory> */
    use HasFactory, Auditable;
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
        'default_commission_percentage' => 'float',
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
     * Get all categories for this service (many-to-many via pivot).
     * Nota: Actualmente usamos relación 1:N (category_id), pero esta relación
     * se mantiene para compatibilidad con datos históricos en tabla pivot.
     */
    public function categories()
    {
        return $this->belongsToMany(
            ServiceCategory::class,
            'service_service_category',
            'service_id',
            'service_category_id'
        )->withTimestamps();
    }

    /**
     * Get all prices for this service.
     */
    public function servicePrices(): HasMany
    {
        return $this->hasMany(ServicePrice::class, 'service_id');
    }

    /**
     * Alias for servicePrices (for frontend compatibility)
     */
    public function prices(): HasMany
    {
        return $this->servicePrices();
    }

    /**
     * Get current active prices for this service.
     * First tries to get prices within valid date range.
     * If none found, returns the most recent price (ordered by effective_from DESC).
     */
    public function currentPrices(): HasMany
    {
        $today = Carbon::now()->toDateString();
        
        return $this->servicePrices()
            ->where(function ($query) use ($today) {
                // First priority: prices within valid date range
                $query->where('effective_from', '<=', $today)
                      ->where(function ($subquery) use ($today) {
                          $subquery->whereNull('effective_until')
                                   ->orWhere('effective_until', '>=', $today);
                      });
            })
            ->orWhere(function ($query) use ($today) {
                // Fallback: if no valid date range, get the most recent price
                // (This allows prices set for future dates to be used)
                $query->whereIn('id', function ($subquery) use ($today) {
                    $subquery->select(DB::raw('MAX(id)'))
                             ->from('service_prices')
                             ->where('service_id', $this->id)
                             ->groupBy('insurance_type_id');
                });
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
    public function getPriceForInsurance(InsuranceType $insuranceType, ?Carbon $date = null): ?ServicePrice
    {
        $date = $date ?? Carbon::now();
        $dateString = $date->toDateString();

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
    public function calculateCommission(float $servicePrice, ?float $customPercentage = null): float
    {
        $percentage = $customPercentage ?? $this->default_commission_percentage;
        return $servicePrice * ($percentage / 100);
    }
}
