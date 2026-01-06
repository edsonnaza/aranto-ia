<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string|null $description
 * @property float $base_price
 * @property string $category
 * @property bool $is_active
 * @property float|null $professional_commission_percentage
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'base_price',
        'category',
        'is_active',
        'professional_commission_percentage',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'professional_commission_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relations
    public function serviceCategories()
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
    public function prices()
    {
        return $this->hasMany(ServicePrice::class, 'service_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByCode($query, $code)
    {
        return $query->where('code', $code);
    }

    // Helper methods
    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function calculateCommission(float $amount): float
    {
        return $amount * ($this->professional_commission_percentage / 100);
    }

    public function getFormattedPrice(): string
    {
        return '$' . number_format((float) $this->base_price, 2);
    }
}