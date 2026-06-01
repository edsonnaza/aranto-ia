<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
    public function samples()
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
