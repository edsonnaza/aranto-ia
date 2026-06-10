<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabTestParameter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'lab_test_profile_id',
        'name',
        'code',
        'unit',
        'display_order',
        'parameter_type',
        'is_required',
        'status',
        'include_in_sum_100',
        'formula',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'status' => 'string',
        'include_in_sum_100' => 'boolean',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(LabTestProfile::class, 'lab_test_profile_id');
    }

    public function referenceRanges(): HasMany
    {
        return $this->hasMany(LabReferenceRange::class);
    }

    public function equipmentParameterRanges(): HasMany
    {
        return $this->hasMany(LabEquipmentParameterRange::class);
    }
}
