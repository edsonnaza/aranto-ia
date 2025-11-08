<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Specialty extends Model
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
     * Get the professionals with this specialty.
     */
    public function professionals(): BelongsToMany
    {
        return $this->belongsToMany(Professional::class, 'professional_specialties')
                    ->withPivot(['certification_date', 'certification_number', 'is_primary'])
                    ->withTimestamps();
    }

    /**
     * Get professionals where this is their primary specialty.
     */
    public function primaryProfessionals(): BelongsToMany
    {
        return $this->professionals()->wherePivot('is_primary', true);
    }

    /**
     * Check if this specialty is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Scope to get only active specialties.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to search specialties by name or code.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($query) use ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
        });
    }

    /**
     * Get count of active professionals with this specialty.
     */
    public function getActiveProfessionalsCountAttribute(): int
    {
        return $this->professionals()
                   ->where('professionals.status', 'active')
                   ->whereNull('professionals.termination_date')
                   ->count();
    }

    /**
     * Get count of professionals where this is primary specialty.
     */
    public function getPrimaryProfessionalsCountAttribute(): int
    {
        return $this->primaryProfessionals()
                   ->where('professionals.status', 'active')
                   ->whereNull('professionals.termination_date')
                   ->count();
    }
}
