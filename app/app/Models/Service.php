<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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