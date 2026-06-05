<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $description
 * @property string|null $container_type
 * @property string|null $preservation_requirements
 * @property int|null $stability_hours
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class LabSampleType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'container_type',
        'preservation_requirements',
        'stability_hours',
        'status',
    ];

    protected $casts = [
        'stability_hours' => 'integer',
    ];

    /**
     * Relación con las muestras
     */
    public function samples(): HasMany
    {
        return $this->hasMany(LabSample::class);
    }

    /**
     * Scope para tipos activos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
