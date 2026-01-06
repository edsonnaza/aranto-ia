<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * 
 * @property-read int $active_services_count
 */
class ServiceCategory extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all medical services in this category.
     */
    public function medicalServices(): HasMany
    {
        return $this->hasMany(MedicalService::class, 'category_id');
    }

    /**
     * Get all services in this category (many-to-many).
     */
    public function services()
    {
        return $this->belongsToMany(
            Service::class,
            'service_service_category',
            'service_category_id',
            'service_id'
        )->withTimestamps();
    }

    /**
     * Check if this category is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Scope to get only active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get count of active services in this category.
     */
    public function getActiveServicesCountAttribute(): int
    {
        return $this->medicalServices()->where('status', 'active')->count();
    }
}
