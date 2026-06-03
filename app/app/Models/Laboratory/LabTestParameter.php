<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
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
        'include_in_sum_100',
        'formula',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'include_in_sum_100' => 'boolean',
    ];

    public function profile() {
        return $this->belongsTo(LabTestProfile::class, 'lab_test_profile_id');
    }
    public function referenceRanges() {
        return $this->hasMany(LabReferenceRange::class);
    }
    public function equipmentParameterRanges() {
        return $this->hasMany(LabEquipmentParameterRange::class);
    }
}